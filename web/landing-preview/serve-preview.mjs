import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { handleContact } from '../contact/worker.mjs';
const production = process.argv.includes('--production');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), production ? '../../.local/web-site-release/site' : '../../.local/web-landing-preview/site');
const port = production ? 8145 : 8144;
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.wav':'audio/wav'};
http.createServer(async (req,res) => {
  try {
    const url = new URL(req.url,'http://localhost');
    if(url.pathname==='/api/contact') {
      const request=new Request('http://127.0.0.1:'+port+req.url,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Readable.toWeb(req),duplex:'half'})});
      const response=await handleContact(request,{CONTACT_ENABLED:'false'});
      res.writeHead(response.status,Object.fromEntries(response.headers)).end(await response.text());return;
    }
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const target = path.resolve(root,'.' + pathname);
    if (!target.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const data = await readFile(target);
    res.writeHead(200,{'Content-Type':types[path.extname(target)] || 'application/octet-stream','Cache-Control':'no-store'}).end(data);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(port,'127.0.0.1',() => console.log('Local website: http://127.0.0.1:'+port+'/'));
