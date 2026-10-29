// 三鳳の小さなサーバー（Netlify Functions + Netlify Blobs）
//   /api/rules    … 遊んでいる人が作ったルール（開発者がCPUを学習させるため。中身は公開）
//   /api/week     … 友人戦の週間ポイント（フレンドの週間1位ボーナス用）
//   /api/cup      … 週末大会（配牌固定戦）の成績（その週の最高）
//   /api/fr       … フレンド申請の受け箱（申請・承認・拒否。相手がアプリを閉じていても届く）
//   /api/acct     … アカウント（ID＋パスワード）の登録・ログイン・ログアウト
//   /api/sync     … アカウントのデータの同期（端末ごとの変更を、項目ごとの新しい方で合わせる）
//   /api/league   … リーグ（仲間うちの友人戦の通算順位表。参加コードを知っている人だけ）
//   /api/err      … アプリの不具合の自動報告（同じ内容はまとめて数える。読むのは開発者だけ）
//   /api/draw     … 全員共通の抽選（宝くじ・ナンバーズ）。回ごとの種を作って保存し、抽選の前は種のハッシュだけ、抽選のあとは種も返す
//   /api/race     … レース場の種（日ごと・6レースか12レース分）。発走までは種のハッシュだけ、発走のあとは種も返す
//   /api/town     … 町の様子（フレンドが留守でも見られる最後の様子）と、訪ねてくれた数（段階7）
//   /api/note     … フレンドへのお知らせの受け箱（騎乗の賞金・合同レースの結果など）
//   /api/best     … 自己ベストと全員のランキング（ありえない記録ははじく）
//   /api/bingo    … 定時ビンゴ（回ごとの種・参加・ビンゴした順番と配当）
//   /api/fest     … 町の祭り（みんなの和了の合計と目標）
//   /api/sched    … 運営の予約（季節イベント・ごほうび増量・期間限定ルール・お知らせ。読むのは誰でも、書くのは開発者の鍵が必要）
//   /api/usage    … 利用状況（1日ごとの端末数と機能ごとの回数・使っている人ごとの名前・フレンドコード・アカウントID・最後に開いた時刻と回数）
import { getStore as gs } from '@netlify/blobs';
// 書いたものがすぐ読めるように（既定は反映まで最大1分ほど遅れる）
const getStore = name => gs({ name, consistency: 'strong' });

