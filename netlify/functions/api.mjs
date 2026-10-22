// 三鳳の小さなサーバー（Netlify Functions + Netlify Blobs）
//   /api/feedback … 開発者への意見（送るのは誰でも、読むのは開発者の鍵が必要）
//   /api/rules    … 遊んでいる人が作ったルール（開発者がCPUを学習させるため。中身は公開）
//   /api/week     … 友人戦の週間ポイント（フレンドの週間1位ボーナス用）
//   /api/fr       … フレンド申請の受け箱（申請・承認・拒否。相手がアプリを閉じていても届く）
//   /api/acct     … アカウント（ID＋パスワード）の登録・ログイン・ログアウト
//   /api/sync     … アカウントのデータの同期（端末ごとの変更を、項目ごとの新しい方で合わせる）
import { getStore as gs } from '@netlify/blobs';
// 書いたものがすぐ読めるように（既定は反映まで最大1分ほど遅れる）
const getStore = name => gs({ name, consistency: 'strong' });

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
/** フレンドコードの持ち主か（最初に使った端末の合言葉だけ受け付ける） */
async function owner(code, token) {
  const owners = getStore('owners');
  const th = await sha('owner:' + token);
  const own = await owners.get(code);
  if (own && own !== th) return false;
  if (!own) await owners.set(code, th);
  return true;
}
async function listAll(st) { return (await st.list()).blobs; }
const rnd = n => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => b.toString(16).padStart(2, '0')).join('');
/** パスワードはそのまま保存せず、塩を足して何度もハッシュした値だけを残す */
async function pbkdf(pass, salt) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' }, k, 256);
  return Array.from(new Uint8Array(bits), b => b.toString(16).padStart(2, '0')).join('');
}

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
        if (!(await owner(code, token))) return json({ error: 'owner' }, 403);
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
    if (path === 'fr') {
      // フレンド申請の受け箱：送り主→相手 の最新の1通だけを残す。読むと消える
      const st = getStore('fr');
      const code = req.method === 'GET' ? str(url.searchParams.get('code'), 8) : '';
      if (req.method === 'POST') {
        const b = await body(req, 3000);
        const from = str(b?.from, 8), to = str(b?.to, 8), t = str(b?.t, 4), token = str(b?.token, 64);
        if (!/^[A-HJ-NP-Z2-9]{8}$/.test(from) || !/^[A-HJ-NP-Z2-9]{8}$/.test(to) || from === to || !['req', 'acc', 'rej'].includes(t) || token.length < 16) return json({ error: 'bad' }, 400);
        if (!(await owner(from, token))) return json({ error: 'owner' }, 403);
        if (await limited('fr', context.ip, 100)) return json({ error: 'limit' }, 429);
        const ps = b.p && typeof b.p === 'object' ? JSON.stringify(b.p) : '{}';
        const p = ps.length <= 2000 ? JSON.parse(ps) : {};
        await st.setJSON(`${to}/${from}`, { t, p, at: Date.now() });
        return json({ ok: true });
      }
      if (req.method === 'GET') {
        const token = str(req.headers.get('x-token'), 64);
        if (!/^[A-HJ-NP-Z2-9]{8}$/.test(code) || token.length < 16) return json({ error: 'bad' }, 400);
        if (!(await owner(code, token))) return json({ error: 'owner' }, 403);
        const { blobs } = await st.list({ prefix: `${code}/` });
        const items = [];
        for (const b of blobs.slice(0, 50)) {
          const v = await st.get(b.key, { type: 'json' });
          if (v) items.push({ from: b.key.slice(code.length + 1), ...v });
          await st.delete(b.key);
        }
        return json({ items });
      }
    }
    if (path === 'acct') {
      if (req.method !== 'POST') return json({ error: 'bad' }, 400);
      const b = await body(req, 2000);
      const op = str(b?.op, 10), id = str(b?.id, 20).toLowerCase();
      if (!/^[a-z0-9_]{3,20}$/.test(id)) return json({ error: 'IDは半角の英小文字・数字・_ で3〜20文字です' }, 400);
      const st = getStore('acct');
      const key = `u/${id}`;
      if (op === 'logout') {
        const u = await st.get(key, { type: 'json' });
        const th = await sha('tok:' + str(b?.token, 80));
        if (u) { u.tokens = (u.tokens ?? []).filter(t => t.h !== th); await st.setJSON(key, u); }
        return json({ ok: true });
      }
      const pass = typeof b?.pass === 'string' ? b.pass : '';
      if (pass.length < 6 || pass.length > 64) return json({ error: 'パスワードは6〜64文字です' }, 400);
      if (op === 'register') {
        if (await limited('reg', context.ip, 10)) return json({ error: '今日はこれ以上登録できません' }, 429);
        if (await st.get(key)) return json({ error: 'このIDはすでに使われています' }, 409);
        const salt = rnd(16);
        const u = { salt, hash: await pbkdf(pass, salt), tokens: [], created: Date.now() };
        const tok = rnd(32);
        u.tokens.push({ h: await sha('tok:' + tok), at: Date.now(), dev: str(b?.dev, 60) });
        await st.setJSON(key, u);
        return json({ ok: true, token: tok, id });
      }
      if (op === 'login') {
        if (await limited('login', context.ip, 60) || await limited('login-' + id, 'id', 30)) return json({ error: 'ログインの試行が多すぎます。明日またお試しください' }, 429);
        const u = await st.get(key, { type: 'json' });
        if (!u || (await pbkdf(pass, u.salt)) !== u.hash) return json({ error: 'IDかパスワードが違います' }, 401);
        const tok = rnd(32);
        u.tokens = [...(u.tokens ?? []), { h: await sha('tok:' + tok), at: Date.now(), dev: str(b?.dev, 60) }].slice(-10);
        await st.setJSON(key, u);
        return json({ ok: true, token: tok, id });
      }
      return json({ error: 'bad' }, 400);
    }
    if (path === 'sync') {
      const id = str(req.headers.get('x-acct-id'), 20).toLowerCase(), tok = str(req.headers.get('x-acct-token'), 80);
      if (!/^[a-z0-9_]{3,20}$/.test(id) || tok.length < 20) return json({ error: 'auth' }, 401);
      const u = await getStore('acct').get(`u/${id}`, { type: 'json' });
      const th = await sha('tok:' + tok);
      if (!u || !(u.tokens ?? []).some(t => t.h === th)) return json({ error: 'auth' }, 401);
      if (await limited('sync', context.ip, 5000)) return json({ error: 'limit' }, 429);
      const ds = getStore('acctdata');
      const idxKey = `${id}/idx`;
      const idx = (await ds.get(idxKey, { type: 'json' })) ?? { rev: 0, e: {} };
      const okPath = p => typeof p === 'string' && /^(s\/sanma\.[a-z.]{2,30}|[rk]\/[A-Za-z0-9_\-.]{1,80})$/.test(p);
      if (req.method === 'GET') {
        // since より後に変わった項目を返す（多すぎるときは途中まで。more で続き）
        const since = Math.max(0, Number(url.searchParams.get('since')) || 0);
        const list = Object.entries(idx.e).filter(([, e]) => e.r > since).sort((a, b) => a[1].r - b[1].r);
        const out = []; let size = 0, upto = since, more = false;
        for (const [p, e] of list) {
          if (size > 3_000_000 || out.length >= 400) { more = true; break; }
          const v = e.d ? null : await ds.get(`${id}/d/${p}`, { type: 'json' });
          out.push({ p, t: e.t, v: e.d ? null : (v === null || v === undefined ? null : v) });
          size += v ? JSON.stringify(v).length : 10; upto = e.r;
        }
        return json({ rev: more ? upto : idx.rev, changes: out, more });
      }
      if (req.method === 'POST') {
        const b = await body(req, 5_500_000);
        if (!b || !Array.isArray(b.changes)) return json({ error: 'bad' }, 400);
        let applied = 0;
        const rev = idx.rev + 1;
        for (const c of b.changes.slice(0, 500)) {
          if (!okPath(c?.p) || typeof c.t !== 'number') continue;
          const cur = idx.e[c.p];
          if (cur && cur.t >= c.t) continue;
          if (c.v === null || c.v === undefined) { await ds.delete(`${id}/d/${c.p}`); idx.e[c.p] = { t: c.t, r: rev, d: 1 }; }
          else { if (JSON.stringify(c.v).length > 1_500_000) continue; await ds.setJSON(`${id}/d/${c.p}`, c.v); idx.e[c.p] = { t: c.t, r: rev }; }
          applied++;
        }
        if (applied) { idx.rev = rev; await ds.setJSON(idxKey, idx); }
        return json({ ok: true, rev: idx.rev, applied });
      }
    }
    return json({ error: 'not found' }, 404);
  } catch (e) {
    return json({ error: 'server' }, 500);
  }
};

export const config = { path: '/api/*' };
