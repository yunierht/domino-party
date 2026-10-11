/** Uniform six-digit public alias; not an authentication credential. */
export function numericManualCode(word:()=>number=()=>crypto.getRandomValues(new Uint32Array(1))[0]):string{
 for(let n=0;n<32;n++){const value=word();if(Number.isInteger(value)&&value>=0&&value<4294000000)return String(value%1000000).padStart(6,'0');}
 throw Error('manual_code_capacity');
}
export function claimManualCode(generate:()=>string,claim:(code:string)=>boolean):string{
 for(let n=0;n<8;n++){const code=generate();if(!/^\d{6}$/.test(code))throw Error('invalid_code');if(claim(code))return code;}
 throw Error('manual_code_capacity');
}
