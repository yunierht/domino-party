import {useCallback,useEffect,useRef,useState} from 'react';
import type {Dispatch,SetStateAction} from 'react';
import {computerStep,hasMove} from './engine';
import type {Game,Tile} from './engine';

/** Think only after the current board's landing has actually completed. */
export function usePresentedTurn({game,paused,opponentId,setGame,onDraw}:{game:Game|null;paused:boolean;opponentId:string;setGame:Dispatch<SetStateAction<Game|null>>;onDraw:()=>void}) {
 const [presentedBoard,setPresentedBoard]=useState<Tile[]|null>(null);
 const current=useRef(game);current.current=game;
 const draw=useRef(onDraw);draw.current=onDraw;
 const onPresented=useCallback((board:Tile[])=>{
  if(current.current?.board===board)setPresentedBoard(board);
 },[]);
 const presented=!game?.board.length||presentedBoard===game.board;
 useEffect(()=>{
  if(!game||paused||!presented||game.result||game.turn!=='computer')return;
  const timer=setTimeout(()=>{
   if(current.current!==game)return;
   if(!hasMove(game)&&game.stock.length)draw.current();
   else setGame(value=>value===game?computerStep(value):value);
  },850);
  return()=>clearTimeout(timer);
 },[game,paused,presented,opponentId,setGame]);
 return {presented,onPresented};
}
