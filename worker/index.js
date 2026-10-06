import { PAGE } from './page.js';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const system='你是糯糯，一只原创AI陪伴猫咪。用自然简体中文聊天，温柔、真诚、略俏皮，不堆砌猫叫或表情。每轮通常回复40到120字，最多300字。认真回应具体内容，先倾听，用户没要求时不过早给建议；最多问一个问题，也可以不追问。不虚构记忆、真实经历或能力，不暗示排他依赖，不声称能代替真人关系。不诊断用户，不承诺保密或全天候监护。危急情境鼓励寻求身边可信的人和当地紧急帮助。';
async function call(env,path,body){
 const base=env.DASHSCOPE_ORIGIN||'https://dashscope.aliyuncs.com';
 const r=await fetch(base.replace(/\/$/,'')+path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+env.DASHSCOPE_API_KEY},body:JSON.stringify(body),signal:AbortSignal.timeout(45000)});
 if(!r.ok)throw new Error(({401:'语音服务凭证无效，请检查服务端配置。',403:'当前账号没有该模型权限。',429:'猫咪的服务有点忙，请稍后再试。'})[r.status]||'服务暂时没有回应，请稍后重试。');
 const data=await r.json();if(data.code)throw new Error('模型服务返回错误，请检查模型和地域配置。');return data;
}
async function readBody(request,max){
 const reader=request.body?.getReader();if(!reader)throw new Error('请输入内容。');let size=0;const parts=[];
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw new Error('提交内容过大。');}parts.push(value);}
 const all=new Uint8Array(size);let at=0;for(const p of parts){all.set(p,at);at+=p.length;}
 try{return JSON.parse(new TextDecoder().decode(all));}catch{throw new Error('请求格式有误。');}
}
export async function handle(request,env={}){
 const url=new URL(request.url);
 if(url.pathname==='/api/status'&&request.method==='GET')return json({ready:!!env.DASHSCOPE_API_KEY});
 if(url.pathname.startsWith('/api/')){
  if(request.method!=='POST')return json({error:'不支持该请求。'},405);
  if(request.headers.get('origin')&&request.headers.get('origin')!==url.origin)return json({error:'请求来源无效。'},403);
  if(!['/api/asr','/api/chat','/api/tts'].includes(url.pathname))return json({error:'没有找到该接口。'},404);
  if(!env.DASHSCOPE_API_KEY)return json({error:'对话服务尚未连接，请在服务端设置百炼 API Key。你可以先摸摸糯糯，体验它的互动。'},503);
  try{
   const body=await readBody(request,url.pathname==='/api/asr'?6000000:40000);
   if(url.pathname==='/api/asr'){
    if(typeof body.audio!=='string'||!/^data:audio\/wav;base64,[A-Za-z0-9+/]+=*$/.test(body.audio))return json({error:'请上传 WAV 格式录音。'},400);
    const r=await call(env,'/compatible-mode/v1/chat/completions',{model:env.ASR_MODEL||'qwen3-asr-flash',messages:[{role:'user',content:[{type:'input_audio',input_audio:{data:body.audio}}]}],asr_options:{language:'zh',enable_itn:true},stream:false});
    const text=r.choices?.[0]?.message?.content;if(typeof text!=='string'||!text.trim())return json({error:'我刚刚没听清，可以再说一次吗？'},422);return json({text:text.trim()});
   }
   if(url.pathname==='/api/chat'){
    if(!Array.isArray(body.messages)||!body.messages.length||body.messages.length>24)return json({error:'对话内容格式有误。'},400);
    if(body.messages.some(m=>!['user','assistant'].includes(m.role)||typeof m.content!=='string'||!m.content.trim()||m.content.length>2000)||body.messages.at(-1).role!=='user')return json({error:'单条消息限 2000 字。'},400);
    const r=await call(env,'/compatible-mode/v1/chat/completions',{model:env.CHAT_MODEL||'qwen-plus',messages:[{role:'system',content:system},...body.messages],max_tokens:400,temperature:0.8,enable_thinking:false});
    const text=r.choices?.[0]?.message?.content;if(typeof text!=='string'||!text.trim())throw new Error('糯糯没有收到完整回复，请重试。');return json({text:text.trim().slice(0,600)});
   }
   if(typeof body.text!=='string'||!body.text.trim()||body.text.length>600)return json({error:'朗读内容限 600 字。'},400);
   const r=await call(env,'/api/v1/services/aigc/multimodal-generation/generation',{model:env.TTS_MODEL||'qwen3-tts-flash',input:{text:body.text,voice:env.TTS_VOICE||'Cherry',language_type:'Chinese'}});
   const audioUrl=r.output?.audio?.url;const parsed=new URL(audioUrl);if(!['http:','https:'].includes(parsed.protocol)||!/(^|\.)aliyuncs\.com$/.test(parsed.hostname))throw new Error('语音地址无效。');
   parsed.protocol='https:';const audio=await fetch(parsed.toString(),{signal:AbortSignal.timeout(20000)});if(!audio.ok)throw new Error('语音生成成功，但暂时无法播放。');return new Response(audio.body,{headers:{'Content-Type':audio.headers.get('Content-Type')||'audio/wav','Cache-Control':'no-store'}});
  }catch(error){return json({error:error.name==='TimeoutError'?'等待服务超时，请重试。':error.message},502);}
 }
 if(url.pathname!=='/')return new Response('Not found',{status:404});
 return new Response(PAGE,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Permissions-Policy':'microphone=(self)'}});
}
export default {fetch:handle};
