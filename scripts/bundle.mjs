import {readFile,mkdir,writeFile} from 'node:fs/promises';
const page=await readFile('worker/page.html','utf8');
const cat=(await readFile('assets/nuonuo-fluffy.png')).toString('base64');
const source=(await readFile('worker/index.js','utf8')).replace("const CAT_DATA='';",'const CAT_DATA='+JSON.stringify(cat)+';');
await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
await writeFile('dist/server/index.js',source.replace("import { PAGE } from './page.js';",'const PAGE = '+JSON.stringify(page)+';'));
await writeFile('dist/.openai/hosting.json',await readFile('.openai/hosting.json'));
await writeFile('worker/page.js','export const PAGE = '+JSON.stringify(page)+';\n');
console.log('Built self-contained Worker');
