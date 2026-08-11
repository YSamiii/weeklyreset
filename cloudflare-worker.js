/**
 * Weekly Reset 3.4 - Cloudflare Worker
 * Secret required: YOUTUBE_API_KEY
 * Optional variable: ALLOWED_ORIGIN (example: https://YOURNAME.github.io)
 */
const YT = 'https://www.googleapis.com/youtube/v3';

function cors(origin, allowed) {
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

function json(data, status, headers) {
  return new Response(JSON.stringify(data), { status, headers });
}

function parseIdentifier(raw='') {
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

async function yt(path, params, key) {
  const u=new URL(YT+path);
  for(const [k,v] of Object.entries(params)) if(v!==undefined && v!==null && v!=='') u.searchParams.set(k,String(v));
  u.searchParams.set('key', key);
  const r=await fetch(u.toString());
  const data=await r.json();
  if(!r.ok) throw new Error(data?.error?.message || `YouTube API ${r.status}`);
  return data;
}

function isoMinutes(iso='PT0M') {
  const m=String(iso).match(/P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if(!m) return 0;
  const seconds=(Number(m[1]||0)*86400)+(Number(m[2]||0)*3600)+(Number(m[3]||0)*60)+Number(m[4]||0);
  return Math.max(1, Math.round(seconds/60));
}

async function resolveChannel(channel, key) {
  const parsed=parseIdentifier(channel.identifier);
  if(!parsed) throw new Error(`${channel.name || '某频道'}：请填写频道地址、@handle 或 UC…频道 ID`);
  const params={part:'snippet,contentDetails'};
  if(parsed.type==='id') params.id=parsed.value; else params.forHandle=parsed.value;
  const data=await yt('/channels', params, key);
  const info=data.items?.[0];
  if(!info) throw new Error(`${channel.name || channel.identifier}：没有找到频道`);
  return {
    requestedName:channel.name||'', requestedIdentifier:channel.identifier,
    sourceUsage:channel.usage||'primary', channelId:info.id, channelTitle:info.snippet?.title||channel.name||'',
    uploads:info.contentDetails?.relatedPlaylists?.uploads||''
  };
}

export default {
  async fetch(request, env) {
    const origin=request.headers.get('Origin')||'';
    const c=cors(origin, env.ALLOWED_ORIGIN||'*');
    if(request.method==='OPTIONS') return new Response(null,{status:c.permitted?204:403,headers:c.headers});
    if(!c.permitted) return json({error:'Origin not allowed'},403,c.headers);
    const url=new URL(request.url);
    if(url.pathname==='/' || url.pathname==='/health') return json({ok:true,service:'weekly-reset-youtube',version:'3.4'},200,c.headers);
    if(!env.YOUTUBE_API_KEY) return json({error:'Worker 尚未设置 YOUTUBE_API_KEY Secret'},500,c.headers);
    if(url.pathname==='/search' && request.method==='POST') {
      try {
        const body=await request.json();
        const q=String(body.q||'').trim();
        const maxResults=Math.max(1,Math.min(10,Number(body.maxResults||8)));
        if(!q) return json({error:'缺少搜索关键词'},400,c.headers);
        const found=await yt('/search',{part:'snippet',type:'video',maxResults,q},env.YOUTUBE_API_KEY);
        const ids=(found.items||[]).map(x=>x.id?.videoId).filter(Boolean);
        if(!ids.length) return json({ok:true,videos:[]},200,c.headers);
        const detail=await yt('/videos',{part:'snippet,contentDetails',id:ids.join(',')},env.YOUTUBE_API_KEY);
        const videos=(detail.items||[]).map(v=>({id:v.id,title:v.snippet?.title||'',channelTitle:v.snippet?.channelTitle||'',publishedAt:v.snippet?.publishedAt||'',thumbnail:v.snippet?.thumbnails?.medium?.url||v.snippet?.thumbnails?.default?.url||'',durationMinutes:isoMinutes(v.contentDetails?.duration||'PT0M')}));
        return json({ok:true,videos},200,c.headers);
      } catch(e) { return json({error:e.message||String(e)},500,c.headers); }
    }
    if(url.pathname!=='/sync' || request.method!=='POST') return json({error:'Not found'},404,c.headers);
    try {
      const body=await request.json();
      const channels=Array.isArray(body.channels)?body.channels.slice(0,20):[];
      const maxResults=Math.max(1,Math.min(20,Number(body.maxResults||10)));
      if(!channels.length) return json({error:'没有提供频道'},400,c.headers);
      const resolved=[]; const errors=[]; const rawVideos=[];
      for(const channel of channels){
        try{
          const r=await resolveChannel(channel,env.YOUTUBE_API_KEY); resolved.push(r);
          if(!r.uploads) continue;
          const list=await yt('/playlistItems',{part:'snippet,contentDetails',playlistId:r.uploads,maxResults},env.YOUTUBE_API_KEY);
          for(const item of list.items||[]){
            const id=item.contentDetails?.videoId; if(!id) continue;
            rawVideos.push({id,sourceUsage:r.sourceUsage,channelId:r.channelId,channelTitle:r.channelTitle,publishedAt:item.contentDetails?.videoPublishedAt||item.snippet?.publishedAt||'',fallback:item.snippet||{}});
          }
        } catch(e){ errors.push({channel:channel.name||channel.identifier,error:e.message}); }
      }
      const ids=[...new Set(rawVideos.map(v=>v.id))];
      const details=new Map();
      for(let i=0;i<ids.length;i+=50){
        const batch=ids.slice(i,i+50);
        const data=await yt('/videos',{part:'snippet,contentDetails',id:batch.join(',')},env.YOUTUBE_API_KEY);
        for(const v of data.items||[]) details.set(v.id,v);
      }
      const videos=rawVideos.map(v=>{
        const d=details.get(v.id); const sn=d?.snippet||v.fallback;
        return {id:v.id,title:sn.title||'',description:sn.description||'',channelId:v.channelId,channelTitle:sn.channelTitle||v.channelTitle,
          publishedAt:sn.publishedAt||v.publishedAt,thumbnail:sn.thumbnails?.medium?.url||sn.thumbnails?.high?.url||sn.thumbnails?.default?.url||'',
          durationMinutes:isoMinutes(d?.contentDetails?.duration||'PT0M'),sourceUsage:v.sourceUsage};
      });
      return json({ok:true,channels:resolved.map(({uploads,...r})=>r),videos,errors,checkedAt:new Date().toISOString()},200,c.headers);
    } catch(e){ return json({error:e.message||String(e)},500,c.headers); }
  }
};
