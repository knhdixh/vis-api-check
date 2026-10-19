# Browser stack

Use Chrome or Firefox in a separate profile, this checker, DevTools, and JSON exports. Add one extension at a time; overlapping patches make results hard to interpret.

| Component | Purpose | Source |
| --- | --- | --- |
| Chrome / Firefox profile | Keep extensions and site settings isolated | Browser profile manager |
| Always Active Window | Its README describes overriding `document.visibilityState` and `document.hidden` | [Source + browser store links](https://github.com/brian-girko/always-active) |
| Disable Page Visibility | Its README describes suppressing visibility and focus events, with site-specific controls | [Source + install instructions](https://github.com/ThomasNHoang/disable-page-visibility) |
| DevTools | Inspect listeners, console errors and page execution | Built into the browser |
| JSON export | Keep a timestamped record of observed events and durations | Export JSON in this app |

## What to install

Start with **Always Active Window – Always Visible** for visibility properties and the author's claimed blur/mouseleave coverage. In Chrome, [install from the Web Store](https://chromewebstore.google.com/detail/always-active-window-alwa/ehllkhjndgnlokhomdlhgbineffifcbj), open this checker, then click the extension's action button to enable it for this hostname. The publisher says the page reloads and the icon turns blue. Since version 0.4.0, it is enabled per hostname. [Firefox listing](https://addons.mozilla.org/firefox/addon/always-visible/) is linked by the [author's repository](https://github.com/brian-girko/always-active).

**Disable Page Visibility** is an alternative for visibility/focus events: [Chrome Web Store](https://chromewebstore.google.com/detail/disable-page-visibility/cebifddlogbjhoibpjobhlamopmlpckl). Use its popup to control the current site, then reload. Its [source and unpacked installation instructions](https://github.com/ThomasNHoang/disable-page-visibility) are available if you prefer building it yourself.

Install **one**, review site permissions, and enable it only on the intended origins. No extension is bundled or installed by this project.

## Coverage by API

These are publisher claims, not installed-extension test results.

| API / signal | Always Active Window | Disable Page Visibility |
| --- | --- | --- |
| `visibilityState`, `hidden` | Claims to override both properties | Store description focuses on blocking events; property overrides not established here |
| `visibilitychange` | Claims coverage | Claims coverage |
| Window `blur` | Claims coverage | Claims coverage; source README also lists `focus` |
| `document.hasFocus()` | Coverage not established | Coverage not established |
| `mouseleave` | Claims coverage | Coverage not documented |
| `pointerleave` | Coverage not established; distinct from `mouseleave` | Coverage not documented |
| `fullscreenchange` | Coverage not established | Coverage not documented |
| `copy`, `cut`, `paste` | Coverage not established | Coverage not documented |
| `getDisplayMedia()` | No coverage established; deny the picker or stop an active share | Same |
| Timer scheduling | No control established over browser throttling | Same |

Sources: [Always Active publisher listing](https://chromewebstore.google.com/detail/always-active-window-alwa/ehllkhjndgnlokhomdlhgbineffifcbj), [Disable Page Visibility publisher listing](https://chromewebstore.google.com/detail/disable-page-visibility/cebifddlogbjhoibpjobhlamopmlpckl), and its [README](https://github.com/ThomasNHoang/disable-page-visibility). Checked 2026-10-19. Neither listing establishes coverage of all APIs in this checker.

## Quick comparison

1. Open the checker with extensions disabled. Add a marker, switch tabs, click the address bar, move the pointer outside the page, enter/exit fullscreen, then copy/paste in the playground. Export the log.
2. Enable one extension for this origin and reload the checker so injection happens during page startup. Repeat the same actions and export again.
3. Compare properties and events separately: `visibilityState`, `hidden`, `hasFocus()`, focus/blur listeners, pointer boundaries, fullscreen state, clipboard actions and timer gaps.
4. Disable the extension and reload to restore the baseline. Keep browser and extension versions alongside the exported files.

The visibility row displays `visibilityState`; expand it to inspect `document.hidden`. The pointer row shows pointer events; expand for the separate mouse-event state. JSON exports include a current snapshot of these properties and both boundary states.

Duration counters use observed property samples, with native visibility/focus callbacks also sampling promptly. The 250ms polling interval is approximate and can be throttled in background tabs. If events are suppressed and an entire state transition occurs between samples, it cannot be reconstructed; durations can undercount. The window-focus row intentionally shows the last observed focus/blur event so you can compare it with sampled `hasFocus()`.

Pausing stops log recording while live state and duration counters continue. Markers require recording to be active. Clear resets the log and event count; reload starts a fresh session. The counter counts recorded entries, including samples and markers, not just native browser events.

Extension descriptions above are author claims checked on 2026-10-19. They were not verified by installing extensions in this run. A missing event says only that this page did not observe it; other frames, scripts, timing and native applications have separate behavior. Timer delays also occur under CPU load, suspension or sleep.

## Execution constraints

Chrome content scripts normally run in an isolated world. Changing a JavaScript property there does not automatically change the page's execution world. Injection timing, frame matching and execution world affect what page scripts observe. See [Chrome content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts).

## API references

- [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API): visibility state, focus differences, background scheduling.
- [Document.hasFocus](https://developer.mozilla.org/en-US/docs/Web/API/Document/hasFocus): current document focus.
- [Pointer leave](https://developer.mozilla.org/en-US/docs/Web/API/Element/pointerleave_event): boundary events; touch behavior differs from hover pointers.
- [Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API): API-managed fullscreen.
- [Clipboard events](https://developer.mozilla.org/en-US/docs/Web/API/ClipboardEvent): copy, cut and paste.
- [Screen capture](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia): secure context, user activation and explicit surface selection.

Screen sharing starts only from a button click. The app does not record, upload or persist the stream. Use Stop sharing or the browser's stop button to end it. Native process lists, other applications and system lockdown controls are outside this checker's scope.
