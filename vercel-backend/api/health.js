import { handleOptions, sendJson } from './_lib/youtube.js';
export default async function handler(req,res){
  const c=handleOptions(req,res); if(c===true) return;
  sendJson(res,200,{ok:true,service:'weekly-reset-youtube',platform:'vercel',version:'3.5.1'},c.headers);
}
