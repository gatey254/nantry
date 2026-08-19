export interface Env {
  DB: D1Database;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_WEBHOOK_SECRET: string;
  GOOGLE_TRENDS_RSS_URL?: string;
  YOUTUBE_API_KEY?: string;
}

type Item = {source:string; externalId:string; title:string; url?:string; category:string; score:number; publishedAt?:string};

const CATEGORIES: Record<string,string[]> = {
  jobs:['job','jobs','vacancy','vacancies','career','employment','internship','hiring','recruitment'],
  education:['school','schools','kcse','university','college','helb','education','exam','student','scholarship'],
  agriculture:['tea','fertilizer','farm','farming','maize','dairy','milk','coffee','agriculture','livestock','farmer'],
  sports:['football','soccer','athletics','running','marathon','sport','league'],
  business:['business','money','loan','bank','market','price','company','entrepreneur','shop'],
  entertainment:['music','movie','film','celebrity','artist','concert','tiktok','viral','song'],
  politics:['president','governor','mp','senator','politics','election','government','county'],
  health:['health','hospital','doctor','medicine','disease','clinic','sha','nhif','malaria'],
};

const esc=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const categorize=(title:string)=>{
  const t=title.toLowerCase(); let best='general', n=0;
  for(const [cat,words] of Object.entries(CATEGORIES)) { const hits=words.reduce((a,w)=>a+(t.includes(w)?1:0),0); if(hits>n){n=hits;best=cat;} }
  return best;
};

async function tg(env:Env, method:string, body:unknown){
  const r=await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  if(!r.ok) throw new Error(`Telegram ${method}: ${r.status}`); return r.json();
}
async function send(env:Env, chatId:string, text:string){return tg(env,'sendMessage',{chat_id:chatId,text,parse_mode:'HTML',disable_web_page_preview:true});}

function tag(xml:string, name:string){const m=xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`,'i')); return (m?.[1]||'').replace(/^<!\[CDATA\[/,'').replace(/\]\]>$/,'').trim();}
function parseRSS(xml:string, source:string):Item[]{
  const blocks=xml.match(/<item[\s\S]*?<\/item>/gi)||[]; const out:Item[]=[];
  for(const b of blocks){const title=tag(b,'title'); if(!title) continue; const url=tag(b,'link'); const id=tag(b,'guid')||url||title; out.push({source,externalId:id,title,url,category:categorize(title),score:1,publishedAt:tag(b,'pubDate')||undefined});}
  return out;
}

async function collectGoogleNews():Promise<Item[]>{
  const urls=[
    'https://news.google.com/rss/search?q=Nandi%20County%20Kenya&hl=en-KE&gl=KE&ceid=KE:en',
    'https://news.google.com/rss/search?q=Kapsabet%20Kenya&hl=en-KE&gl=KE&ceid=KE:en',
    'https://news.google.com/rss/search?q=Nandi%20Kenya&hl=en-KE&gl=KE&ceid=KE:en'
  ];
  const results=await Promise.all(urls.map(async u=>{const r=await fetch(u,{headers:{'user-agent':'NandiPulse/1.0'}});return r.ok?parseRSS(await r.text(),'google_news'):[];}));
  return results.flat();
}

async function collectTrends(env:Env):Promise<Item[]>{
  if(!env.GOOGLE_TRENDS_RSS_URL) return [];
  const r=await fetch(env.GOOGLE_TRENDS_RSS_URL,{headers:{'user-agent':'NandiPulse/1.0'}}); if(!r.ok) return [];
  return parseRSS(await r.text(),'google_trends');
}

async function collectYouTube(env:Env):Promise<Item[]>{
  if(!env.YOUTUBE_API_KEY) return [];
  const qs=['Nandi Kenya','Nandi County Kenya','Kapsabet Kenya']; const all:Item[]=[];
  for(const q of qs){
    const u=new URL('https://www.googleapis.com/youtube/v3/search');
    u.searchParams.set('part','snippet'); u.searchParams.set('q',q); u.searchParams.set('type','video'); u.searchParams.set('order','date');
    u.searchParams.set('maxResults','10'); u.searchParams.set('regionCode','KE'); u.searchParams.set('relevanceLanguage','en'); u.searchParams.set('key',env.YOUTUBE_API_KEY);
    const r=await fetch(u); if(!r.ok) continue; const d:any=await r.json();
    for(const v of d.items||[]){const title=v.snippet?.title||'Untitled'; const id=v.id?.videoId; if(!id) continue; all.push({source:'youtube',externalId:id,title,url:`https://www.youtube.com/watch?v=${id}`,category:categorize(title),score:1,publishedAt:v.snippet?.publishedAt});}
  }
  return all;
}

