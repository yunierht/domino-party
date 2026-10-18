# Contact — website only

`docs/contact/` is the public EN/ES page. Header/footer Contact now link to `/contact/`; no visitor data, provider token or recipient comes from client configuration. `web/contact/worker.mjs` handles only `/api/contact`, forwarding all other requests to the existing asset binding. This does not connect to the Online game backend.

The owner confirmed `yunierht@yahoo.com` as the **fixed server recipient**. The visitor email becomes Reply-To, never the sender or a selectable recipient. No visitor auto-reply is sent. Confirmation means provider acceptance (`messageId`), not inbox delivery or reading. Failure retains text; network uncertainty warns that an earlier attempt may have been accepted. No automatic retries. No contact payloads are logged or persisted by this code.

Default `CONTACT_ENABLED=false` fails closed. Before activation, separately confirm:

- A Cloudflare Email Service sender/domain already enabled and permitted, plus its verified **from** address. Read-only CLI inspection on 17 Oct returned Unauthorized2036, so availability is **unknown**, not absent.
- An approved `CONTACT_EMAIL` send_email binding restricted to the confirmed destination and verified sender, and `CONTACT_FROM` server variable. No sender has been invented. See [official binding restrictions](https://developers.cloudflare.com/email-service/configuration/send-bindings/) and [Workers send API](https://developers.cloudflare.com/email-service/api/send-emails/workers-api/).
- An approved `CONTACT_LIMITER` Workers rate-limit binding (for example 5 requests/60 seconds per Cloudflare IP hash). No binding/namespace is created automatically; no global mutable counters are used. Existing configuration must be confirmed before enabling. JSON same-origin requests, bounded16KiB input, honeypot and bounded name/email/message are also enforced.
- Explicit authorization for any needed account/DNS/paid-service changes. Publishing the website alone does not authorize such changes. Do not request tokens/passwords in chat.

Only then set `CONTACT_ENABLED=true`, generate runtime types and dry-run. One synthetic message to the confirmed owner was authorized for verification; **none has been sent yet**. Do not add `remote:true` in local development. Test with `node --test web/contact/worker.test.mjs` (provider/rate-limit and DOM doubles only).

Current preview serves the form honestly unavailable; it must not be described as an operational mail service or deployed as a completed contact feature. Header/colors can be reviewed independently, but activating Contact needs the prerequisites above. No commits/pushes are authorized for this follow-up.

## Public review published — 17 Oct 2026

Subsequent explicit instruction authorized publishing the independent website changes and an honest **disabled Contact preview**, with an alternative clearly labeled to open the visitor email app (`mailto:yunierht@yahoo.com`). This supersedes holding all website publication while Email Service access is unresolved; it does not mark sending operational. Published version `fafda745-18ff-465b-85a6-9ff97b5e2390`, previous `bff6e9b5-2dcb-4295-bb6f-49728e3f2c13` retained. Public GET reports unavailable, POST refuses with503, and the static submit button is disabled. No real verification email sent, no commit/push. Setup requirements above remain pending before activation.

## Shared website chrome — 17 Oct 2026

Published website version `2e98b80f-38ab-4e1d-b5b9-bf541fb4278a` after independent desktop/mobile review. `build-site-chrome.mjs` derives the canonical header/footer from the homepage and bridges EN/ES to each document translator. `site-chrome.css` scopes navigation geometry; `gold-finish.css` ports app gold illumination without changing button geometry. Contact keeps `CONTACT_ENABLED=false`, explicit disabled HTML and email-client fallback. Previous `fafda745-18ff-465b-85a6-9ff97b5e2390` retained. Public package now31assets, HTTP/byte checks and unavailable contact response verified. No real emails, commit or push.


## Current live state — 17 Oct 2026 (supersedes setup pending above)

Email Routing is enabled after explicit owner approval of the three MX and two SPF/DKIM TXT records. The Yahoo destination is verified. Direct sending uses CONTACT_ENABLED=true, CONTACT_FROM=contact@dominoparty.com, restricted CONTACT_EMAIL and CONTACT_LIMITER 5/60s. No paid plan was purchased. One authorized synthetic email was accepted in version d3315a41-bf97-49df-9c34-a9757008d8e4; inbox delivery/read remains unverified. Do not repeat it or run historical POST checks expecting503.

Current version e58f6787-3632-488d-b279-157111168d49 adds the requested native success dialog in EN/ES, opening only on explicit202 accepted. Inline errors retain text. The email-app fallback is hidden during normal availability and shown on unavailability. Privacy notice remains. Local visual checks used simulated acceptance only, not another real email. Evidence and rollback are recorded in docs/CONTEXTO.md. No commit/push.
