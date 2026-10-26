// 三鳳の小さなサーバー（Netlify Functions + Netlify Blobs）
//   /api/feedback … 開発者への意見（送るのは誰でも、読むのは開発者の鍵が必要）
//   /api/rules    … 遊んでいる人が作ったルール（開発者がCPUを学習させるため。中身は公開）
//   /api/week     … 友人戦の週間ポイント（フレンドの週間1位ボーナス用）
//   /api/cup      … 週末大会（配牌固定戦）の成績（その週の最高）
//   /api/fr       … フレンド申請の受け箱（申請・承認・拒否。相手がアプリを閉じていても届く）
//   /api/acct     … アカウント（ID＋パスワード）の登録・ログイン・ログアウト
//   /api/sync     … アカウントのデータの同期（端末ごとの変更を、項目ごとの新しい方で合わせる）
//   /api/league   … リーグ（仲間うちの友人戦の通算順位表。参加コードを知っている人だけ）
//   /api/err      … アプリの不具合の自動報告（同じ内容はまとめて数える。読むのは開発者だけ）
//   /api/usage    … 利用状況（1日ごとの端末数と機能ごとの回数・使っている人ごとの名前・フレンドコード・アカウントID・最後に開いた時刻と回数）
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
    if (path === 'cup') {
      // 週末大会（配牌固定戦）：その週の同じ配牌で打った成績の最高を残す
      const st = getStore('cup');
      if (req.method === 'POST') {
        const b = await body(req, 2000);
        const code = str(b?.code, 8), wk = str(b?.wk, 10), token = str(b?.token, 64);
        if (!/^[A-HJ-NP-Z2-9]{8}$/.test(code) || !/^\d{4}-\d{2}-\d{2}$/.test(wk) || token.length < 16) return json({ error: 'bad' }, 400);
        const sc = Number(b.score), pts = Number(b.points), rank = Number(b.rank);
        if (!isFinite(sc) || Math.abs(sc) > 1000 || !isFinite(pts) || Math.abs(pts) > 500000 || ![1, 2, 3].includes(rank)) return json({ error: 'bad' }, 400);
        if (await limited('cup', context.ip, 60)) return json({ error: 'limit' }, 429);
        if (!(await owner(code, token))) return json({ error: 'owner' }, 403);
        // 開催期間（金曜0時〜日曜24時・日本時間。終わりぎわに始めた対局のため6時間の猶予）の中だけ
        const mon = Date.parse(wk + 'T00:00:00+09:00');
        if (!isFinite(mon) || new Date(mon + 9 * 3600e3).getUTCDay() !== 1 || Date.now() < mon + 4 * 864e5 || Date.now() > mon + 7 * 864e5 + 6 * 3600e3) return json({ error: '大会の期間外です' }, 409);
        const key = `${wk}/${code}`;
        const cur = await st.get(key, { type: 'json' });
        if ((cur?.tries ?? 0) >= 3) return json({ error: '挑戦は1人3回までです' }, 409);
        const tries = (cur?.tries ?? 0) + 1;
        const better = !cur || sc > cur.score;
        await st.setJSON(key, { ...(better ? { score: Math.round(sc * 10) / 10, points: Math.round(pts), rank } : cur), tries, name: str(b?.name, 10) || cur?.name || '', at: Date.now() });
        return json({ ok: true, best: better });
      }
      if (req.method === 'GET') {
        const wk = str(url.searchParams.get('wk'), 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(wk)) return json({ error: 'bad' }, 400);
        const blobs = (await st.list({ prefix: `${wk}/` })).blobs.slice(0, 500);
        const all = (await Promise.all(blobs.map(async x => { const v = await st.get(x.key, { type: 'json' }); return v ? { code: x.key.slice(wk.length + 1), name: v.name, score: v.score, points: v.points, rank: v.rank, tries: v.tries } : null; }))).filter(Boolean);
        all.sort((a, b) => b.score - a.score || b.points - a.points);
        return json({ wk, count: all.length, list: all.slice(0, 50) });
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
      // ログイン中の端末の一覧（同期した時刻つき）と、ほかの端末のログアウト
      if (op === 'devices' || op === 'revoke') {
        const u = await st.get(key, { type: 'json' });
        const th = await sha('tok:' + str(b?.token, 80));
        if (!u || !(u.tokens ?? []).some(t => t.h === th)) return json({ error: 'もう一度ログインしてください' }, 401);
        if (op === 'revoke') {
          const at = Number(b?.at);
          u.tokens = u.tokens.filter(t => t.h === th || (b?.all ? false : t.at !== at));
          await st.setJSON(key, u);
        }
        return json({ ok: true, devices: u.tokens.map(t => ({ at: t.at, seen: t.seen ?? t.at, dev: t.dev ?? '', me: t.h === th })) });
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
      // パスワードの変更（ほかの端末はログアウトになる）・アカウントの削除（データも消す）
      if (op === 'passwd' || op === 'delete') {
        if (await limited('login', context.ip, 60) || await limited('login-' + id, 'id', 30)) return json({ error: '試行が多すぎます。明日またお試しください' }, 429);
        const u = await st.get(key, { type: 'json' });
        if (!u || (await pbkdf(pass, u.salt)) !== u.hash) return json({ error: 'パスワードが違います' }, 401);
        if (op === 'delete') {
          const ds = getStore('acctdata');
          const all = (await ds.list({ prefix: `${id}/` })).blobs;
          for (const x of all) await ds.delete(x.key);
          await st.delete(key);
          return json({ ok: true });
        }
        const np = typeof b?.newPass === 'string' ? b.newPass : '';
        if (np.length < 6 || np.length > 64) return json({ error: '新しいパスワードは6〜64文字です' }, 400);
        u.salt = rnd(16); u.hash = await pbkdf(np, u.salt);
        const tok = rnd(32);
        u.tokens = [{ h: await sha('tok:' + tok), at: Date.now(), dev: str(b?.dev, 60) }];
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
      // 端末ごとの最後に同期した時刻（書き込みを減らすため10分に1回だけ記録）
      const tk = u.tokens.find(t => t.h === th);
      if (tk && Date.now() - (tk.seen ?? 0) > 600000) { tk.seen = Date.now(); await getStore('acct').setJSON(`u/${id}`, u); }
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

    if (path === 'league') {
      // リーグ：meta（名前・作った人）・メンバーは1人1件（同時に入っても消えないように）・メンバーごとの結果（gid → [点, 着順, 時刻]）
      const st = getStore('league');
      const CODE = /^[A-HJ-NP-Z2-9]{8}$/, LID = /^[A-HJ-NP-Z2-9]{6}$/;
      const membersOf = async id => {
        const keys = (await st.list({ prefix: `${id}/mem/` })).blobs.map(x => x.key);
        const ms = (await Promise.all(keys.map(k => st.get(k, { type: 'json' })))).filter(Boolean);
        return ms.sort((a, b) => a.at - b.at);
      };
      const metaOut = async (id, meta) => ({ name: meta.name, owner: meta.owner, created: meta.created, members: (await membersOf(id)).map(m => ({ code: m.code, name: m.name })) });
      if (req.method === 'POST') {
        const b = await body(req, 20000);
        const op = str(b?.op, 8), code = str(b?.code, 8), token = str(b?.token, 64);
        if (!CODE.test(code) || token.length < 16) return json({ error: 'bad' }, 400);
        if (await limited('lg', context.ip, 300)) return json({ error: 'limit' }, 429);
        if (!(await owner(code, token))) return json({ error: 'owner' }, 403);
        const me = str(b?.me, 10) || '名無し';
        if (op === 'create') {
          if (await limited('lgc', context.ip, 10)) return json({ error: '今日はこれ以上作れません' }, 429);
          const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
          let id = '';
          for (let i = 0; i < 5 && (!id || await st.get(`${id}/meta`)); i++) id = Array.from(crypto.getRandomValues(new Uint8Array(6)), x => A[x % A.length]).join('');
          const meta = { name: str(b?.name, 20) || 'リーグ', owner: code, created: Date.now() };
          await st.setJSON(`${id}/meta`, meta);
          await st.setJSON(`${id}/mem/${code}`, { code, name: me, at: Date.now() });
          return json({ ok: true, id, meta: await metaOut(id, meta) });
        }
        const id = str(b?.id, 6);
        if (!LID.test(id)) return json({ error: 'リーグのコードが違います' }, 400);
        const meta = await st.get(`${id}/meta`, { type: 'json' });
        if (!meta) return json({ error: 'リーグが見つかりません' }, 404);
        const mine = await st.get(`${id}/mem/${code}`, { type: 'json' });
        if (op === 'join') {
          if (!mine && (await st.list({ prefix: `${id}/mem/` })).blobs.length >= 30) return json({ error: 'このリーグは満員です（30人まで）' }, 409);
          await st.setJSON(`${id}/mem/${code}`, { code, name: me, at: mine?.at ?? Date.now() });
          return json({ ok: true, id, meta: await metaOut(id, meta) });
        }
        if (!mine) return json({ error: 'このリーグに入っていません' }, 403);
        if (op === 'leave') {
          await st.delete(`${id}/mem/${code}`);
          await st.delete(`${id}/m/${code}`);
          const rest = await membersOf(id);
          if (!rest.length) await st.delete(`${id}/meta`);
          else if (meta.owner === code) { meta.owner = rest[0].code; await st.setJSON(`${id}/meta`, meta); }
          return json({ ok: true });
        }
        if (op === 'rename') {
          if (meta.owner !== code) return json({ error: '名前を変えられるのは作った人だけです' }, 403);
          meta.name = str(b?.name, 20) || meta.name;
          await st.setJSON(`${id}/meta`, meta);
          return json({ ok: true, meta: await metaOut(id, meta) });
        }
        if (op === 'result') {
          const items = Array.isArray(b?.items) ? b.items.slice(0, 100) : [];
          const cur = (await st.get(`${id}/m/${code}`, { type: 'json' })) ?? { g: {} };
          let n = 0;
          for (const x of items) {
            const gid = str(x?.gid, 24), sc = Number(x?.score), rk = Number(x?.rank), at = Number(x?.at);
            if (!/^[A-Za-z0-9-]{4,24}$/.test(gid) || !isFinite(sc) || Math.abs(sc) > 1000 || ![1, 2, 3].includes(rk) || !isFinite(at)) continue;
            if (cur.g[gid]) continue;
            cur.g[gid] = [Math.round(sc * 10) / 10, rk, Math.round(at)]; n++;
          }
          const keys = Object.keys(cur.g);
          if (keys.length > 3000) for (const k of keys.sort((a, b) => cur.g[a][2] - cur.g[b][2]).slice(0, keys.length - 3000)) delete cur.g[k];
          if (n) await st.setJSON(`${id}/m/${code}`, cur);
          return json({ ok: true, added: n });
        }
        return json({ error: 'bad' }, 400);
      }
      if (req.method === 'GET') {
        const id = str(url.searchParams.get('id'), 6);
        if (!LID.test(id)) return json({ error: 'bad' }, 400);
        const meta = await st.get(`${id}/meta`, { type: 'json' });
        if (!meta) return json({ error: 'リーグが見つかりません' }, 404);
        const m = await metaOut(id, meta);
        const res = {};
        await Promise.all(m.members.map(async x => { const v = await st.get(`${id}/m/${x.code}`, { type: 'json' }); res[x.code] = v?.g ?? {}; }));
        return json({ id, meta: m, results: res });
      }
    }
    // 共有の窓口（src/net/shared.ts）：場所ごとに、各自が自分の分を1件だけ書き、全員の分を一覧で読む
    if (path === 'shared') {
      const st = getStore('shared');
      if (req.method === 'POST') {
        const b = await body(req, 2600);
        const space = str(b?.space, 24), code = str(b?.code, 8), token = str(b?.token, 64);
        if (!/^[a-z0-9-]{1,24}$/.test(space) || !/^[A-HJ-NP-Z2-9]{8}$/.test(code) || token.length < 16 || b?.data === undefined) return json({ error: 'bad' }, 400);
        if (JSON.stringify(b.data).length > 2000) return json({ error: 'big' }, 413);
        if (await limited('sh', context.ip, 300)) return json({ error: 'limit' }, 429);
        // 最初に送ってきた端末の合言葉だけ受け付ける（他人の分を書き換えられないように）
        if (!(await owner(code, token))) return json({ error: 'owner' }, 403);
        await st.setJSON(`${space}/${code}`, { data: b.data, at: Date.now() });
        return json({ ok: true });
      }
      if (req.method === 'GET') {
        const space = str(url.searchParams.get('space'), 24);
        if (!/^[a-z0-9-]{1,24}$/.test(space)) return json({ error: 'bad' }, 400);
        if (await limited('shr', context.ip, 400)) return json({ error: 'limit' }, 429);
        const { blobs } = await st.list({ prefix: `${space}/` });
        const keys = blobs.map(x => x.key).slice(0, 300);
        const list = (await Promise.all(keys.map(async k => { const v = await st.get(k, { type: 'json' }); return v ? { who: k.slice(space.length + 1), data: v.data, at: v.at } : null; }))).filter(Boolean);
        return json({ space, list });
      }
    }
    if (path === 'err') {
      // 不具合の自動報告：同じ内容（メッセージ＋場所）は1件にまとめ、回数と最後の時刻だけ増やす
      const st = getStore('errs');
      if (req.method === 'POST') {
        const b = await body(req, 6000);
        const msg = str(b?.msg, 300), stack = str(b?.stack, 1500), ver = str(b?.ver, 16), where = str(b?.where, 40), dev = str(b?.dev, 120);
        if (!msg) return json({ error: 'bad' }, 400);
        if (await limited('err', context.ip, 60)) return json({ ok: true, skipped: true });
        const key = (await sha(`${msg}|${stack.split('\n').slice(0, 2).join('|')}|${ver}`)).slice(0, 24);
        const cur = await st.get(key, { type: 'json' });
        await st.setJSON(key, cur ? { ...cur, n: cur.n + 1, last: Date.now(), where: where || cur.where } : { msg, stack, ver, where, dev, n: 1, first: Date.now(), last: Date.now() });
        return json({ ok: true });
      }
      if (!admin) return json({ error: 'admin' }, 403);
      if (req.method === 'GET') {
        const blobs = (await listAll(st)).slice(0, 300);
        const items = (await Promise.all(blobs.map(async x => ({ key: x.key, ...(await st.get(x.key, { type: 'json' })) })))).filter(x => x.msg);
        items.sort((a, b) => b.last - a.last);
        return json({ items });
      }
      if (req.method === 'DELETE') { const k = str(url.searchParams.get('key'), 64); if (k === 'all') { for (const x of await listAll(st)) await st.delete(x.key); } else await st.delete(k); return json({ ok: true }); }
    }
    if (path === 'usage') {
      // 利用状況：日ごとの「送ってきた端末の数」と「機能ごとの回数」、使っている人ごとの記録（開発者だけが見る）
      const st = getStore('usage');
      const us = getStore('users');
      const EV = ['open', 'cpu', 'friend', 'practice', 'review', 'stats', 'gacha', 'lesson', 'watch', 'cup', 'weekcup', 'league', 'whatif', 'manual', 'newdev', 'pwa', 'portrait'];
      if (req.method === 'POST') {
        const b = await body(req, 3000);
        const w = b?.who && typeof b.who === 'object' ? b.who : null;
        const code = str(w?.code, 16).replace(/[^A-Za-z0-9-]/g, ''), acct = str(w?.acct, 32).replace(/[^A-Za-z0-9_.-]/g, '');
        const ukey = acct ? `a-${acct}` : code ? `c-${code}` : '';
        /** 使っている人の記録を更新（開いた回数・最後に開いた時刻・機能ごとの回数） */
        const touch = async (ev) => {
          if (!ukey) return;
          const u = (await us.get(ukey, { type: 'json' })) ?? { first: Date.now(), opens: 0, ev: {} };
          u.code = code || u.code || ''; u.acct = acct || u.acct || ''; u.name = str(w?.name, 20) || u.name || '';
          u.ver = str(w?.ver, 20); u.dev = str(w?.dev, 160); u.pwa = w?.pwa === true;
          if (!ev) { u.opens = (u.opens ?? 0) + 1; u.last = Date.now(); }
          else for (const k of EV) { const v = Number(ev[k]); if (Number.isInteger(v) && v > 0) u.ev[k] = (u.ev[k] ?? 0) + Math.min(v, 500); }
          await us.setJSON(ukey, u);
        };
        if (b?.hello === true) {
          if (await limited('hello', context.ip, 30)) return json({ ok: true, skipped: true });
          await touch(null);
          return json({ ok: true });
        }
        const d = str(b?.day, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || Math.abs(Date.parse(d) - Date.now()) > 40 * 864e5) return json({ error: 'bad' }, 400);
        if (await limited('use', context.ip, 60)) return json({ ok: true, skipped: true });
        const cur = (await st.get(d, { type: 'json' })) ?? { devs: 0, ev: {} };
        cur.devs++;
        for (const k of EV) { const v = Number(b?.ev?.[k]); if (Number.isInteger(v) && v > 0) cur.ev[k] = (cur.ev[k] ?? 0) + Math.min(v, 500); }
        await st.setJSON(d, cur);
        await touch(b?.ev && typeof b.ev === 'object' ? b.ev : {});
        return json({ ok: true });
      }
      if (req.method === 'GET') {
        if (!admin) return json({ error: 'admin' }, 403);
        const blobs = (await listAll(st)).map(x => x.key).sort().slice(-90);
        const days = await Promise.all(blobs.map(async k => ({ day: k, ...(await st.get(k, { type: 'json' })) })));
        const ukeys = (await listAll(us)).map(x => x.key).slice(0, 500);
        const users = (await Promise.all(ukeys.map(async k => ({ key: k, ...(await us.get(k, { type: 'json' })) })))).sort((a, b) => (b.last ?? 0) - (a.last ?? 0));
        return json({ days, users });
      }
    }
    return json({ error: 'not found' }, 404);
  } catch (e) {
    return json({ error: 'server' }, 500);
  }
};

export const config = { path: '/api/*' };
