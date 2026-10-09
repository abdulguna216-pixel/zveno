/** Deploy behind HTTPS. Secrets stay on the server. Node.js 22+. */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

export function validateLead(body) {
  if (!body || typeof body !== 'object') return 'Некорректная заявка.';
  if (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.length > 100) return 'Укажите имя (2–100 символов).';
  if (typeof body.phone !== 'string' || !/^[+\d\s()\-]+$/.test(body.phone) || !/^\d{10,15}$/.test(body.phone.replace(/\D/g, ''))) return 'Укажите корректный телефон.';
  if (body.consent !== true) return 'Необходимо согласие на обработку данных.';
  if (body.company != null && (typeof body.company !== 'string' || body.company.length > 150)) return 'Название компании слишком длинное.';
  if (body.comment != null && (typeof body.comment !== 'string' || body.comment.length > 2000)) return 'Комментарий слишком длинный.';
  return null;
}
export function createServer(env = process.env) {
  const root = resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
  const attempts = new Map();
  const json = (res, status, payload) => {res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(payload));};
  return http.createServer(async (req,res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/leads') {
      if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return json(res,405,{ok:false,message:'Метод не поддерживается.'}); }
      if (!env.SITE_ORIGIN || req.headers.origin !== env.SITE_ORIGIN) return json(res,403,{ok:false,message:'Источник запроса не разрешён.'});
      if (!req.headers['content-type']?.startsWith('application/json')) return json(res,415,{ok:false,message:'Ожидается JSON.'});
      // No personal data is collected until real delivery and approved policy are configured.
      if (env.PRIVACY_READY !== 'true' || !env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return json(res,503,{ok:false,message:'Приём заявок пока не подключён. Данные не отправлены.'});
      const now = Date.now();
      for (const [key,value] of attempts) if (now > value.until) attempts.delete(key);
      const ip = req.socket.remoteAddress; // Configure trusted proxy limits at ingress in production.
      const rate = attempts.get(ip) || {count:0,until:now+60000};
      if (rate.count >= 5) return json(res,429,{ok:false,message:'Слишком много запросов. Попробуйте через минуту.'});
      rate.count++; attempts.set(ip,rate);
      let raw='';
      try {
        for await (const chunk of req) {raw += chunk; if (Buffer.byteLength(raw)>16384) return json(res,413,{ok:false,message:'Заявка слишком большая.'});}
        let body;
        try {body=JSON.parse(raw);} catch {return json(res,400,{ok:false,message:'Некорректный JSON.'});}
        if (body.website) return json(res,400,{ok:false,message:'Не удалось проверить заявку.'});
        const error=validateLead(body);
        if(error) return json(res,422,{ok:false,message:error});
        const text=['Новая заявка — ЗВЕНО',`Имя: ${body.name.trim()}`,`Телефон: ${body.phone.trim()}`,`Компания: ${body.company?.trim() || 'Не указана'}`,`Комментарий: ${body.comment?.trim() || 'Не указан'}`,'Согласие на обработку данных: да'].join('\n');
        const upstream = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:env.TELEGRAM_CHAT_ID,text}),signal:AbortSignal.timeout(10000)});
        const result=await upstream.json();
        if(!upstream.ok || result.ok !== true) return json(res,502,{ok:false,message:'Не удалось доставить заявку. Попробуйте позже.'});
        return json(res,200,{ok:true});
      } catch {return json(res,502,{ok:false,message:'Доставка не подтверждена. Попробуйте позже.'});}
    }
    if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405);return res.end();}
    let pathname;
    try {pathname=decodeURIComponent(url.pathname);} catch {res.writeHead(400);return res.end();}
    const path=resolve(root, '.'+(pathname==='/'?'/index.html':pathname));
    if (!path.startsWith(root+'/')) {res.writeHead(403);return res.end();}
    try {
      const file=await readFile(path);
      const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webp':'image/webp','.woff2':'font/woff2','.svg':'image/svg+xml'};
      res.writeHead(200,{'Content-Type':types[extname(path)] || 'application/octet-stream','X-Content-Type-Options':'nosniff'});
      res.end(req.method==='HEAD'?undefined:file);
    } catch {res.writeHead(404);res.end('Not found');}
  });
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const port=Number(process.env.PORT || 4173);
  createServer().listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));
}
