---
title: "AURA 12 · From 1554 ms to 131 ms: making a camera feel live"
date: 2026-08-22
tags: ["hardware", "performance", "robotics", "python"]
cover: "/blog/making-a-camera-feel-live/cover.webp"
cardTag: "Hardware · Performance"
draft: false
---

The report was short and entirely accurate: *the video lags.*

It did. You walked past the robot, and some time later — long enough to have sat
down and opened a laptop — the head turned to look at where you had been. It had
the air of a creature waking from a nap and being too polite to mention it.

The video was not dropping frames. It was carrying 1.3 megabytes of them, one at
a time, across the wifi, for a task that needed a thumbnail.

## Measure on the real device, or do not bother

The first thing I did was resist the urge to fix anything.

Not out of discipline — out of experience. "It feels slow" is a symptom with no
address, and the instinct is always to optimise whatever you happened to be
working on last. So instead I measured the whole path against the actual robot
on my actual desk, over my actual wifi.

The first honest number:

| | Before |
|---|---|
| Perception frame | **1554 ms** |
| Frame size | **1366 KB** |

A second and a half to fetch one frame so that a face-recognition model could
look at it. And there in the second row, sitting quietly, drawing no attention
to itself whatsoever: **1366 KB**. A full-resolution JPEG. Crossing a domestic
network. So a model could decide whether the shape in it was me.

## Fix one: stop posting pixels nobody asked for

The face embedder does not need a 1366 KB image. It needs a face, at modest
resolution, and it downscales internally anyway. Every byte above what the model
consumes is pure postage.

So: shrink it at the source. The robot resizes before encoding, and the width is
a parameter the brain passes — the consumer states what it needs instead of the
producer guessing.

| | Before | After |
|---|---|---|
| Perception frame | 1554 ms | **131 ms** |
| Frame size | 1366 KB | **69 KB** |

Twelve times faster. Twenty times smaller. One change, and the change was not
clever — it was noticing that a number in a table was absurd.

This is the least interesting fix in the post and by a wide margin the largest
win, which is how it usually goes. The satisfying optimisations are rarely the
profitable ones.

## Fix two: the cache that never once worked

Two things wanted camera frames — face recognition and gesture detection — and
each was fetching its own. Obvious answer: cache the frame briefly, let them
share.

I built it. It was well structured. It had tests. The tests passed.

Then I deployed it, measured, and got this:

- **0 cache hits out of 14** sequential requests.
- **0 out of 3** concurrent requests.

Not a poor hit rate. Zero. Not once, in any request, ever.

The reason — visible the moment I stopped staring at the cache and read the
*call site* — was that the cache was keyed on the source frame's identity, while
every request grabbed its own fresh frame **before** performing the lookup. Two
requests a millisecond apart each fetched a different frame, computed a
different key, missed, and stored a new entry.

I had built a very tidy write-only data structure. It stored things beautifully.
Nothing ever came back for them.

Every test passed because every test checked what the cache did *once it had a
key*: store, retrieve, expire. None checked the only thing that mattered —
whether two real requests ever produce the same key.

The rewrite is embarrassingly small. Instead of keying on the frame, use a short
time-to-live and check it **before** the grab:

- request arrives
- is there a frame younger than the TTL? → return it
- otherwise grab, store, return

| | Before | After |
|---|---|---|
| Two concurrent frame requests | ~180 ms | **18–24 ms** |

Same idea. Same amount of code. Correct order of operations.

## My measurement harness was worse than my code

This is the part that nearly sent me the wrong way repeatedly, and the reason I
no longer trust an instrument I have not tested.

While building the thing that would tell me whether my changes worked, I hit, in
sequence:

**An adapter that was never connected.** It returned quickly and plausibly, and
I briefly believed the system was far faster than it was.

**A doubled URL prefix.** Requests went to `/robot/robot/...`. The error was
handled, so the timing looked fine.

**A fake frame of about 5 KB**, where a real one is 700 KB. My synthetic
benchmark had optimised away the entire problem before I started.

**A server started inside the test's own event loop**, while the test client ran
its own. That one simply hung, which was at least honest about it.

Four bugs. All of them in the thing doing the measuring. Three of them made
performance look *better*.

If you take one habit from this post: **treat your benchmark as production
code**. It is the instrument you will use to decide whether your work succeeded,
and an instrument that reads high is worse than no instrument at all, because it
makes you confident.

## Where it landed

- Perception frames: 1554 ms → 131 ms; 1366 KB → 69 KB.
- Concurrent frame fetches: ~180 ms → 18–24 ms.
- Live view: roughly 128 ms median.

The robot now turns its head while you are still in the doorway, rather than
once you have made yourself comfortable. That is what the numbers were for.

## Three things that generalise

**"It feels slow" has no address.** Measure the whole path, on real hardware,
and let the absurd number tell you where to go. Mine was in plain sight, in a
column I had not thought to look at.

**Tests prove behaviour, not usefulness.** My cache was correct and useless. No
unit test would ever have caught it, because it was not a bug in the cache — it
was a bug in the relationship between the cache and its caller. Only
instrumenting the real system finds those.

**Some things you can only learn by deploying.** I could not have reasoned my
way to a zero percent hit rate. It needed the actual code, against the actual
robot, and the deliberately stupid question: *is this thing I built doing
anything at all?*

Ask that about the last optimisation you shipped. I did, and the answer was no.

---

*Next: hunting for a robot that was on the network the whole time, while my
diagnostic tools told me — honestly, and with total confidence — that it was
not.*
