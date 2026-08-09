---
title: "The update that deleted its own face recognition"
date: 2026-11-22
tags: ["development", "electron", "packaging"]
cover: "/blog/the-update-that-deleted-its-own-face-recognition/cover.webp"
cardTag: "Development · Electron"
draft: true
---

> "After the update my brain and my people are gone."
>
> "It cannot recognise me any more."
>
> "Why does it say BENIGN?"

Three reports, one afternoon, one cause. And then — after I had fixed it — the
same symptom came back for a completely different reason, several times, until I
stopped trusting the thing I was checking.

This is a post about installers, which are a state-migration problem wearing a
progress bar.

## Everything was relative to the wrong directory

The desktop application starts a Python process. That process ran with its
working directory inside the installation folder. And every persistent path was
relative to it:

- `.env` — including the encryption passphrase
- `data/knowledge.enc.json` — people and facts
- `data/recognition.enc.json` — face embeddings
- `data/aura-memory.db` — conversations, reminders, todos
- `skills/` — learned routines

The Windows installer replaces the installation directory on every update.

So: profiles gone, embeddings gone, conversation history gone, skills gone. And
the third symptom explains itself once you see the first — with the passphrase
missing, the store falls back to unencrypted, and face recognition refuses to
start, because biometric data may only exist encrypted. The system was working
exactly as designed, on top of a catastrophe.

I went looking for a recovery path. No export in Downloads, Desktop or
Documents. Recycle bin empty. It was not recoverable.

That is the worst kind of bug: silent, total, and caused entirely by a default
nobody chose. Nobody decided to store user data inside `Program Files`. It
happened because a relative path is the shortest thing to write.

## The fix, and the one detail worth copying

All persistent state moved to the per-user application data directory —
`userData` — which survives both updates and reinstallation. The paths are set
explicitly at process start rather than inherited from whatever the working
directory happens to be.

Two details worth stealing:

**Explicit values still win.** The app sets defaults; anything configured
explicitly overrides them. Making paths robust must not take away the ability to
point them somewhere else.

**A one-time migration that never overwrites.** On start, if there is state in
the old location and none in the new one, copy it across. Never in reverse,
never overwriting. Data loss during a data-loss fix would be a special kind of
insult.

Development checkouts keep repository-relative paths, so running from source
never touches the real application's data. I appreciated that boundary more than
I expected — it is why I could run the full test suite repeatedly without any
risk to the profiles.

## Then it happened again

Some weeks later:

> "Face recognition isn't installed on this machine."

That message was itself a fix from an earlier round — the honest error, replacing
one that used to say *"no face in frame — look straight at the robot"*, which
blamed the user's posture for a missing dependency. It was doing its job.

But the underlying cause was new. Checking the bundled Python environment:
`insightface` and `onnxruntime` were missing. `PIL` was present — which was
itself informative, because it proved an earlier fix (promoting Pillow to a core
dependency) had held, while the heavy optional extra had vanished again.

The file timestamps told the story:

```
09:54  update installs (installer replaces the whole directory, including .venv)
09:55  bootstrap runs, writes "done" marker
10:02  environment rebuilt at first start — without recognition
```

## A marker that outlived the thing it described

Here is the actual bug, and it is a good one.

The bootstrap writes a marker saying "I have set up the environment". That marker
lives in `userData` — because of the fix above, which was correct.

The environment it describes lives in the *installation* directory, which the
installer replaces.

So after every update: the environment is gone, the marker survives, the
bootstrap reads the marker, concludes there is nothing to do, and the environment
gets rebuilt later by a plainer code path that does not include the optional
extras. Face recognition disappears. Forever, because the marker will keep saying
"done" for the rest of the installation's life.

There was a second, compounding fault: the bootstrap also wrote its "done" marker
when its own error handling had fallen back to a reduced install. So even a
partial success was recorded as complete.

I ruled out the plausible alternatives before believing this, which mattered
because the obvious suspects were innocent: the bootstrap command itself worked
(exit 0, installed the packages), and the launcher was not pruning the extras.

## Check the capability, not the bookkeeping

The fix is one sentence, and it is the reason this post exists:

> Do not check whether you once did the work. Check whether the result is
> present.

The bootstrap now looks for the actual packages in the environment — a cheap
directory check, no subprocess on the startup path — and re-runs the install
whenever they are absent, regardless of what any marker claims. It heals itself
after every update instead of remembering, once, that it used to be fine.

With a bound: a failure counter, so a genuinely broken dependency retries twice
and then stops rather than reinstalling on every launch forever.

## What generalises

**Installers replace directories.** Anything inside one is temporary, no matter
how permanent it feels. The question to ask of every file your application
writes: *does this survive an update?* If you cannot answer immediately, it does
not.

**A marker must describe observable state.** "I did X" is a claim about the past.
"X is present" is a claim about now, and only the second one is still true after
something else has changed the world. Every idempotency marker, migration flag
and setup sentinel deserves this test: *if someone deleted the thing this
describes, would this flag notice?*

**Never record success from an error handler.** If your fallback path writes the
same completion marker as the happy path, you have made partial failure
permanent.

**Two components, two lifetimes, one assumption.** The marker and the environment
were both handled correctly on their own. The bug was in believing they would
disappear together. Any time you have state in two places with different
lifecycles, the interesting failure is one of them being reset.

The immediate damage I could repair by hand — reinstalling the missing packages
so recognition worked again after a restart. The bug was that the system could
not repair itself, and had been quietly failing to do so after every single
update.

---

*Next, and last: verifying an installer before you run it — because auto-update
is remote code execution you have opted into.*