// 牌ビンゴの決まり（src/games/bingo/core.ts を build.mjs が下の行に埋め込む）
var BingoCore=(()=>{var g=Object.defineProperty;var U=Object.getOwnPropertyDescriptor;var V=Object.getOwnPropertyNames;var P=Object.prototype.hasOwnProperty;var k=(t,n)=>{for(var e in n)g(t,e,{get:n[e],enumerable:!0})},z=(t,n,e,r)=>{if(n&&typeof n=="object"||typeof n=="function")for(let o of V(n))!P.call(t,o)&&o!==e&&g(t,o,{get:()=>n[o],enumerable:!(r=U(n,o))||r.enumerable});return t};var D=t=>z(g({},"__esModule",{value:!0}),t);var Q={};k(Q,{EVENT_CALLS:()=>R,EVENT_HOURS:()=>C,EVENT_PRICE:()=>N,EVENT_RETURN:()=>M,EVENT_SHARE:()=>v,EVENT_STEP:()=>y,FREE:()=>I,LINES:()=>S,N_BALLS:()=>B,SOLO_CALLS:()=>J,SOLO_PAY:()=>O,SOLO_PRICE:()=>Y,bingoAt:()=>A,callsOf:()=>w,doneLines:()=>j,eventResult:()=>K,eventStart:()=>$,isJunLine:()=>T,isRed:()=>E,kindOf:()=>L,makeCard:()=>_,nextEvent:()=>G,numOf:()=>b,seedRandom:()=>d,soloPay:()=>q,suitOf:()=>x});var B=37,I=-1;function d(t){let n=1779033703^t.length;for(let r=0;r<t.length;r++)n=Math.imul(n^t.charCodeAt(r),3432918353),n=n<<13|n>>>19;let e=n>>>0;return()=>{e=e+1831565813>>>0;let r=e;return r=Math.imul(r^r>>>15,r|1),r^=r+Math.imul(r^r>>>7,r|61),((r^r>>>14)>>>0)/4294967296}}var E=t=>t>=34,x=t=>t>=34?["m","p","s"][t-34]:t<9?"m":t<18?"p":t<27?"s":"z",b=t=>t>=34?5:t<27?t%9+1:t-26,L=t=>t>=34?(t-34)*9+4:t,i=(t,n)=>{for(let e=t.length-1;e>0;e--){let r=Math.floor(n()*(e+1));[t[e],t[r]]=[t[r],t[e]]}return t},h=t=>t.sort((n,e)=>b(n)-b(e)||(E(n)?1:0)-(E(e)?1:0)||n-e);function _(t){let n=d("bingo-card:"+t),e=(c,m)=>Array.from({length:m},(W,F)=>c+F),r=h(i([...e(0,9),34],n).slice(0,5)),o=h(i([...e(9,9),35],n).slice(0,5)),a=i(e(27,6),n).slice(0,4).sort((c,m)=>c-m),f=[a[0],a[1],-1,a[2],a[3]],l=h(i([...e(18,9),36],n).slice(0,5)),s=new Set([...r,...o,...l].map(L)),u=i(e(0,27).filter(c=>!s.has(c)),n).slice(0,5).sort((c,m)=>c-m),p=[r,o,f,l,u];return Array.from({length:25},(c,m)=>p[m%5][Math.floor(m/5)])}function w(t){return i(Array.from({length:37},(n,e)=>e),d("bingo-call:"+t))}var S=[...[0,1,2,3,4].map(t=>[0,1,2,3,4].map(n=>t*5+n)),...[0,1,2,3,4].map(t=>[0,1,2,3,4].map(n=>n*5+t)),[0,6,12,18,24],[4,8,12,16,20]];function T(t,n){let e=n.map(o=>t[o]).filter(o=>o!==-1);if(e.length<4||e.some(o=>x(o)==="z")||new Set(e.map(x)).size!==1)return!1;let r=e.map(b).sort((o,a)=>o-a);return r.every((o,a)=>a===0||o===r[a-1]+1)}var H=t=>t===-1?1:E(t)?2:1;function j(t,n,e){let r=new Set(n.slice(0,e));return S.map((o,a)=>({k:a,w:o.reduce((f,l)=>f+(t[l]===-1||r.has(t[l])?H(t[l]):0),0)})).filter(o=>o.w>=5).map(o=>o.k)}function A(t,n,e=37){for(let r=1;r<=Math.min(e,n.length);r++){let o=j(t,n,r);if(o.length)return{at:r,jun:o.some(a=>T(t,S[a])),lines:o}}return{at:0,jun:!1,lines:[]}}var Y=100,J=20,O=[{upto:6,mult:10},{upto:8,mult:5},{upto:10,mult:3},{upto:12,mult:2},{upto:14,mult:1.2},{upto:16,mult:.8},{upto:18,mult:.5},{upto:20,mult:.3}];function q(t,n){if(!t)return 0;let e=O.find(r=>t<=r.upto);return e?e.mult*(n?2:1):0}var C=[12,21],N=300,R=30,y=4e3,M=.92,v=[.45,.25,.15,.15];function $(t){return Date.UTC(+t.slice(0,4),+t.slice(4,6)-1,+t.slice(6,8),+t.slice(8,10))-9*36e5}function G(t=Date.now()){for(let n=0;n<3;n++){let e=new Date(t+324e5+n*864e5);for(let r of C){let o=`${e.getUTCFullYear()}${String(e.getUTCMonth()+1).padStart(2,"0")}${String(e.getUTCDate()).padStart(2,"0")}${String(r).padStart(2,"0")}`;if($(o)+R*y+6e4>t)return o}}return""}function K(t,n,e){let r=w(n),o=Math.floor(e.reduce((s,u)=>s+u.cards,0)*N*M),a=e.map(s=>{let u={at:0,jun:!1};for(let p=0;p<s.cards;p++){let c=A(_(`${t}|${s.code}|${p}`),r,R);c.at&&(!u.at||c.at<u.at||c.at===u.at&&c.jun&&!u.jun)&&(u=c)}return{code:s.code,name:s.name,cards:s.cards,at:u.at,jun:u.jun,place:0,pay:0}}),f=[...new Set(a.filter(s=>s.at).map(s=>s.at))].sort((s,u)=>s-u);a.forEach(s=>{s.place=s.at?Math.min(4,f.indexOf(s.at)+1):0});let l=v.slice();for(let s=4;s>=2;s--)a.some(u=>u.place===s)||(l[s-2]+=l[s-1],l[s-1]=0);for(let s=1;s<=4;s++){let u=a.filter(c=>c.place===s);if(!u.length)continue;let p=u.reduce((c,m)=>c+(m.jun?2:1),0);for(let c of u)c.pay=Math.floor(o*l[s-1]*(c.jun?2:1)/p)}return a.sort((s,u)=>(s.place||99)-(u.place||99)||u.pay-s.pay),{rows:a,pool:o}}return D(Q);})();

