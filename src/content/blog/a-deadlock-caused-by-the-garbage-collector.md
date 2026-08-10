---
title: "AURA 12 · A deadlock caused by the garbage collector"
date: 2026-10-18
tags: ["development", "python", "debugging"]
cover: "/blog/a-deadlock-caused-by-the-garbage-collector/cover.webp"
cardTag: "Development · Python"
draft: true
---

The test suite stopped at test 22 of 346. Every time. Same place.

The file containing test 22 passed on its own, in sixteen seconds, all eight
tests green.

That combination — deterministic in the full suite, fine in isolation — is one
of the more annoying shapes a bug can take, and the way out of it was a
debugging tool I do not use often enough.

## First, three wrong theories

**"It is just slow."** The work factor on the key-derivation function had gone
up recently by design, so some slowness was expected. I let it run. It did not
finish.

**"It is contention."** Then I noticed I had, over the course of an afternoon of
increasingly impatient re-runs, left several full test suites running
simultaneously. Seven of them, fighting over the same cores. I killed them all,
felt appropriately foolish, and ran again on an idle machine.

Twenty-one dots. Stop.

**"It is output buffering."** When pytest writes to a file rather than a
terminal, output is block-buffered, so a stalled-looking run can be a running
one whose dots have not been flushed. I re-ran with `PYTHONUNBUFFERED=1`.

Twenty-one dots. Stop.

At which point it was real, reproducible, and I had spent an hour learning
nothing about it.

## The tool that ended it

pytest has a setting I should reach for far sooner:

```
-o faulthandler_timeout=45
```

If any test runs longer than that, it dumps the stack of **every thread** and
carries on. Not a profiler, not a debugger, no instrumentation. One flag.

The answer arrived in one line:

```
File "mediapipe/tasks/python/vision/hand_landmarker.py", line 603 in __del__
File "mediapipe/tasks/python/vision/hand_landmarker.py", line 579 in close
File ".../serial_dispatcher.py", line 74 in shutdown_aware_handler
File "concurrent/futures/_base.py", line 451 in result
File "threading.py", line 355 in wait
```

Read from the bottom up: the object's finaliser had called the library's own
shutdown routine, which was waiting on a background worker to acknowledge it.
Waiting, with no timeout, on a thread that was never going to answer.

And where was this happening? Look at the frames above it:

```
File "pydantic/_internal/_generate_schema.py", line 913 ...
File "fastapi/dependencies/utils.py", line 311 in get_dependant
File "fastapi/routing.py", line 949 in __init__
```

Mid-way through FastAPI constructing a route. The garbage collector had picked
that moment to finalise an object it had been holding, and the finaliser
deadlocked.

## The actual bug

Gesture detection defaults to on. So **every** application instance built a real
mediapipe hand landmarker — an 8 MB model with native threads behind it — and
nothing ever released it.

In the test suite that meant hundreds of them, created and abandoned. Eventually
the garbage collector got around to one, called its finaliser, and the finaliser
blocked forever waiting on a worker that was not going to answer.

Test 22 was not special. It was simply where the accumulated garbage crossed a
threshold. The determinism that made it look like a specific-test problem came
from the allocation pattern being identical every run.

And this is the part that turns it from a test annoyance into a real finding:
**it was not a test artefact**. Production leaked one per application start and
never closed it. The suite made it obvious by doing it hundreds of times, but
the leak was in the shipped code.

## Why CI never saw it

The gesture support is an optional dependency. CI does not install it.

So the continuous integration that gates every push had, for its entire
existence, been running a code path where the offending object was never
constructed. Green forever, on a configuration no user has.

That is worth sitting with. **Your CI covers the dependency set you told it to
install, not the one your users run.** Every optional extra is a branch your
pipeline may never execute, and the more "graceful degradation when X is
missing" you build, the more likely CI is silently exercising the degraded path
in perpetuity.

## The fix

Two parts, and both matter.

**Release it deliberately.** The detector gained a way to shut its model down on
demand — safe to call twice, and guaranteed never to raise, because it runs
during shutdown and an exception in teardown turns one problem into two. The
application now calls it as part of stopping. Once that has happened the
finaliser has nothing left to do, so the collector can run it at whatever
inconvenient moment it likes, with no consequence.

**Do not build it when you do not need it.** The test suite now defaults gesture
detection off. Loading an 8 MB machine-learning model to test an unrelated HTTP
endpoint was never sensible, and the suite got faster: 346 tests in about two
minutes, no stall.

## What generalises

**A finaliser is not a destructor.** In Python it is a hint that runs whenever
the collector feels like it: possibly on another thread, possibly in the middle
of unrelated work, possibly never at all. Any resource with real teardown
semantics — native threads, file handles, sockets, GPU contexts — needs a
release you call yourself, at a moment you chose. Where a library offers one,
the finaliser is a safety net and not a plan.

**Deterministic-in-suite, fine-in-isolation means shared state.** Global state,
import-time side effects, or — as here — accumulated garbage. It is never really
about the test that stops.

**Reach for the stack dump earlier.** I spent an hour on plausible theories that
cost nothing to test and taught me nothing. One flag would have skipped all of
it. The instinct to reason about a hang before observing it is strong and almost
always wrong: a hang is the one bug type where the process is *sitting still and
willing to tell you exactly where it is*.

**And check what your CI is not running.** Every optional dependency in your
project is a code path someone runs and your pipeline does not.

---

*Next: privacy as an engineering problem. Envelope encryption, and what
"delete" should actually mean.*
