# Verification

2026-10-19.

Passed:

- Thirteen Node tests covering duration accumulation, initial absence, bounded log retention, canonical redirects, method preservation, health and asset forwarding; capture stop/cancel/navigation races; and app event wiring with property sampling, paused logging and JSON export.
- The app integration test uses a DOM stand-in. It verifies application logic, not browser-generated API behavior.
- Wrangler 4.151.2 deployment dry-run packages the Worker and static assets successfully using the installed tool from the separate IC3 project. This is not a live deployment.
- JavaScript syntax checks for browser app, shared model, motion and Worker.
- HTML element IDs are unique, local asset links exist, and app element references resolve.
- Dependency lockfile adapted from the existing IC3 project, preserving its Wrangler 4.151.2 package graph and integrity hashes.

Browser and deployment checks (2026-10-19, later session):

- `wrangler dev` served the app locally; `/api/health`, `/`, `/guide.html` and assets responded as expected.
- Headless Chrome screenshots at 1280×900 and 390×844 for the checker, plus the guide at 1280×900: no horizontal overflow, no console errors. The desktop shot is `docs/screenshot.png`.
- Deployed to Cloudflare Workers with custom domain `api.knhdixh.com`. Live `/api/health`, `/`, `/guide`, `/styles.css` and `/app.js` return 200; the workers.dev address 301-redirects to the custom domain, keeping the path and query.

Still not verified: real browser-generated transitions (tab switches, address-bar focus, fullscreen Esc, screen-capture approval) and installed-extension behavior. See the acceptance checklist below.

## Review fixes

- Duration counters now resample document properties even when visibility/focus event listeners receive nothing. Background throttling can still hide transitions between samples; the docs explain the possible undercount.
- Screen capture now releases tracks and resets state on navigation, browser stop, errors and cancellation, including a stream granted after navigation. Duplicate requests are blocked.
- Pointer and mouse boundary events are tracked separately. Raw hidden state and both boundary states are included in JSON snapshots.
- Markers no longer report success while logging is paused.
- Both website and repository docs include direct Chrome Web Store links, hostname activation steps and an API coverage table. Coverage is attributed to publishers and is not installation-verified.

## Browser acceptance

Run the local server in a normal terminal. Check desktop and 390px widths, with no horizontal scroll or console exceptions. Exercise actual tab switching, address-bar focus, pointer leave/enter, clipboard actions, fullscreen Esc, capture approval/cancellation, browser stop-sharing, markers, filters, pause/resume, clear and JSON download. Check reduced motion and an unsupported screen-capture browser. Do not count synthetic events as verification of browser-generated transitions.

Claude helper, when local sockets and Chrome are available:

```sh
node ~/.claude/skills/ship-cf-app/scripts/screenshot.mjs http://localhost:8787/ docs/screenshot.png 1280 900
node ~/.claude/skills/ship-cf-app/scripts/screenshot.mjs http://localhost:8787/ /tmp/api-phone.png 390 844
```

Inspect both images. Add the desktop image to README only after it exists and reflects this app.
