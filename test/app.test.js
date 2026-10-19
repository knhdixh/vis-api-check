// Integration of app event wiring using a small DOM stand-in, not a browser API test.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('app keeps sampled state independent of blocked events and exports current values',async()=>{
  const nodes=new Map();
  class Element extends EventTarget {
    constructor(){super();this.children=[];this.value='';this.textContent='';this.style={setProperty(){}};this.classList={toggle(){}};}
    set id(value){this._id=value;nodes.set(value,this);}get id(){return this._id;}
    append(...children){this.children.push(...children);}
    replaceChildren(...children){this.children=children;}
    click(){this.dispatchEvent(new Event('click'));}
  }
  const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
  for(const [,id]of html.matchAll(/\bid="([^"]+)"/g)){const e=new Element();e.id=id;}
  nodes.get('filter').value='all';
  let now=0, focused=true, blob;
  const document=new EventTarget();Object.assign(document,{hidden:false,visibilityState:'visible',fullscreenElement:null,fullscreenEnabled:false,hasFocus:()=>focused,createElement:()=>new Element(),getElementById:id=>nodes.get(id),documentElement:new Element()});
  const intervals=new Map();
  const original={document:globalThis.document,window:globalThis.window,performance:globalThis.performance,navigator:Object.getOwnPropertyDescriptor(globalThis,'navigator'),setInterval:globalThis.setInterval,setTimeout:globalThis.setTimeout,createObjectURL:URL.createObjectURL};
  try {
    globalThis.document=document;globalThis.window=new EventTarget();globalThis.isSecureContext=true;
    Object.defineProperty(globalThis,'navigator',{value:{},configurable:true});
    globalThis.performance={now:()=>now};globalThis.setInterval=(fn,ms)=>{intervals.set(ms,fn);};globalThis.setTimeout=()=>{};
    URL.createObjectURL=value=>{blob=value;return 'blob:test';};
    await import('../public/app.js');
    assert.equal(nodes.get('value-capture').textContent,'Unsupported');
    assert.equal(nodes.get('share-button').disabled,true);
    // No visibilitychange or blur is dispatched, as with event-only suppression.
    document.hidden=true;document.visibilityState='hidden';focused=false;now=250;intervals.get(250)();
    now=1250;intervals.get(250)();
    assert.equal(nodes.get('hidden-time').textContent,'1.0s');
    assert.equal(nodes.get('blur-time').textContent,'1.0s');
    assert.equal(nodes.get('value-focus').textContent,'Focused');
    assert.equal(nodes.get('value-hasFocus').textContent,'false');
    // Pause keeps readings live but prevents markers from claiming success.
    nodes.get('pause').click();const count=nodes.get('event-count').textContent;
    nodes.get('checkpoint').click();assert.match(nodes.get('feedback').textContent,/Resume/);
    now=2250;intervals.get(250)();assert.equal(nodes.get('hidden-time').textContent,'2.0s');assert.equal(nodes.get('event-count').textContent,count);
    nodes.get('export').click();const report=JSON.parse(await blob.text());
    assert.equal(report.snapshot.hidden,true);assert.equal(report.snapshot.hasFocus,false);assert.equal(report.snapshot.windowFocus,true);assert.equal(report.hiddenMs,2000);assert.equal(report.logPaused,true);
    assert.ok(report.events.every((event,index,events)=>index===0||event.elapsedMs>=events[index-1].elapsedMs));
    nodes.get('clear').click();assert.equal(nodes.get('event-count').textContent,0);assert.equal(nodes.get('hidden-time').textContent,'2.0s');
  } finally {
    globalThis.document=original.document;globalThis.window=original.window;globalThis.performance=original.performance;
    Object.defineProperty(globalThis,'navigator',original.navigator);globalThis.setInterval=original.setInterval;globalThis.setTimeout=original.setTimeout;URL.createObjectURL=original.createObjectURL;delete globalThis.isSecureContext;
  }
});
