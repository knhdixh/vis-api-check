import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CaptureSession} from '../public/capture.js';
function media(){
  const video=new EventTarget(); video.readyState='live';video.stops=0;video.stop=()=>{video.stops++;video.readyState='ended';};
  const audio={stops:0,stop(){this.stops++;}};
  return {video,audio,getTracks:()=>[video,audio],getVideoTracks:()=>[video]};
}
test('manual stop releases every track and is idempotent',async()=>{
  const stream=media(),states=[];const session=new CaptureSession(async()=>stream,s=>states.push(s));
  await session.start();session.stop();session.stop();
  assert.deepEqual(states,['pending','sharing','off']);assert.equal(stream.video.stops,1);assert.equal(stream.audio.stops,1);assert.equal(session.stream,null);
});
test('browser stop resets session and allows a new share',async()=>{
  const first=media(),second=media();let count=0;const states=[];
  const session=new CaptureSession(async()=>count++===0?first:second,s=>states.push(s));
  await session.start();first.video.dispatchEvent(new Event('ended'));
  assert.equal(session.stream,null);await session.start();
  first.video.dispatchEvent(new Event('ended'));assert.equal(session.stream,second);
  session.stop();assert.deepEqual(states,['pending','sharing','off','pending','sharing','off']);
});
test('navigation while picker pending stops a late stream without displaying it',async()=>{
  let resolve;const stream=media(),states=[];const session=new CaptureSession(()=>new Promise(r=>resolve=r),s=>states.push(s));
  const pending=session.start();session.stop();resolve(stream);await pending;
  assert.deepEqual(states,['pending','off']);assert.equal(stream.video.stops,1);assert.equal(session.stream,null);
});
test('a cancelled picker resets pending state and can be retried',async()=>{
  let count=0;const stream=media(),errors=[];const session=new CaptureSession(async()=>{if(count++===0)throw new DOMException('Cancelled','NotAllowedError');return stream;},(state,stream,error)=>{if(error)errors.push(error.name);});
  await session.start();assert.equal(session.pending,false);assert.deepEqual(errors,['NotAllowedError']);await session.start();assert.equal(session.stream,stream);session.stop();
});
test('a stream with an ended track is released',async()=>{
  const stream=media();stream.video.readyState='ended';const states=[];const session=new CaptureSession(async()=>stream,s=>states.push(s));
  await session.start();assert.deepEqual(states,['pending','error']);assert.equal(stream.video.stops,1);assert.equal(session.stream,null);
});
test('duplicate starts do not open multiple pickers',async()=>{
  let resolve,calls=0;const session=new CaptureSession(()=>{calls++;return new Promise(r=>resolve=r);},()=>{});
  const pending=session.start();await session.start();assert.equal(calls,1);resolve(media());await pending;await session.start();assert.equal(calls,1);session.stop();
});
