import { handleOptions, sendJson, requireKey, yt, isoMinutes } from './_lib/youtube.js';
export default async function handler(req,res){
  const c=handleOptions(req,res); if(c===true) return;
  if(req.method!=='POST') return sendJson(res,405,{error:'Method not allowed'},c.headers);
  const key=requireKey(res,c.headers); if(!key) return;
  try {
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    const q=String(body.q||'').trim(); const maxResults=Math.max(1,Math.min(10,Number(body.maxResults||8)));
    if(!q) return sendJson(res,400,{error:'缺少搜索关键词'},c.headers);
    const found=await yt('/search',{part:'snippet',type:'video',maxResults,q},key);
    const ids=(found.items||[]).map(x=>x.id?.videoId).filter(Boolean);
    if(!ids.length) return sendJson(res,200,{ok:true,videos:[]},c.headers);
    const detail=await yt('/videos',{part:'snippet,contentDetails',id:ids.join(',')},key);
    const videos=(detail.items||[]).map(v=>({id:v.id,title:v.snippet?.title||'',channelTitle:v.snippet?.channelTitle||'',publishedAt:v.snippet?.publishedAt||'',thumbnail:v.snippet?.thumbnails?.medium?.url||v.snippet?.thumbnails?.default?.url||'',durationMinutes:isoMinutes(v.contentDetails?.duration||'PT0M')}));
    sendJson(res,200,{ok:true,videos},c.headers);
  } catch(e){ sendJson(res,500,{error:e.message||String(e)},c.headers); }
}