// 運営の予約の決まり（src/games/sched.ts を build.mjs が下の行に埋め込む）
var SchedCore=(()=>{var d=Object.defineProperty;var k=Object.getOwnPropertyDescriptor;var b=Object.getOwnPropertyNames;var v=Object.prototype.hasOwnProperty;var y=(e,t)=>{for(var n in t)d(e,n,{get:t[n],enumerable:!0})},w=(e,t,n,r)=>{if(t&&typeof t=="object"||typeof t=="function")for(let o of b(t))!v.call(e,o)&&o!==n&&d(e,o,{get:()=>t[o],enumerable:!(r=k(t,o))||r.enumerable});return e};var I=e=>w(d({},"__esModule",{value:!0}),e);var A={};y(A,{BONUS_MULS:()=>E,BONUS_NAME:()=>g,BONUS_TARGETS:()=>S,RULE_TEMPLATES:()=>c,SCHED_EVENTS:()=>h,SCHED_EVENT_NAME:()=>f,SCHED_KIND_NAME:()=>p,activeRule:()=>M,activeSched:()=>s,bonusMul:()=>R,cleanSched:()=>T,cleanSchedList:()=>N,rulePatch:()=>_,schedEvents:()=>D,schedSpan:()=>$});var p={event:"\u5B63\u7BC0\u30A4\u30D9\u30F3\u30C8",bonus:"\u3054\u307B\u3046\u3073\u5897\u91CF",rule:"\u671F\u9593\u9650\u5B9A\u30EB\u30FC\u30EB",notice:"\u304A\u77E5\u3089\u305B"},h=["newyear","summer"],f={newyear:"\u6B63\u6708\u306E\u798F\u5F15\u304D\u5927\u4F1A",summer:"\u590F\u796D\u308A\uFF08\u91D1\u9B5A\u3059\u304F\u3044\u30FB\u5C04\u7684\uFF09"},S=["all","login","drill","mission"],g={all:"\u30ED\u30B0\u30A4\u30F3\u30FB\u7DF4\u7FD2\u30FB\u30DF\u30C3\u30B7\u30E7\u30F3",login:"\u30ED\u30B0\u30A4\u30F3\u30DC\u30FC\u30CA\u30B9",drill:"\u7DF4\u7FD2\u306E\u6B63\u89E3",mission:"\u30DF\u30C3\u30B7\u30E7\u30F3"},E=[2,3],c=[{id:"manzu",name:"\u842C\u5B50\u306E\u6DF7\u4E00\u8272\u304C\u5F79\u6E80",desc:"\u842C\u5B50\u3068\u5B57\u724C\u3060\u3051\u306E\u624B\u304C\u5F79\u6E80",patch:{manzuHonitsu:!0}},{id:"aka",name:"\u8D64\u30C9\u30E94\u679A",desc:"\u8D645\u7B52\u30FB\u8D645\u7D22\u304C2\u679A\u305A\u3064",patch:{redP:2,redS:2}},{id:"pocchi",name:"\u767D\u30DD\u30C3\u30C1\u3068\u30B5\u30A4\u30B3\u30ED\u30C9\u30E9",desc:"\u7ACB\u76F4\u5F8C\u306E\u767D\u30DD\u30C3\u30C1\u306F\u4E07\u80FD\u724C\u30FB\u30BE\u30ED\u76EE\u3067\u30C9\u30E9\u8868\u793A\u304C\u5897\u3048\u308B",patch:{pocchi:!0,diceDora:!0}},{id:"local",name:"\u30ED\u30FC\u30AB\u30EB\u5F79",desc:"\u5927\u8ECA\u8F2A\u30FB\u4E09\u9023\u523B\u30FB\u4E00\u8272\u4E09\u9806\u30FB\u5341\u4E09\u4E0D\u5854\u30FB\u4EBA\u548C\uFF08\u5F79\u6E80\uFF09",patch:{daisharin:!0,sanrenkou:!0,isshokuSanjun:!0,shiisanpuutaa:!0,renhou:"yakuman"}},{id:"tonpu",name:"\u6771\u98A8\u6226",desc:"\u6771\u5834\u3060\u3051\u306E\u77ED\u3044\u5BFE\u5C40",patch:{length:"tonpu"}},{id:"karasu",name:"\u30AB\u30E9\u30B9",desc:"\u7ACB\u76F4\u306E\u307F\uFF08\u30C9\u30E9\u306A\u3057\uFF09\u306E\u30ED\u30F3\u306F\u8DF3\u6E80",patch:{karasu:!0}}],m=(e,t)=>typeof e=="string"?e.replace(/[\u0000-\u001f<>]/g,"").trim().slice(0,t):"";function T(e){if(!e||typeof e!="object")return null;let t=e.kind;if(!(t in p))return null;let n=m(e.id,24);if(!/^[a-z0-9-]{4,24}$/.test(n))return null;let r=Number(e.from),o=Number(e.to);if(!isFinite(r)||!isFinite(o)||o<=r||o-r>62*864e5)return null;let i={id:n,kind:t,title:m(e.title,40),from:Math.round(r),to:Math.round(o)};if(t==="event"){if(!h.includes(e.ev))return null;i.ev=e.ev,i.title||(i.title=f[i.ev])}if(t==="bonus"){if(!S.includes(e.target)||!E.includes(e.mul))return null;i.target=e.target,i.mul=e.mul,i.title||(i.title=`${g[i.target]}\u306E\u3054\u307B\u3046\u3073${i.mul}\u500D`)}if(t==="rule"){let u=Array.isArray(e.tpl)?[...new Set(e.tpl.filter(a=>c.some(l=>l.id===a)))]:[];if(!u.length)return null;i.tpl=u,i.title||(i.title=u.map(a=>c.find(l=>l.id===a).name).join("\u30FB"))}if(t==="notice"){let u=m(e.text,300);if(!u)return null;i.text=u,i.title||(i.title="\u304A\u77E5\u3089\u305B")}return i}var N=e=>Array.isArray(e)?e.map(T).filter(t=>!!t).slice(0,100):[],s=(e,t=Date.now())=>e.filter(n=>t>=n.from&&t<n.to),D=(e,t=Date.now())=>s(e,t).filter(n=>n.kind==="event"&&n.ev).map(n=>n.ev);function R(e,t,n=Date.now()){return s(e,n).filter(r=>r.kind==="bonus"&&(r.target===t||r.target==="all")).reduce((r,o)=>Math.max(r,o.mul??1),1)}function M(e,t=Date.now()){return s(e,t).filter(n=>n.kind==="rule").sort((n,r)=>n.to-r.to)[0]??null}function _(e){let t={};for(let n of e.tpl??[])Object.assign(t,c.find(r=>r.id===n)?.patch??{});return{...t,name:`\u671F\u9593\u9650\u5B9A\uFF1A${e.title}`.slice(0,40),id:`limited-${e.id}`}}function $(e){let t=n=>{let r=new Date(n+324e5);return`${r.getUTCMonth()+1}/${r.getUTCDate()} ${String(r.getUTCHours()).padStart(2,"0")}:${String(r.getUTCMinutes()).padStart(2,"0")}`};return`${t(e.from)}\u301C${t(e.to)}`}return I(A);})();


