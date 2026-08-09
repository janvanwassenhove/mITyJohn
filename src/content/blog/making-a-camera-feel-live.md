---
title: "From 1554 ms to 131 ms: making a camera feel live"
date: 2026-09-27
tags: ["hardware", "performance", "robotics", "python"]
cover: "/blog/making-a-camera-feel-live/cover.webp"
cardTag: "Hardware · Performance"
draft: true
---

The complaint was "video sync performance is really slow, enormous delay before
it shows in the app". Which is the kind of report that is completely correct and
tells you nothing about where to look.

The video was not dropping frames. It was carrying 1.3 MB of them.

## Measure on the real device or do not bother

The first thing I did was resist the urge to fix anything, and instead measure
against the actual robot on my desk. Not a synthetic benchmark, not the fake
adapter — the real Pi, over the real network, with the real camera.

That distinction turned out to matter enormously, and not only for the obvious
reason. I will come back to it, because my measurement harness had four bugs in
it and every one of them made the system look healthier than it was.

The first honest number:

| | Before |
|---|---|
| Perception frame | **1554 ms** |
| Frame size | **1366 KB** |

A second and a half to get one frame for face recognition. And there it is,
sitting in the second row: **1366 KB**. A full-resolution JPEG, crossing a
domestic wifi link, so that a face-embedding model could look at it.

## Fix one: stop sending pixels nobody wants

The face embedder does not need a 1366 KB image. It needs a face, at a modest
resolution, and it will downscale internally anyway. Every byte above what the
model consumes is pure transport cost.

So: downscale at the source. The robot resizes the frame before encoding, and
the width is a parameter the brain passes, so the consumer decides what it
needs rather than the producer guessing.

| | Before | After |
|---|---|---|
| Perception frame | 1554 ms | **131 ms** |
| Frame size | 1366 KB | **69 KB** |

Roughly twelve times faster, twenty times smaller. From one change, and the
change was not clever — it was noticing that a number in a table was absurd.

This is the least interesting fix in the post and by far the largest win, which
is typical. The satisfying optimisations are rarely the profitable ones.

## Fix two: the cache with a zero percent hit rate

There were two consumers of camera frames — face recognition and gesture
detection — each fetching independently. Obvious answer: cache the frame
briefly, let both share it.

I built it. It was well-structured. It had tests. The tests passed.

I deployed it, measured, and got this:

- **0 cache hits out of 14** sequential requests.
- **0 out of 3** concurrent requests.

Not a poor hit rate. Zero. The cache was never, not once, hit.

The reason, once I stopped staring at the cache code and started reading the
*call site*: the cache was keyed on the source frame's identity, but each
request grabbed its own frame from the camera **before** performing the lookup.
Two requests arriving a millisecond apart each fetched a fresh frame, computed a
different key, missed, and stored a new entry. The cache was a very tidy
write-only data structure.

Every test passed because every test verified what the cache did once it had a
key: store, retrieve, expire. None of them verified the thing that mattered,
which was whether two real requests ever produced the same key.

The rewrite is embarrassingly small. Instead of keying on the frame, use a short
time-to-live and check it **before** the grab:

- request arrives
- is there a frame younger than the TTL? → return it
- otherwise grab, store, return

| | Before | After |
|---|---|---|
| Two concurrent frame requests | ~180 ms | **18–24 ms** |

Same idea, same amount of code, correct order of operations.

## My measurement harness was worse than my code

This is the part I would most like you to take away, because it nearly sent me
in the wrong direction repeatedly.

While building the harness I hit, in sequence:

- **An adapter that was never connected.** It returned quickly and plausibly,
  and I briefly believed the system was much faster than it was.
- **A doubled URL prefix.** Requests went to `/robot/robot/...`. The error was
  handled, so the timing looked fine.
- **A fake frame of about 5 KB**, where a real one was 700 KB. My synthetic
  benchmark had optimised away the entire problem before I started.
- **A uvicorn server started inside the test's own event loop**, while the test
  client drove its own. That one just hung.

Four bugs, all in the thing measuring, none in the thing measured. Three of the
four made performance look *better*.

If you take one habit from this post: **treat your benchmark as production
code**. It is the instrument you will use to decide whether your changes worked,
and an instrument that reads high is worse than no instrument, because it makes
you confident.

## Where it landed

- Perception frames: 1554 ms → 131 ms; 1366 KB → 69 KB.
- Concurrent frame fetches: ~180 ms → 18–24 ms.
- Live view: roughly 128 ms median.

The robot now turns its head while you are still in the doorway rather than
after you have sat down. That is what the numbers were for.

## Three things that generalise

**"It feels slow" is a symptom with no location.** The instinct is to optimise
what you were last working on. The discipline is to measure the whole path first,
on real hardware, and let the absurd number tell you where to go. Mine was
sitting in plain sight, in a column I had not thought to look at.

**Tests prove behaviour, not effectiveness.** My cache was correct and useless.
No unit test would ever have found that, because it was not a bug in the cache —
it was a bug in the relationship between the cache and its caller. The only
thing that catches it is instrumenting the real system and looking at the hit
rate.

**Some things you can only learn by deploying.** I could not have reasoned my
way to a zero percent hit rate. It required running the actual code against the
actual robot and asking the boring question: *is this thing I built doing
anything at all?*

Ask that question about the last optimisation you shipped. I did, and the answer
was no.

---

*Next: hunting for a robot that was on the network the whole time, while my
diagnostic tools told me — honestly and confidently — that it was not.*
