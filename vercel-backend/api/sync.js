import { handleOptions, sendJson, requireKey, yt, isoMinutes, resolveChannel } from './_lib/youtube.js';
export default async function handler(req,res){
  const c=handleOptions(req,res); if(c===true) return;
  if(req.method!=='POST') return sendJson(res,405,{error:'Method not allowed'},c.headers);
  const key=requireKey(res,c.headers); if(!key) return;
  try {
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    const channels=Array.isArray(body.channels)?body.channels.slice(0,20):[];
    const maxResults=Math.max(1,Math.min(20,Number(body.maxResults||10)));
    if(!channels.length) return sendJson(res,400,{error:'没有提供频道'},c.headers);
    const resolved=[], errors=[], rawVideos=[];
    for(const channel of channels){
      try{
        const r=await resolveChannel(channel,key); resolved.push(r);
        if(!r.uploads) continue;
        const list=await yt('/playlistItems',{part:'snippet,contentDetails',playlistId:r.uploads,maxResults},key);
        for(const item of list.items||[]){ const id=item.contentDetails?.videoId; if(!id) continue; rawVideos.push({id,sourceUsage:r.sourceUsage,channelId:r.channelId,channelTitle:r.channelTitle,publishedAt:item.contentDetails?.videoPublishedAt||item.snippet?.publishedAt||'',fallback:item.snippet||{}}); }
      } catch(e){ errors.push({channel:channel.name||channel.identifier,error:e.message}); }
    }
    const ids=[...new Set(rawVideos.map(v=>v.id))], details=new Map();
    for(let i=0;i<ids.length;i+=50){ const batch=ids.slice(i,i+50); const data=await yt('/videos',{part:'snippet,contentDetails',id:batch.join(',')},key); for(const v of data.items||[]) details.set(v.id,v); }
    const videos=rawVideos.map(v=>{ const d=details.get(v.id); const sn=d?.snippet||v.fallback; return {id:v.id,title:sn.title||'',description:sn.description||'',channelId:v.channelId,channelTitle:sn.channelTitle||v.channelTitle,publishedAt:sn.publishedAt||v.publishedAt,thumbnail:sn.thumbnails?.medium?.url||sn.thumbnails?.high?.url||sn.thumbnails?.default?.url||'',durationMinutes:isoMinutes(d?.contentDetails?.duration||'PT0M'),sourceUsage:v.sourceUsage}; });
    sendJson(res,200,{ok:true,channels:resolved.map(({uploads,...r})=>r),videos,errors,checkedAt:new Date().toISOString()},c.headers);
  } catch(e){ sendJson(res,500,{error:e.message||String(e)},c.headers); }
}
