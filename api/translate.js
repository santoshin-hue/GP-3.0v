const langs = new Set(['ko','ja','fr','de','en']);
const cache = new Map();
module.exports = async (req,res) => {
  res.setHeader('Cache-Control','no-store');
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  let body=req.body; if(typeof body==='string') {try{body=JSON.parse(body)}catch{body=null}}
  const {text,lang}=body||{};
  if(typeof text!=='string'||!text.trim()||text.length>500||!langs.has(lang)) return res.status(400).json({error:'Invalid translation input'});
  if(lang==='en') return res.status(200).json({translation:text});
  const id=lang+'\n'+text;
  if(cache.has(id)) return res.status(200).json({translation:cache.get(id)});
  try {
    const params=new URLSearchParams({q:text,langpair:lang+'|en'});
    const r=await fetch('https://api.mymemory.translated.net/get?'+params,{signal:AbortSignal.timeout(8000)});
    const d=await r.json(); const t=d.responseData?.translatedText;
    if(!r.ok||Number(d.responseStatus)!==200||typeof t!=='string'||!t.trim()||/MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(t)) throw Error('Translation unavailable');
    if(cache.size>=500) cache.delete(cache.keys().next().value); cache.set(id,t);
    return res.status(200).json({translation:t});
  } catch {return res.status(502).json({error:'Translation unavailable or quota reached'});}
};
