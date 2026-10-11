export const MAX_AVATAR_PHOTO_LENGTH=96*1024;
const PREFIX='data:image/jpeg;base64,';
export interface SelfieCapture {uri:string;width:number;height:number}
export type SelfieEncoder=(uri:string,size:{width:number;height:number},quality:number)=>Promise<{base64?:string;width:number;height:number}>;

export function selfieSize(width:number,height:number) {
  if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1||width>32768||height>32768)throw Error('invalid_photo');
  const scale=Math.min(1,320/width,320/height);
  return{width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};
}

/** Retain encoded pixels; discard metadata segments, including EXIF/GPS and comments. */
function jpeg(base64:string) {
  if(!base64||base64.length>1024*1024||base64.length%4!==0||!/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64))throw Error('invalid_photo');
  const bytes=atob(base64),n=bytes.length,at=(i:number)=>bytes.charCodeAt(i);
  if(n<12||at(0)!==255||at(1)!==216||at(n-2)!==255||at(n-1)!==217)throw Error('invalid_photo');
  let offset=2,width=0,height=0,metadata=false,scan=false;const parts=[bytes.slice(0,2)];
  while(offset<n-2){
    const start=offset;if(at(offset++)!==255)throw Error('invalid_photo');
    while(at(offset)===255)offset++;
    const marker=at(offset++);if(marker===0||marker===216||marker===217||marker===1||(marker>=208&&marker<=215))throw Error('invalid_photo');
    const length=at(offset)*256+at(offset+1),end=offset+length;
    if(!Number.isFinite(length)||length<2||end>n-2)throw Error('invalid_photo');
    if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)){
      if(length<8)throw Error('invalid_photo');height=at(offset+3)*256+at(offset+4);width=at(offset+5)*256+at(offset+6);
    }
    if(marker===218){parts.push(bytes.slice(start));scan=true;break;}
    if((marker>=225&&marker<=239)||marker===254)metadata=true;else parts.push(bytes.slice(start,end));
    offset=end;
  }
  if(!scan||width<1||height<1||width>320||height>320)throw Error('invalid_photo');
  return{base64:btoa(parts.join('')),width,height,metadata};
}

export function isValidAvatarPhoto(value:unknown):value is string {
  if(typeof value!=='string'||value.length>MAX_AVATAR_PHOTO_LENGTH||!value.startsWith(PREFIX))return false;
  try{return !jpeg(value.slice(PREFIX.length)).metadata;}catch{return false;}
}

export async function prepareSelfie(photo:SelfieCapture,encode:SelfieEncoder):Promise<string>{
  if(!photo||typeof photo.uri!=='string'||! /^(file:|content:|ph:|blob:|data:image\/(jpeg|jpg|png|webp);base64,)/.test(photo.uri))throw Error('invalid_photo');
  const size=selfieSize(photo.width,photo.height),encoded=await encode(photo.uri,size,.6);
  if(!encoded.base64||encoded.width!==size.width||encoded.height!==size.height)throw Error('invalid_photo');
  const cleaned=jpeg(encoded.base64);
  if(cleaned.width!==size.width||cleaned.height!==size.height)throw Error('invalid_photo');
  const dataUrl=PREFIX+cleaned.base64;
  if(dataUrl.length>MAX_AVATAR_PHOTO_LENGTH)throw Error('photo_too_large');
  return dataUrl;
}
