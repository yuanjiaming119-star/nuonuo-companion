import http from 'node:http';
import {readFile} from 'node:fs/promises';
const CAT_DATA=(await readFile(new URL('../assets/nuonuo-fluffy.png',import.meta.url))).toString('base64');
import {handle} from '../worker/index.js';
const port=Number(process.env.PORT||4173);
const host=process.env.HOST||'127.0.0.1';
const server=http.createServer(async(req,res)=>{try{const chunks=[];for await(const c of req)chunks.push(c);const request=new Request('http://'+req.headers.host+req.url,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Buffer.concat(chunks)})});const response=await handle(request,{...process.env,CAT_DATA});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch{res.writeHead(500);res.end('Preview error');}});
server.listen(port,host,()=>console.log('Local: http://'+host+':'+port));
