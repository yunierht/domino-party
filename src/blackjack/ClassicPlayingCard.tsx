import React from 'react';
import {SvgXml} from 'react-native-svg';
import {PlayingCard} from '../poker/PlayingCard';
import artwork from '../../assets/blackjack-classic-deck-v1.json';
export function ClassicPlayingCard(props:React.ComponentProps<typeof PlayingCard>){
 const names:Record<number,string>={11:'J',12:'Q',13:'K',14:'A'};
 const key=props.card?`${names[props.card.rank]??props.card.rank}${props.card.suit.toUpperCase()}`:'';
 const xml=artwork[key as keyof typeof artwork];
 return <PlayingCard {...props} faceArtwork={xml?<SvgXml xml={xml} width="100%" height="100%"/>:undefined}/>;
}