// 開発者の鍵（そのものではなく SHA-256。鍵は開発者だけが持つ）
const ADMIN = '3281af2469ee696e90b0f135bee186c5d8a0cfd8c288e9f526f473463d31dd60';

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
    if (path === 'draw' && req.method === 'GET') {
      // 回の名前：num-YYYYMMDD（毎日20時）か loto-YYYYMMDD（日曜20時）。日本時間
      const id = str(url.searchParams.get('id'), 16);
      const m = /^(num|loto)-(\d{4})(\d{2})(\d{2})$/.exec(id);
      if (!m) return json({ error: 'bad' }, 400);
      const at = Date.UTC(+m[2], +m[3] - 1, +m[4], 20) - 9 * 3600e3;
      if (!isFinite(at) || (m[1] === 'loto' && new Date(at + 9 * 3600e3).getUTCDay() !== 0)) return json({ error: 'bad' }, 400);
      if (at - Date.now() > 8 * 864e5 || Date.now() - at > 120 * 864e5) return json({ error: 'range' }, 400);
      if (await limited('dr', context.ip, 300)) return json({ error: 'limit' }, 429);
      const st = getStore('draws');
      let v = await st.get(id, { type: 'json' });
      if (!v?.seed) {
        // 抽選の時刻を過ぎてから初めて作ることはしない（あとから都合のよい種を作れないように）
        if (Date.now() >= at) return json({ error: 'none' }, 404);
        const seed = rnd(32);
        v = { seed, hash: await sha(seed), made: Date.now() };
        await st.setJSON(id, v);
      }
      return json({ id, hash: v.hash, made: v.made ?? null, ...(Date.now() >= at ? { seed: v.seed } : {}) });
    }
    if (path === 'sched') {
      // 運営の予約：一覧は1つの置き場（list）。終わって7日たったものは返さない
      const st = getStore('sched');
      const cur = (await st.get('list', { type: 'json' }))?.items ?? [];
      if (req.method === 'GET') return json({ items: cur.filter(x => x.to > Date.now() - 7 * 864e5) });
      if (req.method === 'POST') {
        if (!admin) return json({ error: 'key' }, 403);
        const b = await body(req, 6000);
        let items = cur.filter(x => x.to > Date.now() - 30 * 864e5);
        if (b?.op === 'add') {
          const it = SchedCore.cleanSched(b.item);
          if (!it) return json({ error: '予約の中身が正しくありません' }, 400);
          items = [...items.filter(x => x.id !== it.id), it].sort((x, y) => x.from - y.from).slice(-100);
        } else if (b?.op === 'del') items = items.filter(x => x.id !== str(b.id, 24));
        else return json({ error: 'bad' }, 400);
        await st.setJSON('list', { items, at: Date.now() });
        return json({ ok: true, items });
      }
    }
    if (path === 'race' && req.method === 'GET') {
      // 日付 YYYYMMDD（日本時間）。発走時刻は src/games/race/race.ts の timesOf と同じ（RACE12_FROM の日から12レース）
      const d = str(url.searchParams.get('d'), 8);
      if (!/^\d{8}$/.test(d)) return json({ error: 'bad' }, 400);
      const t0 = Date.UTC(+d.slice(0, 4), +d.slice(4, 6) - 1, +d.slice(6, 8)) - 9 * 3600e3;
      if (!isFinite(t0) || t0 - Date.now() > 2 * 864e5 || Date.now() - t0 > 60 * 864e5) return json({ error: 'range' }, 400);
      if (await limited('rc', context.ip, 300)) return json({ error: 'limit' }, 429);
      const TIMES = d < '20261102' ? [[10, 0], [12, 30], [15, 0], [17, 30], [20, 0], [21, 30]] : [[10, 0], [11, 0], [12, 0], [13, 0], [14, 0], [15, 0], [16, 0], [17, 0], [18, 0], [19, 30], [20, 30], [21, 30]];
      const st = getStore('races');
      let v = await st.get(d, { type: 'json' });
      // レースの数が変わった日に前の数の種があれば、最初のレースの前なら作り直す
      if (v?.seeds && v.seeds.length !== TIMES.length && Date.now() < t0 + (TIMES[0][0] * 60 + TIMES[0][1]) * 60e3) v = null;
      if (!v?.seeds) {
        // 終わった日の種は、あとから作らない（都合のよい種を作れないように）
        if (Date.now() >= t0 + 864e5) return json({ error: 'none' }, 404);
        const seeds = TIMES.map(() => rnd(32));
        v = { seeds, hashes: await Promise.all(seeds.map(x => sha(x))), made: Date.now() };
        await st.setJSON(d, v);
      }
      const now = Date.now();
      return json({ d, hashes: v.hashes, made: v.made ?? null, seeds: v.seeds.map((x, r) => (now >= t0 + (TIMES[r][0] * 60 + TIMES[r][1]) * 60e3 ? x : null)) });
    }
    if (path === 'town') {
      // 町の様子（フレンドが留守でも見られるように、最後の様子を1つだけ置く）と、訪ねてくれた数（同じ人は1日1回）
      const st = getStore('town');
      const ok = c => /^[A-HJ-NP-Z2-9]{8}$/.test(c);
      if (req.method === 'POST') {
        const b = await body(req, 16000);
        const token = str(b?.token, 64);
        if (!b || token.length < 16) return json({ error: 'bad' }, 400);
        if (b.op === 'snap') {
          const code = str(b.code, 8);
          if (!ok(code) || !b.snap || typeof b.snap !== 'object' || b.snap.code !== code) return json({ error: 'bad' }, 400);
          const js = JSON.stringify(b.snap); if (js.length > 14000) return json({ error: 'big' }, 413);
          if (await limited('town', context.ip, 80)) return json({ error: 'limit' }, 429);
          if (!(await owner(code, token))) return json({ error: 'owner' }, 403);
          const cur = await st.get(`s/${code}`, { type: 'json' });
          await st.setJSON(`s/${code}`, { snap: JSON.parse(js), at: Date.now(), visits: cur?.visits ?? 0 });
          return json({ ok: true });
        }
        if (b.op === 'visit') {
          const from = str(b.from, 8), to = str(b.to, 8);
          if (!ok(from) || !ok(to) || from === to) return json({ error: 'bad' }, 400);
          if (await limited('visit', context.ip, 200)) return json({ error: 'limit' }, 429);
          if (!(await owner(from, token))) return json({ error: 'owner' }, 403);
          const vk = `v/${to}/${from}`;
          if ((await st.get(vk)) === day()) return json({ ok: true, counted: false });
          await st.set(vk, day());
          const cur = await st.get(`s/${to}`, { type: 'json' });
          if (cur) await st.setJSON(`s/${to}`, { ...cur, visits: (cur.visits ?? 0) + 1 });
          return json({ ok: true, counted: true });
        }
        return json({ error: 'bad' }, 400);
      }
      if (req.method === 'GET') {
        const code = str(url.searchParams.get('code'), 8);
        if (!ok(code)) return json({ error: 'bad' }, 400);
        if (await limited('townget', context.ip, 600)) return json({ error: 'limit' }, 429);
        const cur = await st.get(`s/${code}`, { type: 'json' });
        return cur ? json({ snap: cur.snap, at: cur.at, visits: cur.visits ?? 0 }) : json({ error: 'none' }, 404);
      }
    }
    if (path === 'note') {
      // フレンドへのお知らせの受け箱（騎乗の賞金・合同レースの結果など）。読むと消える
      const st = getStore('note');
      if (req.method === 'POST') {
        const b = await body(req, 3000);
        const from = str(b?.from, 8), to = str(b?.to, 8), token = str(b?.token, 64);
        const n = b?.note;
        if (!/^[A-HJ-NP-Z2-9]{8}$/.test(from) || !/^[A-HJ-NP-Z2-9]{8}$/.test(to) || from === to || token.length < 16 || !n || typeof n !== 'object' || !/^[\w-]{4,48}$/.test(String(n.id))) return json({ error: 'bad' }, 400);
        if (!(await owner(from, token))) return json({ error: 'owner' }, 403);
        if (await limited('note', context.ip, 150)) return json({ error: 'limit' }, 429);
        await st.setJSON(`${to}/${from}-${n.id}`, { note: { k: str(n.k, 8), id: String(n.id), text: str(n.text, 80), coins: Math.max(0, Math.min(40000, Math.round(Number(n.coins) || 0))) }, at: Date.now() });
        return json({ ok: true });
      }
      if (req.method === 'GET') {
        const code = str(url.searchParams.get('code'), 8), token = str(req.headers.get('x-token'), 64);
        if (!/^[A-HJ-NP-Z2-9]{8}$/.test(code) || token.length < 16) return json({ error: 'bad' }, 400);
        if (!(await owner(code, token))) return json({ error: 'owner' }, 403);
        const { blobs } = await st.list({ prefix: `${code}/` });
        const items = [];
        for (const x of blobs.slice(0, 50)) { const v = await st.get(x.key, { type: 'json' }); if (v) items.push({ from: x.key.slice(code.length + 1, code.length + 9), ...v }); await st.delete(x.key); }
        return json({ items });
      }
    }
    if (path === 'best') {
      // 自己ベストと全員のランキング。ありえない記録（上限・下限の外）ははじく。src/ui/social/bests.ts の BEST_GAMES と同じ表
      const GAMES = { fall: [0, 5e6, 0], hitblow: [1, 20, 1], rhythm: [0, 100, 0], pk_rush: [0, 2e5, 0], ps_rush: [0, 5e4, 0], bingo: [2, 37, 1], mj_top: [0, 2e5, 0], race_wins: [0, 999, 0] };
      const st = getStore('best');
      if (req.method === 'POST') {
        const b = await body(req, 1500);
        const code = str(b?.code, 8), game = str(b?.game, 16), token = str(b?.token, 64), sc = Number(b?.score);
        const g = GAMES[game];
        if (!/^[A-HJ-NP-Z2-9]{8}$/.test(code) || !g || token.length < 16 || !isFinite(sc) || sc < g[0] || sc > g[1]) return json({ error: 'bad' }, 400);
        if (await limited('best', context.ip, 200)) return json({ error: 'limit' }, 429);
        if (!(await owner(code, token))) return json({ error: 'owner' }, 403);
        const key = `${game}/${code}`;
        const cur = await st.get(key, { type: 'json' });
        const better = !cur || (g[2] ? sc < cur.score : sc > cur.score);
        if (better) await st.setJSON(key, { score: Math.round(sc * 10) / 10, name: str(b?.name, 10), at: Date.now() });
        else if (cur && str(b?.name, 10) && cur.name !== str(b?.name, 10)) await st.setJSON(key, { ...cur, name: str(b?.name, 10) });
        return json({ ok: true, best: better });
      }
      if (req.method === 'GET') {
        const game = str(url.searchParams.get('game'), 16), code = str(url.searchParams.get('code'), 8);
        const g = GAMES[game]; if (!g) return json({ error: 'bad' }, 400);
        if (await limited('bestget', context.ip, 400)) return json({ error: 'limit' }, 429);
        const blobs = (await st.list({ prefix: `${game}/` })).blobs.slice(0, 2000);
        const all = (await Promise.all(blobs.map(async x => { const v = await st.get(x.key, { type: 'json' }); return v ? { code: x.key.slice(game.length + 1), name: v.name, score: v.score } : null; }))).filter(Boolean);
        all.sort((a, b) => (g[2] ? a.score - b.score : b.score - a.score));
        let rank = 0, prev = null;
        all.forEach((r, i) => { if (r.score !== prev) { rank = i + 1; prev = r.score; } r.rank = rank; });
        return json({ game, count: all.length, list: all.slice(0, 50), me: all.find(r => r.code === code) ?? null });
      }
    }
    if (path === 'bingo') {
      // 定時ビンゴ：回（YYYYMMDDHH・毎日12時と21時）ごとに種を作り、始まるまではハッシュだけ。参加は始まる前まで。
      // 結果（ビンゴした順番と配当）は、参加者のカードと読み上げから、サーバーで計算する（BingoCore＝src/games/bingo/core.ts を build.mjs が埋め込む）
      const st = getStore('bingo');
      const b0 = req.method === 'POST' ? await body(req, 1500) : null;
      const ev = str(req.method === 'POST' ? b0?.ev : url.searchParams.get('ev'), 10);
      if (!/^\d{10}$/.test(ev) || !BingoCore.EVENT_HOURS.includes(+ev.slice(8, 10))) return json({ error: 'bad' }, 400);
      const start = BingoCore.eventStart(ev), end = start + BingoCore.EVENT_CALLS * BingoCore.EVENT_STEP;
      if (!isFinite(start) || start - Date.now() > 2 * 864e5 || Date.now() - start > 7 * 864e5) return json({ error: 'range' }, 400);
      let meta = await st.get(`m/${ev}`, { type: 'json' });
      if (!meta) {
        if (Date.now() >= start) return json({ error: 'none' }, 404);
        const seed = rnd(32); meta = { seed, hash: await sha(seed) };
        await st.setJSON(`m/${ev}`, meta);
      }
      if (req.method === 'POST') {
        const b = b0;
        const code = str(b?.code, 8), token = str(b?.token, 64), cards = Number(b?.cards);
        if (!/^[A-HJ-NP-Z2-9]{8}$/.test(code) || token.length < 16 || ![1, 2, 3].includes(cards)) return json({ error: 'bad' }, 400);
        if (Date.now() >= start - 5000) return json({ error: '締め切りました' }, 409);
        if (await limited('bingo', context.ip, 60)) return json({ error: 'limit' }, 429);
        if (!(await owner(code, token))) return json({ error: 'owner' }, 403);
        const k = `j/${ev}/${code}`;
        if (await st.get(k)) return json({ error: 'この回にはもう参加しています' }, 409);
        await st.setJSON(k, { cards, name: str(b?.name, 10), at: Date.now() });
        return json({ ok: true });
      }
      if (req.method === 'GET') {
        if (await limited('bingoget', context.ip, 900)) return json({ error: 'limit' }, 429);
        const code = str(url.searchParams.get('code'), 8);
        const joined = (await st.list({ prefix: `j/${ev}/` })).blobs;
        const out = { ev, hash: meta.hash, start, players: joined.length };
        if (Date.now() >= start) out.seed = meta.seed;
        if (url.searchParams.get('res') && Date.now() >= end) {
          let res = await st.get(`r/${ev}`, { type: 'json' });
          if (!res) {
            const entries = (await Promise.all(joined.slice(0, 3000).map(async x => { const v = await st.get(x.key, { type: 'json' }); return v ? { code: x.key.slice(`j/${ev}/`.length), name: v.name, cards: v.cards } : null; }))).filter(Boolean);
            res = BingoCore.eventResult(ev, meta.seed, entries);
            await st.setJSON(`r/${ev}`, res);
          }
          out.pool = res.pool; out.top = res.rows.slice(0, 20); out.me = res.rows.find(r => r.code === code) ?? null; out.n = res.rows.length;
        }
        return json(out);
      }
    }
    if (path === 'fest') {
      // 町の祭り（毎月15日〜月末）：みんなの和了の合計で目標を目指す。1人が足せるのは1日に和了50回・対局30回まで
      const st = getStore('fest');
      const id = req.method === 'GET' ? str(url.searchParams.get('id'), 12) : '';
      const goalOf = players => Math.max(300, players * 120);
      if (req.method === 'POST') {
        const b = await body(req, 1000);
        const fid = str(b?.id, 12), code = str(b?.code, 8), token = str(b?.token, 64);
        const ag = Math.round(Number(b?.add?.agari)), gm = Math.round(Number(b?.add?.games));
        if (!/^fest-\d{6}$/.test(fid) || !/^[A-HJ-NP-Z2-9]{8}$/.test(code) || token.length < 16 || !(ag >= 0 && ag <= 200) || !(gm >= 0 && gm <= 100)) return json({ error: 'bad' }, 400);
        const y = +fid.slice(5, 9), m = +fid.slice(9, 11);
        const from = Date.UTC(y, m - 1, 15) - 9 * 3600e3, to = Date.UTC(y, m, 1) - 9 * 3600e3;
        if (Date.now() < from || Date.now() >= to + 3600e3) return json({ error: 'お祭りの期間外です' }, 409);
        if (await limited('fest', context.ip, 120)) return json({ error: 'limit' }, 429);
        if (!(await owner(code, token))) return json({ error: 'owner' }, 403);
        const pk = `p/${fid}/${code}/${day()}`;
        const mine = (await st.get(pk, { type: 'json' })) ?? { agari: 0, games: 0 };
        const addA = Math.max(0, Math.min(ag, 50 - mine.agari)), addG = Math.max(0, Math.min(gm, 30 - mine.games));
        await st.setJSON(pk, { agari: mine.agari + addA, games: mine.games + addG });
        const tot = (await st.get(`t/${fid}`, { type: 'json' })) ?? { agari: 0, games: 0, players: 0, who: [] };
        const who = new Set(tot.who ?? []); who.add(code);
        const next = { agari: tot.agari + addA, games: tot.games + addG, players: who.size, who: [...who].slice(0, 5000) };
        await st.setJSON(`t/${fid}`, next);
        return json({ total: { agari: next.agari, games: next.games, players: next.players, goal: goalOf(next.players) } });
      }
      if (req.method === 'GET') {
        if (!/^fest-\d{6}$/.test(id)) return json({ error: 'bad' }, 400);
        const tot = (await st.get(`t/${id}`, { type: 'json' })) ?? { agari: 0, games: 0, players: 0 };
        return json({ agari: tot.agari, games: tot.games, players: tot.players, goal: goalOf(tot.players) });
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
