import {useEffect,useRef,useState} from 'react';
/** Defaults follow hydration; an explicit avatar choice resets a setup draft,
 * while ordinary renders never overwrite a name the person has edited. */
export function useAvatarSetupName(selected:string,defaultName:string){
 const [name,setName]=useState(defaultName),edited=useRef(false);
 useEffect(()=>{if(!edited.current)setName(defaultName);},[selected,defaultName]);
 return{name,editName:(value:string)=>{edited.current=true;setName(value);},chooseName:(value:string)=>{edited.current=false;setName(value);}};
}
