export const SIGNALS = [
  {id:'visibility', name:'Tab visibility', api:'document.visibilityState', hint:'Switch tabs, then come back.', detail:'Reports visible or hidden. Expand to compare document.hidden. Duration counters sample properties independently of events.'},
  {id:'focus', name:'Window focus', api:'window.focus / blur', hint:'Click the address bar or another app.', detail:'Shows the last observed window focus event. Compare hasFocus() below; suppressed events can leave this row stale.'},
  {id:'pointer', name:'Pointer boundary', api:'pointerleave / mouseleave', hint:'Move your pointer outside the webpage.', detail:'The row shows pointer events; expand for the separate mouse state. Suppressing mouseleave does not establish coverage of pointerleave.'},
  {id:'hasFocus', name:'Document focus', api:'document.hasFocus()', hint:'Compare this value with window focus.', detail:'Sampled every 250ms while scheduled. Background tabs can be throttled. This drives the unfocused-duration counter.'},
  {id:'fullscreen', name:'Fullscreen', api:'document.fullscreenElement', hint:'Enter fullscreen below, then press Esc.', detail:'Tracks API-controlled fullscreen. Browser F11 fullscreen is separate.'},
  {id:'clipboard', name:'Clipboard events', api:'copy / cut / paste', hint:'Copy or paste in the text field below.', detail:'Logs only the action. Clipboard text is never read or stored.'},
  {id:'capture', name:'Screen sharing', api:'getDisplayMedia()', hint:'Click Share screen to open the browser picker.', detail:'Only the surface you approve is shared. The stream stays in this tab.'},
  {id:'timer', name:'Timer interval', api:'performance.now()', hint:'Leave this tab for a while, then return.', detail:'Measures the actual gap of a 1-second timer. Scheduling, sleep and load can all increase it.'}
];
export class Duration {
  constructor(active, now) { this.total=0; this.since=active ? now : null; }
  set(active, now) {
    if (active && this.since === null) this.since=now;
    if (!active && this.since !== null) { this.total+=Math.max(0,now-this.since); this.since=null; }
  }
  value(now) { return this.total+(this.since === null ? 0 : Math.max(0,now-this.since)); }
}
export function seconds(ms) { return `${(Math.max(0, ms)/1000).toFixed(1)}s`; }
export function appendLog(events, event, limit=500) { return [event,...events].slice(0,limit); }
