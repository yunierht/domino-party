import {GoldPressable} from '../components/GoldPressable';
import React,{useEffect,useRef,useState} from 'react';
import {ActivityIndicator,Image,Modal,Pressable,ScrollView,Text,TextInput,View} from 'react-native';
import {CameraView,useCameraPermissions} from 'expo-camera';
import {ImageManipulator,SaveFormat} from 'expo-image-manipulator';
import {TABLE as C} from '../computer/tableTheme';
import {prepareSelfie,type SelfieCapture,type SelfieEncoder} from './avatarPhoto';
import {normalizeAvatarName} from './avatarIdentity';
import {ModalCloseButton} from '../components/ModalCloseButton';

const encode:SelfieEncoder=async(uri,size,quality)=>{
  const context=ImageManipulator.manipulate(uri);let image:Awaited<ReturnType<typeof context.renderAsync>>|undefined;
  try{image=await context.resize(size).renderAsync();return await image.saveAsync({format:SaveFormat.JPEG,compress:quality,base64:true});}
  finally{image?.release();context.release();}
};

function Action({label,onPress,disabled=false}:{label:string;onPress:()=>void;disabled?:boolean}){
  return <GoldPressable finish accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled}} disabled={disabled} onPress={onPress}
    style={({pressed})=>({minHeight:44,paddingHorizontal:16,paddingVertical:12,borderRadius:12,backgroundColor:C.gold,alignItems:'center',opacity:disabled?.4:pressed?.8:1})}>
    <Text style={{color:C.background,fontWeight:'700',fontSize:14}}>{label}</Text>
  </GoldPressable>;
}

export function OnlineSelfieCapture({visible,es,onCancel,onSave,initialName=''}:{visible:boolean;es:boolean;onCancel:()=>void;onSave:(dataUrl:string,name:string)=>void;initialName?:string}){
  const [permission,requestPermission]=useCameraPermissions();
  const [active,setActive]=useState(false),[ready,setReady]=useState(false),[busy,setBusy]=useState(false);
  const [preview,setPreview]=useState<string|null>(null),[error,setError]=useState<string|null>(null);
 const [name,setName]=useState(initialName),validName=normalizeAvatarName(name);
  const camera=useRef<CameraView>(null),generation=useRef(0),pending=useRef(false),alive=useRef(true),shown=useRef(visible);shown.current=visible;
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;generation.current++;};},[]);
  useEffect(()=>{generation.current++;pending.current=false;setActive(false);setReady(false);setBusy(false);setPreview(null);setError(null);setName(initialName);},[visible,initialName]);
  const current=(id:number)=>alive.current&&shown.current&&generation.current===id;
  const cancel=()=>{generation.current++;setActive(false);setPreview(null);onCancel();};
  const fail=()=>setError(es?'No pudimos preparar la foto. Inténtalo de nuevo.':'We could not prepare the photo. Please try again.');
  const open=async()=>{
    if(pending.current||!visible)return;const id=generation.current;pending.current=true;setBusy(true);setError(null);setPreview(null);
    try{const result=permission?.granted?permission:await requestPermission();if(!current(id))return;
      if(result.granted){setReady(false);setActive(true);}else setError(es?'La cámara no tiene permiso. Puedes permitirla en los ajustes del dispositivo.':'Camera access is not allowed. You can allow it in device settings.');
    }catch{if(current(id))setError(es?'La cámara no está disponible. Puedes reintentar o cancelar.':'The camera is unavailable. You can retry or cancel.');}
    finally{if(current(id)){pending.current=false;setBusy(false);}}
  };
  const prepare=async(photo:SelfieCapture,id:number)=>{const value=await prepareSelfie(photo,encode);if(current(id)){setPreview(value);setActive(false);}};
  const capture=async()=>{
    if(pending.current||!ready||!camera.current)return;const id=generation.current;pending.current=true;setBusy(true);setError(null);
    try{const photo=await camera.current.takePictureAsync({quality:.8,exif:false,base64:false,skipProcessing:false});if(current(id))await prepare(photo,id);}
    catch{if(current(id))fail();}finally{if(current(id)){pending.current=false;setBusy(false);}}
  };
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={cancel}>
    <View style={{flex:1,justifyContent:'center',padding:20,backgroundColor:'rgba(2,12,10,.88)'}}>
      <ScrollView contentContainerStyle={{flexGrow:1,justifyContent:'center'}}>
        <View accessibilityViewIsModal style={{width:'100%',maxWidth:420,alignSelf:'center',padding:20,paddingTop:60,gap:14,borderRadius:20,backgroundColor:C.surface,borderWidth:1,borderColor:C.line}}>
          <ModalCloseButton finish es={es} onPress={cancel}/>
          <Text accessibilityRole="header" style={{color:C.ivory,fontSize:22,fontWeight:'700'}}>{es?'Crear selfie':'Create selfie'}</Text>
          <Text style={{color:C.muted,fontSize:14,lineHeight:20}}>{es?'Tu foto, sin IA. Revisa el resultado antes de guardarlo como avatar.':'Your photo, without AI. Review it before saving it as your avatar.'}</Text>
          <TextInput accessibilityLabel={es?'Nombre de tu avatar':'Your avatar name'} value={name} onChangeText={setName} maxLength={40} placeholder={es?'El nombre que quieres usar':'The name you want to use'} placeholderTextColor={C.muted} style={{minHeight:48,borderWidth:1,borderColor:C.line,borderRadius:12,padding:12,color:C.ivory,fontSize:16}}/>
          {!validName&&<Text style={{color:C.muted,fontSize:12}}>{es?'Escribe un nombre de 1 a 40 caracteres para guardar tu selfie.':'Enter a name from 1 to 40 characters to save your selfie.'}</Text>}
          {preview?<Image testID="selfie-preview" source={{uri:preview}} accessibilityLabel={es?'Vista previa de tu selfie':'Selfie preview'} style={{width:'100%',height:280,borderRadius:14}} resizeMode="contain"/>:
            visible&&active?<CameraView ref={camera} facing="front" mode="picture" mirror style={{width:'100%',height:280,borderRadius:14}} onCameraReady={()=>setReady(true)}
              onMountError={()=>{setActive(false);setReady(false);setError(es?'No se pudo abrir la cámara. Reintenta o cancela.':'The camera could not open. Retry or cancel.');}}/>:null}
          {error&&<Text accessibilityRole="alert" style={{color:'#FFB9AF',fontSize:14}}>{error}</Text>}
          {busy&&<ActivityIndicator accessibilityLabel={es?'Preparando foto':'Preparing photo'} color={C.gold}/>}
          {preview?<><Action label={es?'Usar selfie':'Use selfie'} disabled={busy||!validName} onPress={()=>{if(preview&&validName&&!pending.current){pending.current=true;generation.current++;setActive(false);onSave(preview,validName);}}}/>
            <Action label={es?'Repetir foto':'Retake photo'} disabled={busy} onPress={()=>void open()}/></>:
            active?<Action label={es?'Tomar foto':'Take photo'} disabled={busy||!ready} onPress={()=>void capture()}/>:
            <Action label={es?'Abrir cámara':'Open camera'} disabled={busy} onPress={()=>void open()}/>}
        </View>
      </ScrollView>
    </View>
  </Modal>;
}
