const YT = 'https://www.googleapis.com/youtube/v3';

export function corsHeaders(origin='') {
  const allowed = process.env.ALLOWED_ORIGIN || '*';
  const permitted = !allowed || allowed === '*' || origin === allowed;
  return {
    permitted,
    headers: {
      'Access-Control-Allow-Origin': allowed && allowed !== '*' ? allowed : '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
      'Content-Type': 'application/json; charset=utf-8'
    }
  };
}

export function sendJson(res, status, data, headers={}) {
  res.statusCode = status;
  for (const [k,v] of Object.entries(headers)) res.setHeader(k,v);
  res.end(JSON.stringify(data));
}

export function handleOptions(req,res) {
  const c=corsHeaders(req.headers.origin||'');
  if(req.method==='OPTIONS') { res.statusCode=c.permitted?204:403; for(const [k,v] of Object.entries(c.headers)) res.setHeader(k,v); res.end(); return true; }
  if(!c.permitted) { sendJson(res,403,{error:'Origin not allowed'},c.headers); return true; }
  return c;
}

export function requireKey(res, headers) {
  const key=process.env.YOUTUBE_API_KEY;
  if(!key) { sendJson(res,500,{error:'Vercel 尚未设置 YOUTUBE_API_KEY Environment Variable'},headers); return null; }
  return key;
}

export function parseIdentifier(raw='') {
  const value=String(raw).trim();
  if (/^UC[A-Za-z0-9_-]{20,}$/.test(value)) return {type:'id', value};
  const handleMatch=value.match(/(?:youtube\.com\/)?@([A-Za-z0-9._-]+)/i) || value.match(/^@([A-Za-z0-9._-]+)$/);
  if (handleMatch) return {type:'handle', value:'@'+handleMatch[1]};
  try {
    const u=new URL(value);
    const m=u.pathname.match(/^\/@([^/]+)/);
    if(m) return {type:'handle', value:'@'+m[1]};
    const channel=u.pathname.match(/^\/channel\/(UC[A-Za-z0-9_-]+)/);
    if(channel) return {type:'id', value:channel[1]};
  } catch (_) {}
  return null;
}

export async function yt(path, params, key) {
  const u=new URL(YT+path);
  for(const [k,v] of Object.entries(params)) if(v!==undefined && v!==null && v!=='') u.searchParams.set(k,String(v));
  u.searchParams.set('key', key);
  const r=await fetch(u.toString());
  const data=await r.json();
  if(!r.ok) throw new Error(data?.error?.message || `YouTube API ${r.status}`);
  return data;
}

export function isoMinutes(iso='PT0M') {
  const m=String(iso).match(/P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if(!m) return 0;
  const seconds=(Number(m[1]||0)*86400)+(Number(m[2]||0)*3600)+(Number(m[3]||0)*60)+Number(m[4]||0);
  return Math.max(1, Math.ceil(seconds/60));
}

export async function resolveChannel(channel, key) {
  const parsed=parseIdentifier(channel.identifier);
  if(!parsed) throw new Error(`${channel.name || '某频道'}：请填写频道地址、@handle 或 UC…频道 ID`);
  const params={part:'snippet,contentDetails'};
  if(parsed.type==='id') params.id=parsed.value; else params.forHandle=parsed.value;
  const data=await yt('/channels', params, key);
  const info=data.items?.[0];
  if(!info) throw new Error(`${channel.name || channel.identifier}：没有找到频道`);
  return {requestedName:channel.name||'',requestedIdentifier:channel.identifier,sourceUsage:channel.usage||'primary',channelId:info.id,channelTitle:info.snippet?.title||channel.name||'',uploads:info.contentDetails?.relatedPlaylists?.uploads||''};
}
