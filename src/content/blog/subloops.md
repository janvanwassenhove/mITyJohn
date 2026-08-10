---
title: "Subloops: the parts that run whether you are talking or not"
date: 2026-09-06
tags: ["ai", "development", "agents", "architecture"]
cover: "/blog/subloops/cover.webp"
cardTag: "AI · Architecture"
draft: true
---

A chatbot is a request/response system. You say something, it thinks, it
answers, and between your messages it does not exist.

An embodied assistant is not that. It is several loops running at different
frequencies whether or not anyone is talking to it, and the moment you add the
second loop you have a distributed system on one machine — with all the
coordination problems that implies and none of the tooling, because it does not
look like a distributed system.

This is the architecture that emerged, and the failures that shaped it.

## Three loops, three clocks

**Perception** runs continuously against the camera. A frame comes in, gets
downscaled, gets turned into a face embedding, and the embedding is matched
against the encrypted gallery. It runs whether anyone is speaking, because
knowing who walked into the room is not a response to a question — it is
context that must already exist when the question arrives.

**Conversation** is event-driven and, crucially, is a real state machine rather
than a chain of awaits:

```
IDLE → LISTENING → TRANSCRIBING → THINKING → SPEAKING
                        ↑                        │
                        └──── INTERRUPTED ←──────┘
```

`INTERRUPTED` is a first-class state, not an exception path. That is the whole
design decision. If interruption is an error you handle, you get an assistant
that stops badly; if it is a state you transition through, you get one that can
be cut off mid-word and pick up coherently — including telling the model, once,
that its previous answer was cut off so it does not cheerfully resume a sentence
nobody is still listening to.

Every transition is logged with the turn id and the flags that matter
(`tts_playing`, `llm_active`, `cancel_requested`) and never with audio or
secrets. When something goes wrong in a voice system, the transition log is the
only artefact that makes it explicable after the fact.

**Maintenance** runs every five minutes and asks small, boring questions. Is the
robot reachable? Is there an LLM key and does it work? Is text-to-speech
configured? Is the knowledge store actually encrypted? It reconnects the robot
by itself when the link has dropped, and it emits a report onto the event bus
that shows up in the console.

That last part is the design principle: **self-healing that reports what it
healed.** A system that silently fixes itself is indistinguishable from one that
was never broken, right up until it fixes itself in a way you would not have
chosen. If the robot has been reconnected eleven times this morning, I want to
know that, even though everything "works".

## The gate between capability and crypto

Here is a coupling I did not anticipate but would keep.

Perception starts at boot. Face *recognition* does not — it only joins once the
knowledge store is encrypted and unlocked.

The reason is a policy, not a performance concern: a face embedding is
biometric data, and in this system biometric data may not exist on disk
unencrypted. Ever. So the capability that produces embeddings is gated on the
crypto being live, and the gate is structural rather than a check somebody
remembers to write.

This has a consequence that looked like a bug for an entire evening. When a
release wiped the app's data directory (a story for a later post), the
passphrase went with it, the store fell back to unencrypted, and face
recognition simply refused to start. The report I got was "the robot cannot
recognise me any more". The cause was three layers away, and the system was
behaving exactly as designed.

I still think the design is right. What was wrong was that it did not *say* so.
The current version tells you plainly that recognition is off because the store
is not encrypted, and gives you the button to fix it. A correct refusal that
cannot explain itself is a bad refusal.

## Where the bugs actually live

Not in the loops. Between them.

**Shared hardware.** Gesture detection and face recognition both want camera
frames. Naively, that is two consumers each grabbing their own frame at their
own rate, which doubles the load on the slowest part of the system for no
benefit — both would happily use the same picture. Fixing that meant a shared
frame with a short time-to-live, and getting that wrong is the subject of the
performance post later in this series.

**One loop's output as another's input.** The conversation loop speaks. The
perception path hears. If you do not think about that carefully, the assistant
listens to itself, and I will show you exactly how badly that goes in the next
post.

**Lifetime and teardown.** Every loop holds resources — a camera stream, a
native model with its own threads, an HTTP client. Starting them is easy;
stopping them in the right order, when a shutdown may arrive at any point, is
where the hangs come from. This project has a shutdown sequence that explicitly
stops the voice loop, then maintenance, then the robot bridge, then perception,
then the heartbeat, then closes the clients — in that order, because a loop that
is stopped while something it depends on is already gone will wait forever on
something that is never coming.

I learned that one the hard way. A camera reader held an open stream to the
robot, and shutdown waited on a connection that does not end on its own. The app
looked like it had frozen on quit. It had.

## Degrade, do not freeze

The property I would keep above all others: **every loop must have a defined
behaviour for "the thing I depend on is not answering"**, and that behaviour
must never be "block".

The robot goes offline: the conversation loop keeps working, text-only, and says
so. The internet dies: a local model takes over, and if that is unavailable a
regex fallback handles the handful of commands worth handling offline. The brain
becomes unreachable entirely: the robot runs its own small behaviour loop on the
Pi so it stays polite rather than becoming a statue.

Each of those is a worse experience than the full system. All of them are
dramatically better than a hang, because a degraded system tells you something
and a hung one tells you nothing.

There is a related discipline that took me longer to accept: **when a loop
degrades, it must be loud about it.** The nastiest bug in this project — the one
in the post after next — was a total failure of every conversational turn,
hidden entirely by a fallback that was working exactly as designed.

Graceful degradation without visibility is not resilience. It is a system
lying to you politely.

---

*Next: how it learns — accumulating evidence about people rather than
fine-tuning a model, and deciding what a language model is allowed to be told
about the person standing in front of it.*
