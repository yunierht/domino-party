import {OPPONENTS} from './opponents';

/** Domino's roster is separate so Poker keeps its existing six characters. */
export const DOMINO_AVATARS=[...OPPONENTS,
 {id:'mateo',name:'Mateo',image:require('../../assets/online-avatars/mateo-seated-v1.png'),depthImage:require('../../assets/online-avatars/mateo-seated-v1.png')},
 {id:'kenji',name:'Kenji',image:require('../../assets/online-avatars/kenji-seated-v1.png'),depthImage:require('../../assets/online-avatars/kenji-seated-v1.png')},
 {id:'oliver',name:'Oliver',image:require('../../assets/online-avatars/oliver-seated-v1.png'),depthImage:require('../../assets/online-avatars/oliver-seated-v1.png')},
 {id:'amara',name:'Amara',image:require('../../assets/online-avatars/amara-seated-v1.png'),depthImage:require('../../assets/online-avatars/amara-seated-v1.png')},
 {id:'lina',name:'Lina',image:require('../../assets/online-avatars/lina-seated-v1.png'),depthImage:require('../../assets/online-avatars/lina-seated-v1.png')},
 {id:'sofia',name:'Sofía',image:require('../../assets/online-avatars/sofia-seated-v1.png'),depthImage:require('../../assets/online-avatars/sofia-seated-v1.png')},
] as const;
export type DominoAvatarId=typeof DOMINO_AVATARS[number]['id']|'selfie';
export function isDominoAvatarId(value:unknown):value is DominoAvatarId{return value==='selfie'||DOMINO_AVATARS.some(avatar=>avatar.id===value);}
