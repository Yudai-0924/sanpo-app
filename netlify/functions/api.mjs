// 三鳳の小さなサーバー（Netlify Functions + Netlify Blobs）
//   /api/feedback … 開発者への意見（送るのは誰でも、読むのは開発者の鍵が必要）
//   /api/rules    … 遊んでいる人が作ったルール（開発者がCPUを学習させるため。中身は公開）
//   /api/week     … 友人戦の週間ポイント（フレンドの週間1位ボーナス用）
import { getStore } from '@netlify/blobs';

// 開発者の鍵（そのものではなく SHA-256。鍵は開発者だけが持つ）
const ADMIN = '3281af2469ee696e90b0f135bee186c5d8a0cfd8c288e9f526f473463d31dd60';
const CATS = ['bug', 'idea', 'cpu', 'other'];

const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const sha = async s => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))), b => b.toString(16).padStart(2, '0')).join('');
const str = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, max) : '');
const day = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);

/** 1日あたりの回数制限（IPはそのまま残さず、ハッシュにする） */
async function limited(kind, ip, max) {
  const st = getStore('limits');
  const k = `${day()}:${kind}:${(await sha('sanpo:' + (ip || '?'))).slice(0, 20)}`;
  const n = Number(await st.get(k)) || 0;
  if (n >= max) return true;
  await st.set(k, String(n + 1));
  return false;
}
async function body(req, max = 8000) {
  const t = await req.text();
  if (t.length > max) return null;
  try { return JSON.parse(t); } catch { return null; }
}
async function listAll(st) { return (await st.list()).blobs; }

export default async (req, context) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');
  const admin = (await sha(req.headers.get('x-admin-key') || '')) === ADMIN;
  try {
    if (path === 'feedback') {
      const st = getStore('feedback');
      if (req.method === 'POST') {
        const b = await body(req);
        const text = str(b?.text, 2000);
        if (!text) return json({ error: '本文がありません' }, 400);
        if (await limited('fb', context.ip, 10)) return json({ error: '今日はこれ以上送れません。明日またお願いします' }, 429);
        const item = { t: Date.now(), cat: CATS.includes(b.cat) ? b.cat : 'other', text, name: str(b.name, 24), contact: str(b.contact, 80), ver: str(b.ver, 16), dev: str(b.dev, 120), friend: str(b.friend, 10) };
        await st.setJSON(`${item.t}-${Math.random().toString(36).slice(2, 8)}`, item);
        return json({ ok: true });
      }
      if (req.method === 'GET') {
        const blobs = await listAll(st);
        if (!admin) return json({ count: blobs.length });
        const items = await Promise.all(blobs.map(async b => ({ key: b.key, ...(await st.get(b.key, { type: 'json' })) })));
        items.sort((a, b) => b.t - a.t);
        return json({ items });
      }
      if (req.method === 'DELETE' && admin) { await st.delete(str(url.searchParams.get('key'), 64)); return json({ ok: true }); }
    }
    if (path === 'rules') {
      const st = getStore('rules');
      if (req.method === 'POST') {
        const b = await body(req);
        const key = str(b?.key, 12);
        if (!/^[0-9a-z]{1,12}$/.test(key) || !b.rules || typeof b.rules !== 'object' || Array.isArray(b.rules)) return json({ error: 'bad rules' }, 400);
        if (await limited('rl', context.ip, 30)) return json({ error: 'limit' }, 429);
        const prev = await st.get(key, { type: 'json' });
        const now = Date.now();
        await st.setJSON(key, { key, rules: prev?.rules ?? b.rules, name: prev?.name ?? str(b.rules.name, 40), n: (prev?.n ?? 0) + 1, first: prev?.first ?? now, last: now });
        return json({ ok: true, n: (prev?.n ?? 0) + 1 });
      }
      if (req.method === 'GET') {
        const blobs = await listAll(st);
        const items = await Promise.all(blobs.map(b => st.get(b.key, { type: 'json' })));
        return json({ items: items.filter(Boolean).sort((a, b) => b.n - a.n) });
      }
    }
    if (path === 'week') {
      const st = getStore('week');
      if (req.method === 'POST') {
        const b = await body(req, 2000);
        const code = str(b?.code, 8), wk = str(b?.wk, 10), token = str(b?.token, 64);
        if (!/^[A-HJ-NP-Z2-9]{8}$/.test(code) || !/^\d{4}-\d{2}-\d{2}$/.test(wk) || token.length < 16) return json({ error: 'bad' }, 400);
        const p = Number(b.p), g = Number(b.g);
        if (!isFinite(p) || Math.abs(p) > 1e6 || !Number.isInteger(g) || g < 0 || g > 5000) return json({ error: 'bad' }, 400);
        if (await limited('wk', context.ip, 200)) return json({ error: 'limit' }, 429);
        // 最初に送ってきた端末の合言葉だけ受け付ける（他人のコードで書き換えられないように）
        const owners = getStore('owners');
        const th = await sha('owner:' + token);
        const own = await owners.get(code);
        if (own && own !== th) return json({ error: 'owner' }, 403);
        if (!own) await owners.set(code, th);
        await st.setJSON(`${wk}/${code}`, { p: Math.round(p * 10) / 10, g, at: Date.now() });
        return json({ ok: true });
      }
      if (req.method === 'GET') {
        const wk = str(url.searchParams.get('wk'), 10);
        const codes = str(url.searchParams.get('codes'), 1200).split(',').filter(c => /^[A-HJ-NP-Z2-9]{8}$/.test(c)).slice(0, 120);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(wk)) return json({ error: 'bad' }, 400);
        const out = {};
        await Promise.all(codes.map(async c => { const v = await st.get(`${wk}/${c}`, { type: 'json' }); if (v) out[c] = { p: v.p, g: v.g }; }));
        return json({ wk, totals: out });
      }
    }
    return json({ error: 'not found' }, 404);
  } catch (e) {
    return json({ error: 'server' }, 500);
  }
};

export const config = { path: '/api/*' };
