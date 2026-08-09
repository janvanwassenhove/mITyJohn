# Blog series — AURA on a Reachy Mini

A series about putting agentic AI to work on real hardware: where AI is taking
software work, and what happens when you give a team of agents a body.

**Status: all seventeen posts are written**, in `src/content/blog/`, every one
`draft: true` — verified excluded from the build and absent from the sitemap.
Publish by flipping `draft` and setting a real `date`.

Still to do per post: a cover image at `public/blog/<slug>/cover.webp` and a
`cover:` line in the frontmatter (omitted for now because the images do not
exist yet — the schema treats it as optional). Generation prompts are at the
bottom of this file.

The Reachy post was split in two: the build itself (carried by real photographs)
and getting the assembled robot to run as a service. They are different posts
for different readers, and the first one has pictures.

The outlines below are kept as the editorial record: thesis, hook and beats for
each post, so a rewrite has something to argue with.

**Where the evidence lives.** The project itself is a separate public repo:
[janvanwassenhove/aura](https://github.com/janvanwassenhove/aura). Its build
ledger (`docs/implementation-backlog.md`) records every unit with what was
*measured*, the audit (`docs/audit-2026-08.md`) holds the security and
performance work, and `docs/adr/` holds the decisions. Every post below is
anchored to something checkable there — a number, a commit, or a failure written
down while it was still embarrassing.

That anchoring is the differentiator. There is no shortage of posts about what
agents *could* do; there is a shortage of posts showing what they actually did,
with the parts that did not work left in.

**Two rules when drafting.**

1. People named in the ledger are pseudonyms (`Nora`, `Tycho`) and the network
   addresses are placeholders. Do not write real ones back in.
2. Numbers were measured on one laptop and one robot. Say so — "131 ms on my
   machine" ages better than "131 ms".

**Conventions here.** Posts go in `src/content/blog/<slug>.md`; covers in
`public/blog/<slug>/cover.webp`. Set `date` when publishing. Frontmatter blocks
below are ready to paste.

---

## Arc 1 — The thesis

### 1. I gave my agents a body

```yaml
---
title: "I gave my agents a body"
date: YYYY-MM-DD
tags: ["ai", "development", "robotics", "agents"]
cover: "/blog/i-gave-my-agents-a-body/cover.webp"
cardTag: "AI · Robotics"
draft: true
---
```

**Thesis.** The interesting question is not how good the models get. It is what
happens to software work when agents can hold a *goal* for hours instead of a
single reply — and what you learn when you stop reading about that and put one
to work on real hardware, in your house, where it can embarrass you.

**Hook.** Most people meet agentic AI as a chat window that occasionally calls a
tool. This is about the other version: a backlog, a loop that keeps going,
approval gates on anything that matters, and a robot that looks up when you walk
in.

**Beats.**
1. Where this is heading for IT and development: the shift from *autocomplete*
   to *delegation*, and why the hard part stops being code generation and
   becomes **scoping, verification and trust**. The bottleneck moves to "how do
   I know it did the right thing?"
2. Why that is easy to hand-wave and hard to run. Three things break the moment
   work is genuinely delegated: the agent optimises the wrong thing,
   verification costs more than the work, and failure is silent.
3. What I built instead of speculating: an assistant that recognises who is in
   the room, joins the workday, and runs on my own laptop — built by an agent
   loop, unit by unit, each committed, tested and released.
4. Honest headline numbers: ~226 units, 287 commits, ~50 releases, a test suite
   gating every one. Plus the failures this series will cover, including the day
   I found a repo I thought was private wasn't.
5. What is coming: the loop, the subloops, hardware that fights back, and
   privacy as an engineering problem rather than a promise.

**CTA.** Repo + download. "Everything here is checkable."

---

### 2a. Assembling a Reachy Mini

`assembling-a-reachy-mini` — **illustrated with real photographs**, not a
generated cover. What a Reachy Mini is (open platform, not product), the build,
the moment a pile of parts becomes an object, and why an hour with a screwdriver
gave a mental model that paid off weeks later when sound went wrong. Links to
Pollen's page and the assembly video. The broadest post in the series; the one
non-developers will read.

Photo slots marked in the draft: parts laid out, mid-build head mechanism,
finished robot on the desk.

### 2b. From an assembled robot to a running service

`from-robot-to-running-service` — the other ninety-nine percent. The daemon that
bound its port and went quiet twice ("fixed by a reboot" is a finding, not a
solution). Deciding which machine holds the secrets, and why that decision
produced the `FakeRobot`-first architecture rather than the other way round. The
systemd deploy and the stale `nohup` process holding port 8001 that produced
`NRestarts=22`. Why not to build on mDNS alone.

### Original combined outline (kept for reference)

```yaml
---
title: "Assembling a Reachy Mini, and what the box does not tell you"
date: YYYY-MM-DD
tags: ["robotics", "hardware", "raspberry-pi"]
cover: "/blog/assembling-a-reachy-mini/cover.webp"
cardTag: "Robotics · Hardware"
draft: true
---
```

**Thesis.** The gap between "the robot arrived" and "the robot does something
useful" is where the real work lives, and almost none of it is AI.

**Hook.** Unboxing posts stop at the assembled robot. This one starts there.

**Beats.**
1. What a Reachy Mini is: a Pi 5, motors, camera, mic array, speaker — an open
   platform rather than a product, which is exactly why it is interesting.
2. Assembly and first boot: what went smoothly and what did not. The daemon that
   bound its port and then silently hung, twice, fixed by a reboot before it was
   understood — and why "fixed by a reboot" is a finding, not a solution.
3. The two-host split, which is the whole security model: the laptop holds keys,
   tokens and profiles; the Pi holds motors. Steal the robot, get motors.
4. Deploying the runtime as a systemd service, and the stale process holding
   port 8001 that put the service in a 22-restart crash loop.
5. What I would tell someone starting today.

**CTA.** Setup guide, plus the FakeRobot path for readers without hardware.

---

## Arc 2 — Agentic AI in practice

### 3. A backlog, a loop, and 226 units

```yaml
tags: ["ai", "development", "agents", "sdlc"]
cardTag: "AI · SDLC"
slug: a-backlog-a-loop-and-226-units
```

**Thesis.** An agent that holds a *goal* is far more useful than one that holds a
conversation — but only if the loop has hard edges.

**Beats.**
1. The shape: a ledger of units, each with a definition of done. The loop picks
   one, builds, tests, commits, releases, and records what it measured.
2. The rule that makes it survivable: *the loop may run twenty rounds; every
   sensitive action still asks the owner, every time.* Gates are never bypassed;
   queued actions never auto-execute on reconnect.
3. What the loop is genuinely good at: mechanical breadth, consistency across
   dozens of files, never getting bored of writing the test.
4. What it is bad at, with examples: confidently fixing the wrong layer,
   declaring success on a metric that was not the goal, and "verification" that
   only proves the code ran.
5. The ledger as the real artefact — writing down what was measured, including
   "not visually verified", is what makes the output trustworthy later.

---

### 4. Subloops: the parts that run whether you are talking or not

```yaml
tags: ["ai", "development", "agents", "architecture"]
cardTag: "AI · Architecture"
slug: subloops
```

**Thesis.** A conversational agent is request/response. An embodied one is
several loops at different frequencies, and the interesting bugs live between
them.

**Beats.**
1. The loops: perception (camera → embedding → recognition), conversation (a
   real state machine: IDLE → LISTENING → TRANSCRIBING → THINKING → SPEAKING,
   with INTERRUPTED first-class), and maintenance.
2. The maintenance loop: every five minutes it checks robot link, LLM key, TTS
   and encryption, reconnects the robot itself, and reports what it healed.
3. Why perception runs from boot but recognition only joins once the store is
   encrypted — biometrics may not exist unencrypted, so the capability is gated
   on the crypto being live.
4. Cross-loop failure: two consumers on one camera path, and what happens to a
   loop when the thing it polls stops answering.
5. Designing loops that degrade instead of freeze.

---

### 5. The day the agent started talking to itself

```yaml
tags: ["ai", "development", "agents", "voice"]
cardTag: "AI · Voice"
slug: the-day-the-agent-started-talking-to-itself
```

**Thesis.** In embodied agents the output is also an input. That closes a loop
nobody designed, and it is where the strangest bugs come from.

**Hook.** The robot answered a question nobody asked. Then it did it again.

**Beats.**
1. The symptom: "ghost conversations" — generic replies to nothing, repeating.
2. The chain: an STT prompt hint made Whisper hallucinate the wake word on
   ambient noise *and on the robot's own echo* → the echo guard returned the
   bare wake word → that went to the LLM as a command → generic answer → spoken
   → heard again.
3. Every link was individually reasonable. The hint improved accuracy. The guard
   prevented self-hearing. The bug lived in the composition.
4. The fix: a command with under two characters left after stripping the wake
   word never reaches the LLM. Cheap, and it makes the failure impossible rather
   than unlikely.
5. The lesson: draw the loop your outputs close, then gate where the loop
   closes — not where the symptom appears.

---

### 6. Why "just use the best model" is not a strategy

```yaml
tags: ["ai", "generative-ai", "development"]
cardTag: "AI · GenAI"
slug: why-just-use-the-best-model-is-not-a-strategy
```

**Thesis.** Model selection is a routing problem, and getting it wrong fails in
ways that look like the model being bad.

**Beats.**
1. Separate roles for conversation, tasks and voice.
2. The regression: I restricted the conversation role to realtime (speech)
   models, which seemed obviously right. But round one of *every* turn goes
   through chat completions — so every turn 404'd into the echo fallback. The
   assistant still replied. It just replied with nothing of value.
3. Why this class is nasty: a fallback existed, so nothing crashed and no alert
   fired. Graceful degradation hid a total failure.
4. The fix: give each role the models it can use, and make the backend *refuse*
   an impossible combination with a clear error instead of degrading.
5. Fallbacks need to be loud. A silent fallback is a bug that pays your bills
   while returning garbage.

---

## Arc 3 — Hardware bites back

### 7. From 1554 ms to 131 ms: making a camera feel live

```yaml
---
title: "From 1554 ms to 131 ms: making a camera feel live"
date: YYYY-MM-DD
tags: ["hardware", "performance", "robotics", "python"]
cover: "/blog/making-a-camera-feel-live/cover.webp"
cardTag: "Hardware · Performance"
draft: true
---
```

**Thesis.** "It feels slow" is not a performance problem until you measure it on
the real device. Then it is usually not where you guessed.

**Hook.** The video felt broken. It was not dropping frames. It was carrying
1.3 MB of them.

**Beats.**
1. First measurement on the real robot: ~1554 ms per perception frame, 1366 KB
   each.
2. Fix one — stop shipping full-resolution JPEG over the LAN for a task that
   needs a small image. Downscale at the source: 131 ms, 69 KB. Roughly 12×
   faster, 20× smaller.
3. Fix two, the part worth writing about: I added a frame cache and measured
   **0 hits out of 14** sequential requests and 0 of 3 concurrent. The cache
   keyed on the source frame, but every request grabbed its own frame *before*
   the lookup — so no two ever shared a key. Real, tested, useless.
4. The rewrite: a short time-based TTL checked *before* the grab. Two concurrent
   requests then finished in 18–24 ms instead of ~180 ms.
5. Why I only found this by deploying and measuring again.

**CTA.** The bugs in my *own* measurement harness — an unconnected adapter, a
doubled URL prefix, and a fake frame 200× smaller than a real one, which made
everything look fine.

---

### 8. Looking for a robot that was there the whole time

```yaml
tags: ["hardware", "networking", "robotics"]
cardTag: "Hardware · Networking"
slug: looking-for-a-robot-that-was-there-the-whole-time
```

**Thesis.** Network diagnosis fails when your tool's assumptions do not match the
device's behaviour — and it fails *confidently*.

**Beats.**
1. The symptom: "still not connected", after an mDNS name stopped resolving.
2. My first answer, delivered with confidence: I swept the subnet — 254
   addresses, 9 devices — and concluded nothing was listening on 8001.
3. Why that was wrong: a Pi need not answer ICMP, so a ping sweep misses it; ARP
   only shows hosts you recently talked to. Both tools answered honestly. I
   asked the wrong questions.
4. A plain TCP connect sweep found it immediately. Then the two-pass design
   (connect first, ask `/health` only of what answered) cut a /24 scan from
   ~48 s to ~1.4 s — the difference between a background job and a button
   someone presses while staring at an error.
5. Product lesson: when your diagnosis tells someone to do something, make sure
   there is a place to do it. "Set an environment variable inside the app's data
   folder" is not advice, it is a dead end.

---

### 9. Noise, echo, and the microphone problem nobody solves in a weekend

```yaml
tags: ["hardware", "voice", "robotics"]
cardTag: "Hardware · Voice"
slug: noise-echo-and-the-microphone-problem
```

**Thesis.** Speech in a real room is a hardware and acoustics problem long
before it is a model problem.

**Beats.**
1. Why the robot was inaudible: the Pi's PCM mixer sat at 62% / −23 dB. Setting
   it to 100% / 0 dB and persisting it fixed more than any code change.
2. Per-utterance peak normalisation ahead of the volume gain, and why loudness
   *consistency* matters more than peak loudness for something that talks to you.
3. Barge-in that works: the mic keeps listening while the robot speaks; an
   interruption cuts audio mid-word, cancels the in-flight LLM call, and the
   interrupting utterance becomes the new turn — with one-shot context telling
   the model its previous answer was cut off.
4. **What still does not work.** Acoustic echo cancellation for true full-duplex
   is not stable in a live room. Wake-word gating and an echo guard are what
   actually ship. Better to write that down than imply otherwise.
5. What I would try next, and why on-device AEC is the honest answer.

---

### 10. A deadlock caused by the garbage collector

```yaml
tags: ["development", "python", "debugging"]
cardTag: "Development · Python"
slug: a-deadlock-caused-by-the-garbage-collector
```

**Thesis.** Native libraries with finalisers turn "when does this object die?"
into a correctness question.

**Hook.** The test suite stopped at test 22 of 346. Every time. The file passed
on its own.

**Beats.**
1. False leads: it looked like slowness, then contention (I had, embarrassingly,
   left several full suites running at once), then a hang only visible in
   full-suite context.
2. The tool that ended the guessing: `faulthandler_timeout`, which dumps every
   thread's stack when a test overruns.
3. The cause: mediapipe's hand-landmarker finaliser shuts its dispatcher down by
   *blocking on a worker future* — and it fired mid-way through FastAPI building
   a route, because gesture detection defaults to on, so every app instance
   built an 8 MB model with native threads that nothing released.
4. A real resource leak, not a test artefact: production leaked one per start.
   CI never saw it — the optional extra is not installed there, which is its own
   lesson about what your CI actually covers.
5. The fix: an explicit, idempotent `close()` from lifespan teardown, so the
   finaliser has nothing left to do.

---

## Arc 4 — Privacy as an engineering problem

### 11. Envelope encryption, and what "delete" should mean

```yaml
tags: ["security", "privacy", "development", "python"]
cardTag: "Security · Privacy"
slug: envelope-encryption-and-what-delete-should-mean
```

**Thesis.** "Encrypted at rest" is a sentence. Envelope encryption is a design,
and it makes deletion provable instead of promised.

**Beats.**
1. The layout: an owner master key from a passphrase, wrapping a per-person data
   key, each encrypting one person's records with AES-256-GCM.
2. Why per-person keys: deleting someone destroys their key and their data
   becomes unreadable ciphertext. Cryptographic erasure — right-to-be-forgotten
   as physics rather than a `DELETE` you have to trust.
3. Binding each record to the person id, so it cannot be moved between people
   even by someone holding the file.
4. What follows: rotating the owner key rewraps the small keys and never touches
   the bundles — which is what made the migration in the next post survivable.
5. Where it is uncomfortable: lose the passphrase and the data is gone. That is
   correct behaviour, and the UI must say so out loud.

---

### 12. The hollow promise: encryption whose key sat next to the ciphertext

```yaml
---
title: "The hollow promise: encryption whose key sat next to the ciphertext"
date: YYYY-MM-DD
tags: ["security", "privacy", "development"]
cover: "/blog/the-hollow-promise/cover.webp"
cardTag: "Security · Privacy"
draft: true
---
```

**Thesis.** A security property is only real against a specific threat. Mine was
real against nothing it would plausibly meet.

**Hook.** The whole point of encrypting the profiles is that a copy of the folder
is worthless. The passphrase was in a file next to that folder, with the same
permissions.

**Beats.**
1. The finding, from my own audit: the passphrase lived in a `.env` beside the
   ciphertext. Anything that could read one could read the other. Also: scrypt
   three doublings under current guidance, and a hardcoded default salt shared
   by every install that skipped the wizard.
2. Why it could not be fixed by editing constants: the derived key wraps the
   per-person keys, so changing parameters makes existing data unreadable.
3. The design that made it safe: put the parameters *in the stored state*, next
   to the ciphertext, so data and the description of how to open it travel
   together. Record the old parameters **before** changing a byte, probe each
   store independently, never rewrite until the old key has proven it opens the
   current contents.
4. Doing it on real data: back up, verify the backup, rehearse on a copy, then
   run it — profiles and face embeddings rotated, passphrase moved to the OS
   keyring, old copy removed only after a verified read-back.
5. Two things I got wrong and caught before they touched anything: my first
   version discarded the recovery parameters too early, and one unreadable
   record would have blocked the upgrade forever. And one that did bite: my
   verification counted embeddings without decrypting them, so "14 migrated"
   proved nothing until I made it decrypt each one.

---

### 13. A privacy scanner in your pre-commit hook

```yaml
tags: ["security", "privacy", "development", "python"]
cardTag: "Security · Development"
slug: a-privacy-scanner-in-your-pre-commit-hook
```

**Thesis.** For a system holding personal data, the most valuable test is the one
that refuses to let it out.

**Beats.**
1. The origin: a usage log containing literal spoken requests was found *already
   committed*. Once is enough.
2. Deny by class, not by guesswork: databases, audio, logs, encrypted stores,
   key material, `.env`, camera snapshots — plus content rules for API keys,
   private key blocks and personal e-mail addresses.
3. Why the hook is not enough: hooks are skippable and absent in a fresh clone.
   The same scan runs in CI as an enforced backstop.
4. Escape hatches that stay visible: an allow-list for reviewed templates and a
   marker on a line — both show up in review rather than hiding.
5. It works: scanning all 4106 objects in the repo's history found zero blocked
   paths and no real credentials — the only reason the next post is a story
   about names rather than leaked keys.

---

### 14. "I thought my repo was private"

```yaml
tags: ["security", "privacy", "development", "git"]
cardTag: "Security · Git"
slug: i-thought-my-repo-was-private
```

**Thesis.** The most expensive assumptions are the ones you never state, so you
never check them.

**Hook.** I spent an afternoon carefully preparing a repository for publication.
Then I checked, and it had been public the whole time.

**Beats.**
1. The plan: audit the history properly before going public, because publishing
   is irreversible and takes the whole history with it.
2. What the audit found that no scanner catches: two real first names used as
   test fixtures — one attached to a music preference, one to a *school* fact
   and a homework skill, i.e. data about a child — plus home network addresses
   and a very personal development diary.
3. Rewriting history, and why fixing only the current files is theatre: the
   names remain in every older commit.
4. The trap that nearly cost me a corrupted repository: in Dutch, *"elke"* is an
   ordinary word meaning "every". A global replacement would have mangled the
   documentation. Context-specific rules, then a proof: list every remaining
   occurrence and check each is prose. Three attempts — a missed variant, a
   pseudonym colliding with an existing fictional character, and four code forms
   that broke two tests.
5. Then the check I should have run first: `private: false`. Zero forks, zero
   watchers, old commits already unreachable — so the practical damage was
   small. The lesson is not about git. It is about which assumptions you never
   thought to verify.

---

## Arc 5 — Shipping

### 15. The update that deleted its own face recognition

```yaml
tags: ["development", "electron", "packaging"]
cardTag: "Development · Electron"
slug: the-update-that-deleted-its-own-face-recognition
```

**Thesis.** Installers are a state-migration problem, and the state you forget is
the one that outlives the thing it describes.

**Beats.**
1. The report: "after updating, my brain and my people are gone."
2. Root cause with evidence: the app ran with its working directory inside the
   install folder, and *every* persistent path was relative to it — env file,
   encrypted profiles, face embeddings, conversation database, skills. The
   installer replaces that folder.
3. The fix: move all state to `userData`, which survives updates *and*
   reinstallation, plus a one-time migration that never overwrites.
4. The sequel, which is the better story: recognition kept vanishing anyway. The
   installer replaced the virtualenv, but the *bootstrap marker* lived in
   `userData` and survived — so bootstrap concluded there was nothing to do and
   rebuilt the environment without the optional dependencies. A marker
   outliving the thing it describes.
5. The rule: a marker must describe state you can observe. Check for the
   packages, not for a note saying you once installed them.

---

### 16. Verifying an installer before you run it

```yaml
tags: ["security", "development", "electron"]
cardTag: "Security · Electron"
slug: verifying-an-installer-before-you-run-it
```

**Thesis.** Auto-update is remote code execution you opted into. It deserves the
scrutiny that implies.

**Beats.**
1. What the updater did before: downloaded an asset and ran it with elevated
   trust, with no verification of any kind.
2. Three concrete risks, each fixed: a release-controlled asset name
   interpolated into a shell script (a quote or space escapes the quoting);
   staging in a world-writable temp folder, hours before the click; and nothing
   checking what was downloaded.
3. The fix: publish checksums with every release, verify before staging, refuse
   anything that is not a plain filename, stage inside `userData`.
4. The decision worth arguing about: a *missing* checksum list is reported, never
   silently accepted. Older releases fall back to opening the release page so
   the owner updates deliberately.
5. Tests that assert the thing that matters: a tampered file is refused.

---

## Publishing notes

- **Order.** 1 → 2 → 7 → 12 → 5 is a strong opening run: vision, hardware, a
  measurable win, a real security flaw, and a strange bug. Posts 7 and 12 are
  the most shareable; 14 is the most human.
- **Length.** 1200–2000 words each. The evidence is already written down; the
  work is selection, not research.
- **Every post links** to the aura repo and the download. Consider an `apps`
  entry so AURA appears in the store grid alongside the other projects.
- **Cross-posting.** Hardware posts (2, 7, 8, 9) belong in Reachy/Pollen
  community spaces; the agentic ones (3–6) travel further on developer
  aggregators.

---

## Cover images

The house style is set by the one existing cover
(`public/blog/write-the-brief-not-the-prompts/cover.webp`): a square 1200×1200
flat-lay of a cream technical-manual page on a near-black warm surface, amber
hairline frames, mid-century engineering illustration, one rust-orange accent,
no legible text. Every cover in this series inherits it so the set reads as a
series rather than sixteen unrelated images.

### The style block — append to every subject prompt

```
Style: square 1200x1200 flat-lay, shot top-down on a near-black warm charcoal
surface with fine paper grain. Cream/ivory technical-manual page as the central
object, softly lit from the upper left with a gentle directional shadow. Thin
amber hairline border frames, doubled and offset, plus a faint engineering grid
in the background. Mid-century technical illustration: precise line drawings,
exploded isometric views, block schematics, small plots on graph paper. Body
text abstracted into fine horizontal rules — no legible words, no lettering, no
logos. Muted palette: charcoal, cream, ochre, one muted rust-orange accent used
sparingly. Calm, analogue, precise. No people, no 3D render gloss, no neon.
```

### Subjects

| Slug | Subject |
|---|---|
| `i-gave-my-agents-a-body` | An open technical manual: left page an exploded isometric of a small desk robot (rounded head, two antennae, camera eye) separating into shells; right page a flow diagram of a task loop with a decision gate. A pencil and a small brass gear at the edge. |
| `assembling-a-reachy-mini` | **Photograph, not generated** — see below. |
| `from-robot-to-running-service` | An open manual showing a single-board computer in exploded isometric, beside a schematic of two boxes linked by a labelled line, one box drawn with a heavy vault-like outline. A short coiled network cable at the edge. |
| `a-backlog-a-loop-and-226-units` | A ruled ledger page with a long column of numbered rows, most ticked, a few annotated in the margin; a circular process-loop diagram in the corner. A fountain pen at the edge. |
| `subloops` | Three concentric timing rings rotating at different rates, drawn as a mechanical escapement diagram, with a small state-machine flow beside them. A pair of dividers at the edge. |
| `the-day-the-agent-started-talking-to-itself` | A signal-path diagram where a loudspeaker's output arcs back into a microphone, forming a closed loop that feeds itself; a waveform curling into an ouroboros. One rust-orange arrow marks the return path. |
| `why-just-use-the-best-model-is-not-a-strategy` | An old telephone-exchange patch panel drawn schematically: one input, four labelled outgoing routes, three connected correctly and one plugged into a socket marked with a small rust-orange cross. |
| `making-a-camera-feel-live` | A timing chart with a long bar shrinking to a very short one, beside a lens cross-section and a falling curve on graph paper. A stopwatch at the edge. |
| `looking-for-a-robot-that-was-there-the-whole-time` | A grid of 254 small empty squares like a survey map, nine faintly marked, one ringed in rust-orange near the middle. A brass magnifying glass at the edge. |
| `noise-echo-and-the-microphone-problem` | A cross-section of a loudspeaker and a microphone in one housing, with reflected sound paths bouncing off room walls; a waveform with a decaying echo tail and a fader scale. |
| `a-deadlock-caused-by-the-garbage-collector` | Two parallel thread lanes drawn as railway tracks meeting at a junction where both signals show stop; a small chain with one closed link. A stopped pocket watch at the edge. |
| `envelope-encryption-and-what-delete-should-mean` | Nested envelopes drawn in cutaway, the outer sealing a ring of smaller sealed envelopes, each holding a tiny key. A wax seal and a burnt match at the edge. |
| `the-hollow-promise` | A heavy strongbox drawn in precise line work, firmly padlocked — with its key hanging on a small hook mounted on the outside of the same box. One rust-orange line points at the key. |
| `a-privacy-scanner-in-your-pre-commit-hook` | A stream of small document icons falling through a fine mesh sieve; three are caught and marked, the rest pass. A rubber stamp lying face-up at the edge. |
| `i-thought-my-repo-was-private` | A window drawn in elevation with its shutters wide open and daylight falling through, while a small "closed" latch sits unfastened beside it. A padlock lying open at the edge. |
| `the-update-that-deleted-its-own-face-recognition` | A filing drawer being pulled out and replaced wholesale, while a small paper tag on a string remains attached to the empty frame. A torn label at the edge. |
| `verifying-an-installer-before-you-run-it` | A sealed parcel with a wax seal and a tag bearing a long row of abstracted characters; a magnifying glass held over the tag comparing it to a second tag. |

### Editing the real assembly photographs

The build post uses real photographs. To make them sit beside the generated
covers without clashing, the treatment matters more than any filter — see the
image-to-image prompt below. The critical instruction is that the robot's actual
geometry must be preserved exactly; an image model left to its own devices will
cheerfully redesign the hardware.

### Mechanics

Export each as **webp, 1200×1200**, to `public/blog/<slug>/cover.webp`, add the
`cover:` line to the frontmatter, then from the repo root:

```bash
node scripts/build-image-dims.mjs
```

Skipping that leaves the layout without dimensions and produces layout shift.
