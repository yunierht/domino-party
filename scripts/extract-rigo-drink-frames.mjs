/** Extract imagegen's 3x3 sprite cells; preserve alpha and register head height. */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const slug=process.argv[2], source=process.argv[3];
if(!['nubo','duna','orbe','milo','margarita','daiquiri'].includes(slug)||!source) throw Error('Usage: node scripts/extract-rigo-drink-frames.mjs <slug> <source.png>');
const dest=path.resolve('assets/opponent-drinks-v2/rigo',slug);
await fs.mkdir(dest,{recursive:true});
const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const {width:w,height:h,channels}=info;
function gutter(n,size,horizontal){
 let best=Math.round(size*n/3),score=Infinity;
 for(let p=best-24;p<=Math.round(size*n/3)+24;p++){
  let ink=0;for(let q=0;q<(horizontal?w:h);q++){
   const x=horizontal?q:p,y=horizontal?p:q;
   if(data[(y*w+x)*channels+3]>64)ink++;
  }if(ink<score){score=ink;best=p;}
 }return best;
}
const xs=[0,gutter(1,w,false),gutter(2,w,false),w],ys=[0,gutter(1,h,true),gutter(2,h,true),h];
for(let i=0;i<9;i++){
 const c=i%3,r=Math.floor(i/3),left=xs[c],top=ys[r],width=xs[c+1]-left,height=ys[r+1]-top;
 const raw=await sharp(source).extract({left,top,width,height}).ensureAlpha().raw().toBuffer();
 // Discard only disconnected sprite-gutter fragments, as in the existing extractor.
 const seen=new Uint8Array(width*height);
 for(let start=0;start<seen.length;start++){
  if(seen[start]||raw[start*4+3]<=32)continue;
  const queue=[start];seen[start]=1;
  for(let q=0;q<queue.length;q++){
   const p=queue[q],x=p%width,y=Math.floor(p/width);
   for(const n of [x>0?p-1:-1,x<width-1?p+1:-1,y>0?p-width:-1,y<height-1?p+width:-1]){
    if(n>=0&&!seen[n]&&raw[n*4+3]>32){seen[n]=1;queue.push(n);}
   }
  }
  if(queue.length<1200)for(const p of queue)raw[p*4+3]=0;
 }
 const cell=await sharp(raw,{raw:{width,height,channels:4}}).png().toBuffer();
 let headTop=0; outer:for(let y=0;y<Math.min(100,height);y++)for(let x=Math.round(width*.3);x<width*.8;x++)if(raw[(y*width+x)*4+3]>128){headTop=y;break outer;}
 await sharp({create:{width:700,height:400,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
  .composite([{input:cell,left:Math.round((700-width)/2),top:Math.max(0,18-headTop)}]).png().toFile(path.join(dest,`pose-${String(i+1).padStart(2,'0')}.png`));
}
await fs.writeFile(path.join(dest,'extraction.json'),JSON.stringify({source,columns:xs,rows:ys},null,2)+'\n');
console.log(`Extracted nine Rigo/${slug} RGBA frames`);
