export function normalizeAvatarName(value:unknown):string|null{
 if(typeof value!=='string'||/[\u0000-\u001f\u007f]/.test(value))return null;
 const name=value.trim();return name.length>0&&name.length<=40?name:null;
}
export function avatarOrder<T extends {id:string}>(avatars:readonly T[],selected:string):T[]{
 const chosen=avatars.find(avatar=>avatar.id===selected);
 return chosen?[chosen,...avatars.filter(avatar=>avatar.id!==selected)]:[...avatars];
}
