import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const assets=JSON.parse(await readFile(new URL('./dependencies.json',import.meta.url),'utf8'));
const sha=data=>createHash('sha256').update(data).digest('hex');
for(const asset of assets){
 const target=path.join(root,'dist','vendor',asset.path);
 let existing;try{existing=await readFile(target)}catch{}
 if(existing&&sha(existing)===asset.sha256){console.log('Ready: '+asset.path);continue}
 console.log('Downloading '+asset.path);
 const response=await fetch(asset.url);
 if(!response.ok)throw new Error(asset.path+': HTTP '+response.status);
 const data=Buffer.from(await response.arrayBuffer());
 if(sha(data)!==asset.sha256)throw new Error('Checksum mismatch: '+asset.path);
 await mkdir(path.dirname(target),{recursive:true});await writeFile(target,data);
}
console.log('Dependencies ready. Run npm start, or build the Windows executable.');
