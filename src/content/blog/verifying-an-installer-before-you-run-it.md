---
title: "Verifying an installer before you run it"
date: 2026-11-29
tags: ["security", "development", "electron"]
cover: "/blog/verifying-an-installer-before-you-run-it/cover.webp"
cardTag: "Security · Electron"
draft: true
---

Auto-update is remote code execution you have opted into.

That sentence is not a criticism of auto-update — it is the single most valuable
security feature most desktop software has, because it is how fixes reach people
who will never read a release note. But it is worth saying plainly, because it
describes exactly the amount of scrutiny the mechanism deserves, and for a while
mine had none at all.

## What my updater did

1. Ask GitHub for the latest release.
2. If it is newer, download the installer.
3. Ask the owner.
4. Run it, with elevated privileges.

There is no verification step in that list. Whatever came back from that
download got executed with the ability to modify the whole application.

I want to be fair to my past self: the transport is HTTPS, the source is the
GitHub API, and the practical risk was not high. But "the practical risk is not
high" is a statement about today's threat model, and the code will outlive it.
The gap between *I trust this source* and *I verified what I received* is exactly
the gap every supply-chain incident lives in.

Three specific problems, all fixed.

## 1. A name from the internet, interpolated into a script

The installer needs to run after the application quits — you cannot replace an
application while it is running — so it is launched via a small generated script.

That script contained the asset's filename. The filename comes from the release
metadata, which is data from a server.

Consider a release asset named:

```
AURA-setup.exe" & calc & "
```

Interpolate that into a quoted command and the quoting breaks, and the part after
the break is executed. Classic injection, in a place I had not thought of as a
place where injection happens, because "it is just a filename".

The fix is a whitelist rather than an escape. Before that name is used for
anything at all, it has to match a deliberately boring shape: letters, digits,
dots, dashes and underscores, and nothing else. No spaces, no quotes, no path
separators, no traversal. Anything else is refused outright.

The distinction matters. Escaping means enumerating everything dangerous and
neutralising it, and you lose that game the day someone finds a character you
forgot. Refusing means enumerating everything *safe*, which is a much shorter
list that does not grow.

## 2. Staging in a world-writable directory

The downloaded installer was written to the system temp directory and could sit
there for hours, waiting for someone to click "install now".

`%TEMP%` is writable by every process running as that user. So there was a window
— potentially long — where the file that was about to be executed with elevated
privileges could be replaced by anything else on the machine.

Fixed by staging inside the application's own per-user data folder. Not a
security boundary against a fully compromised account, but it removes the casual
window, and it costs nothing.

## 3. Nothing checked what arrived

The important one. The build now publishes a `SHA256SUMS.txt` with every release,
and the application verifies the downloaded file against it before staging.

Three design decisions in that sentence are worth pulling out.

**Verify before staging, not before running.** A file that fails verification is
discarded immediately. It never reaches a location the launcher knows about, so
there is no window in which a bad file exists in a trusted place.

**A missing checksum list is reported, never silently accepted.** This is the
decision I would defend hardest. The tempting implementation is: if there is no
checksum file, skip verification and proceed — otherwise older releases break.

That turns your security control into a suggestion, and worse, it makes the
absence of protection indistinguishable from its presence. If an attacker can
influence what your updater sees, "no checksums published" becomes the easiest
attack in the world.

So: no checksum list means the automatic path stops and the owner is sent to the
release page to update deliberately. Older releases still work; they just do not
get the silent treatment.

**An asset absent from the list is refused**, rather than assumed fine because
the list was fetched successfully.

## The tests are the point

This is a security control, which means it is a control that must fail closed and
will be exercised approximately never in normal operation. Untested, it will rot.

The assertions that matter:

- Matching checksum → accepted.
- **Tampered file → refused.** The whole reason the feature exists.
- No checksum list → reported as its own distinct outcome, never a silent pass.
- Asset not listed → refused.
- Six shapes of dangerous filename → refused: spaces, quotes, ampersands, path
  traversal, empty, null.

They run in CI, so this cannot quietly disappear in a refactor. Plain assertions
in a plain script — the package has no test runner and did not need one.

## The honest gap

Checksums published alongside the artefact by the same pipeline prove
**integrity**, not **provenance**. If someone can publish releases to the
repository, they can publish matching checksums.

What this actually defends against: corruption in transit, a compromised mirror
or CDN, and tampering with a file staged on disk. What it does not defend
against: a compromised release pipeline.

Closing that gap means signing — code signing certificates, or signed checksums
with a key that does not live in CI. That is the correct next step and I have not
taken it, so I am not going to imply otherwise.

There is one more thing I recorded at the time and will repeat here, because it
is the kind of detail that gets lost: **the first release to publish checksums
was updated to by the previous version, which had no verification.** The chain
starts one release late. That is unavoidable, and it is better said than quietly
skipped.

## What to take

**Treat "download and execute" as a boundary**, and give it the same attention as
any other input. It is the highest-privilege input your application has.

**Whitelist filenames from remote sources.** Anything that ends up in a shell
command, a path, or a filesystem call, that came from a server, is an injection
site.

**Never let a missing control look like a passing one.** This is the general
principle behind the checksum decision, and it generalises far beyond updaters —
an absent signature, an empty allow-list, a skipped check should all be *louder*
than a failure, because they are indistinguishable from success unless you make
them noisy.

**Test the refusal.** The test that a valid installer is accepted is worth
little. The test that a tampered one is rejected is the feature.

---

*That is the series. Everything in it — the numbers, the failures, the code —
is in the [public repository](https://github.com/janvanwassenhove/aura), along
with the ledger that recorded it while it was happening. The
[installers are here](https://github.com/janvanwassenhove/aura/releases/latest),
and they are now, at last, verified before they run.*