async function store(env:Env, items:Item[]){
  const now=new Date().toISOString();
  for(const i of items){await env.DB.prepare(`INSERT INTO source_items(source,external_id,title,url,category,score,published_at,collected_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(source,external_id) DO UPDATE SET collected_at=excluded.collected_at,score=excluded.score,title=excluded.title,url=excluded.url`).bind(i.source,i.externalId,i.title,i.url||null,i.category,i.score,i.publishedAt||null,now).run();}
  return items.length;
}
async function collect(env:Env){const [a,b,c]=await Promise.all([collectTrends(env),collectGoogleNews(),collectYouTube(env)]); return store(env,[...a,...b,...c]);}

async function latest(env:Env, category?:string){
  const sql=category?`SELECT title,url,source,category FROM source_items WHERE category=? ORDER BY collected_at DESC LIMIT 15`:`SELECT title,url,source,category FROM source_items ORDER BY collected_at DESC LIMIT 20`;
  const r=category?await env.DB.prepare(sql).bind(category).all<any>():await env.DB.prepare(sql).all<any>(); return r.results||[];
}
async function report(env:Env, category?:string){
  const rows=await latest(env,category); const heading=category?`📍 <b>NANDI PULSE — ${esc(category.toUpperCase())}</b>`:'📍 <b>NANDI PULSE</b>';
  if(!rows.length) return `${heading}\n\nNo data yet. Use /collect.`;
  const body=rows.map((r:any,i:number)=>`${i+1}. <b>${esc(r.title)}</b>${r.url?` — <a href="${esc(r.url)}">source</a>`:''}\n   <i>${esc(r.source)}</i>`).join('\n');
  return `${heading}\n\n${body}\n\n⚠️ These are public signals, not private browsing data.`;
}

async function command(env:Env, chatId:string, text:string){
  const [raw,...args]=text.trim().split(/\s+/); const cmd=(raw||'').toLowerCase().split('@')[0];
  if(cmd==='/start'||cmd==='/help') return send(env,chatId,'📍 <b>Nandi Pulse</b>\n\n/trends — latest signals\n/rising — latest signals\n/topic jobs|education|agriculture|sports|business|entertainment|politics|health\n/collect — refresh sources');
  if(cmd==='/collect'){const n=await collect(env); return send(env,chatId,`✅ Collected ${n} source records.`);}
  if(cmd==='/trends'||cmd==='/rising') return send(env,chatId,await report(env));
  if(cmd==='/topic') return send(env,chatId,await report(env,(args[0]||'general').toLowerCase()));
  return send(env,chatId,'Try /help');
}

export default {
  async fetch(req:Request,env:Env,ctx:ExecutionContext){
    const url=new URL(req.url);
    if(req.method==='GET'&&url.pathname==='/') return new Response('Nandi Pulse is running.');
    if(req.method==='POST'&&url.pathname==='/telegram/webhook'){
      const secret=req.headers.get('X-Telegram-Bot-Api-Secret-Token'); if(secret!==env.TELEGRAM_WEBHOOK_SECRET) return new Response('Unauthorized',{status:401});
      const update:any=await req.json(); const m=update.message; if(m?.chat?.id){const chatId=String(m.chat.id); await env.DB.prepare('INSERT OR IGNORE INTO chats(chat_id,enabled,created_at) VALUES(?,1,?)').bind(chatId,new Date().toISOString()).run(); if(m.text) ctx.waitUntil(command(env,chatId,m.text));}
      return new Response('ok');
    }
    if(req.method==='POST'&&url.pathname==='/collect'){const n=await collect(env); return Response.json({ok:true,collected:n});}
    return new Response('Not found',{status:404});
  },
  async scheduled(controller:ScheduledController,env:Env,ctx:ExecutionContext){
    if(controller.cron==='*/30 * * * *') ctx.waitUntil(collect(env));
  }
};
