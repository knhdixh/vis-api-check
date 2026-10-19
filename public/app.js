import {SIGNALS,Duration,seconds,appendLog} from './model.js';
import {CaptureSession} from './capture.js';
const $ = id => document.getElementById(id);
const start=performance.now();
let hidden=new Duration(document.hidden,start), blurred=new Duration(!document.hasFocus(),start);
let events=[], observed=0, paused=false, pointer='Not observed', mouse='Not observed', clip='No action', capture='Off';
let windowFocus=document.hasFocus(), lastFocus=windowFocus, lastHidden=document.hidden, lastTick=start, timerGap=1000;
const supports={visibility:'visibilityState' in document,focus:true,pointer:'PointerEvent' in window,hasFocus:typeof document.hasFocus==='function',fullscreen:!!document.fullscreenEnabled,clipboard:true,capture:!!navigator.mediaDevices?.getDisplayMedia,timer:true};
for(const [index,s] of SIGNALS.entries()) {
  const details=document.createElement('details');details.className='signal';details.style.setProperty('--i',index);
  const summary=document.createElement('summary');
  const num=document.createElement('span');num.className='num';num.textContent=String(index+1).padStart(2,'0');
  const name=document.createElement('span');name.textContent=s.name;
  const api=document.createElement('span');api.className='api';api.textContent=s.api;name.append(api);
  const value=document.createElement('span');value.className='value';value.id=`value-${s.id}`;
  summary.append(num,name,value);
  const description=document.createElement('div');description.className='description';
  const hint=document.createElement('p');hint.className='hint';hint.textContent=s.hint;
  const detail=document.createElement('p');detail.textContent=s.detail;
  description.append(hint,detail);
  if(s.id==='visibility' || s.id==='pointer'){const raw=document.createElement('p');raw.id=s.id==='visibility'?'raw-hidden':'mouse-state';description.append(raw);}
  details.append(summary,description);$('signal-list').append(details);
}
function message(text,error=false){$('feedback').textContent=text;$('feedback').classList.toggle('error',error);}
function log(kind,name,detail='',trusted=null){
  if(paused)return;
  observed++;
  events=appendLog(events,{time:new Date().toISOString(),elapsedMs:Math.round(performance.now()-start),kind,name,detail,trusted});
  renderLog();
}
function renderLog(){
  const filter=$('filter').value;
  const shown=events.filter(e=>filter==='all'||e.kind===filter);
  $('log').replaceChildren(...shown.map(e=>{
    const row=document.createElement('li');const time=document.createElement('time');time.dateTime=e.time;
    time.textContent=new Date(e.time).toLocaleTimeString([], {hour12:false});
    const name=document.createElement('span');name.textContent=e.name;
    const detail=document.createElement('span');detail.className='event-detail';detail.textContent=e.detail;
    row.append(time,name,detail);return row;
  }));
  $('empty').hidden=shown.length>0;$('log-count').textContent=`${events.length} / 500`;$('event-count').textContent=observed;
}
function render(){
  const values={visibility:document.visibilityState,focus:windowFocus?'Focused':'Unfocused',pointer,hasFocus:String(document.hasFocus()),fullscreen:document.fullscreenElement?'On':'Off',clipboard:clip,capture,timer:seconds(timerGap)};
  for(const s of SIGNALS)$(`value-${s.id}`).textContent=supports[s.id]?values[s.id]:'Unsupported';
  $('raw-hidden').textContent=`document.hidden: ${document.hidden}`;
  $('mouse-state').textContent=`Mouse boundary: ${mouse}`;
  const now=performance.now();$('hidden-time').textContent=seconds(hidden.value(now));$('blur-time').textContent=seconds(blurred.value(now));
}
document.addEventListener('visibilitychange',e=>{hidden.set(document.hidden,performance.now());log('visibility','visibilitychange',document.visibilityState,e.isTrusted);render();});
for(const type of ['focus','blur'])window.addEventListener(type,e=>{windowFocus=type==='focus';blurred.set(!document.hasFocus(),performance.now());log('focus',type,windowFocus?'Focused':'Unfocused',e.isTrusted);render();});
for(const type of ['pointerenter','pointerleave'])document.documentElement.addEventListener(type,e=>{pointer=type==='pointerenter'?'Inside':'Outside';log('pointer',type,pointer,e.isTrusted);render();});
for(const type of ['mouseenter','mouseleave'])document.documentElement.addEventListener(type,e=>{mouse=type==='mouseenter'?'Inside':'Outside';log('pointer',type,mouse,e.isTrusted);render();});
for(const type of ['pointerenter','pointerleave'])$('pointer-zone').addEventListener(type,()=>{$('zone-state').textContent=type==='pointerenter'?'Inside area':'Outside area';});
document.addEventListener('fullscreenchange',e=>{log('fullscreen','fullscreenchange',document.fullscreenElement?'On':'Off',e.isTrusted);$('fullscreen-button').textContent=document.fullscreenElement?'Exit fullscreen':'Enter fullscreen';render();});
for(const type of ['copy','cut','paste'])document.addEventListener(type,e=>{clip=type;log('clipboard',type,'Content not read',e.isTrusted);render();});
$('fullscreen-button').disabled=!supports.fullscreen;
$('fullscreen-button').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(e){message(`Fullscreen: ${e.name}`,true);log('fullscreen','request failed',e.name);}});
$('share-button').disabled=!supports.capture;
const sharing = new CaptureSession(
  () => navigator.mediaDevices.getDisplayMedia({video:true,audio:false}),
  (state, stream, error) => {
    capture=state==='pending'?'Choosing…':state==='sharing'?(stream.getVideoTracks()[0].getSettings().displaySurface||'Sharing'):'Off';
    $('share-button').disabled=!supports.capture || state==='pending' || state==='sharing';
    $('stop-button').hidden=state!=='sharing';
    $('preview').srcObject=state==='sharing'?stream:null;
    $('preview').hidden=state!=='sharing';
    if(state==='sharing'){log('capture','sharing started',capture);message('Preview stays in this tab. Stop sharing when finished.');}
    if(state==='off')log('capture','sharing stopped');
    if(state==='error'){log('capture','request ended',error.name);message(`Screen sharing: ${error.name}`,true);}
    render();
  }
);
$('share-button').addEventListener('click',()=>sharing.start());
$('stop-button').addEventListener('click',()=>sharing.stop());
window.addEventListener('pagehide',()=>sharing.stop());
$('checkpoint').addEventListener('click',()=>{if(paused){message('Resume the log to add a marker.');return;}log('marker','Manual marker');message('Marker added. Switch tabs, then return.');});
$('filter').addEventListener('change',renderLog);
$('pause').addEventListener('click',()=>{paused=!paused;$('pause').textContent=paused?'Resume log':'Pause log';$('record-status').textContent=paused?'Log paused · signals live':'Listening';});
$('clear').addEventListener('click',()=>{events=[];observed=0;renderLog();message('Log cleared. Duration counters continue.');});
$('export').addEventListener('click',()=>{
  sample();
  const now=performance.now();
  const snapshot={visibilityState:document.visibilityState,hidden:document.hidden,windowFocus,hasFocus:document.hasFocus(),pointer,mouse,fullscreen:!!document.fullscreenElement,clipboard:clip,capture,timerGapMs:Math.round(timerGap)};
  const report={version:2,snapshot,exportedAt:new Date().toISOString(),secureContext:isSecureContext,supports,logPaused:paused,observedEvents:observed,retainedEvents:events.length,hiddenMs:Math.round(hidden.value(now)),unfocusedMs:Math.round(blurred.value(now)),events:[...events].reverse()};
  const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=`browser-signals-${Date.now()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('JSON exported.');
});
function sample(){
  const now=performance.now(), focus=document.hasFocus(), isHidden=document.hidden;
  hidden.set(isHidden,now);blurred.set(!focus,now);
  if(isHidden!==lastHidden){lastHidden=isHidden;log('visibility','hidden sample',String(isHidden));}
  if(focus!==lastFocus){lastFocus=focus;log('focus','hasFocus sample',String(focus));}
  render();
}
setInterval(sample,250);
window.addEventListener('pageshow',sample);
setInterval(()=>{const now=performance.now();timerGap=now-lastTick;lastTick=now;if(timerGap>1500)log('timer','timer gap',seconds(timerGap));render();},1000);
log('marker','Session started');render();
