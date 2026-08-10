---
title: "AURA 11 · Noise, echo, and the microphone problem nobody solves in a weekend"
date: 2026-10-11
tags: ["hardware", "voice", "robotics"]
cover: "/blog/noise-echo-and-the-microphone-problem/cover.webp"
cardTag: "Hardware · Voice"
draft: true
---

Speech is the feature people assume is solved. The models are extraordinary, the
APIs are one call, and every demo works.

Then you put a speaker and a microphone in the same small plastic body, in a
room with a fridge and a dishwasher and other humans, and you discover that
speech in a real space is an acoustics problem long before it is a model
problem.

Here is what I actually hit, including the thing I have not fixed.

## The robot was inaudible, and it was not the code

The first complaint about voice was simply that you could not hear it. The
speech synthesis was fine. The audio arrived at the robot correctly. It came out
as a whisper.

I spent an unreasonable amount of time on the software path — resampling,
buffer sizes, the volume multiplier — before checking the actual mixer on the
Pi.

The PCM channel was sitting at **62%, which is −23 dB**.

Set it to 100% / 0 dB, persist it so it survives a reboot, done. That single
change did more for perceived audio quality than every software adjustment
combined.

I include this slightly humiliating detail because it is the most transferable
thing in the post. When a hardware output is wrong, **check the hardware's own
controls before you touch your code**. There is an entire stack of gain stages
between your buffer and the air, and most of them are not in your program.

## Consistency beats loudness

With the mixer fixed, the next problem: some replies were comfortable and others
made you flinch or lean in. The variation was not in the volume setting, it was
in the audio itself — synthesised speech does not come out at a constant level,
and neither do different voices or different sentence lengths.

The fix is peak normalisation per utterance: before applying the volume gain,
scale each utterance so its loudest sample sits near the ceiling (0.95, leaving
headroom against clipping).

The point is not that this is clever — it is standard practice. The point is
which property matters. For something that talks to you all day in a room you
live in, **loudness consistency matters more than peak loudness**. Anything
that makes you reach for a volume control is a failure, and the reaching is
caused by variation, not by absolute level.

## Barge-in: the part that works

The thing I am happiest with. While the robot is speaking, the microphone keeps
listening, and you can cut it off mid-word.

Mechanically:

1. The interruption is detected while text-to-speech is playing.
2. The robot's audio is stopped immediately at the player, not at the end of the
   current buffer — you want the word to stop, not the sentence.
3. The in-flight language-model call is cancelled, along with the speaking task.
4. The interrupting utterance becomes the new active turn.
5. The model is told, **once**, that its previous answer was cut off.

Step five is the difference between "interruption is handled" and "interruption
feels natural". Without it, the model has no idea it was interrupted and will
happily resume the point nobody is still listening to. With it, you get the
human behaviour: acknowledge, drop it, move on.

Treating interruption as a state of its own rather than an error to catch is
what makes this tractable. If interruption is an error you catch, you get an assistant
that stops badly. If it is a state you transition through, it stops the way a
person does.

## The part that does not work

Now the honest section, which I would rather write than have you discover.

**Full-duplex with acoustic echo cancellation is not stable in a live room.**

The goal is obvious: the robot should hear you while it is talking, cleanly, so
you never have to wait for it to finish. That means cancelling its own voice out
of its own microphone input, in real time, in a room with reflections and
latency and a speaker centimetres from the microphone.

That is a genuinely hard signal-processing problem, and it is hard in a way that
does not yield to a better model or a bigger API. The echo path changes when the
robot moves its head. It changes when you move. It changes when a door opens.
Adaptive cancellation has to keep converging, and every time it loses
convergence the assistant either hears itself — which produces exactly the
self-conversation bug I wrote about earlier — or deafens itself defensively at
the moment you actually want to speak.

What ships instead is coarser and reliable: wake-word gating plus an echo guard
that recognises the robot's own words in the transcript and strips them. It
works. It is not full duplex. There is a moment where you should wait.

I could have written "natural, interruptible conversation" and stopped at the
barge-in section, and it would have been true. It would also have been the kind
of true that leaves out the interesting part.

**What I would try next**, in order: proper on-device echo cancellation running
on the Pi where the loudspeaker signal is available with known timing, rather
than attempting it after the audio has crossed a network; a hardware microphone
array with beamforming away from the speaker; and accepting a small deliberate
duck of output level while listening, which is cheating but is what conference
phones have done for thirty years for good reasons.

## The general shape

Every problem in this post was in the same category: **the physical layer had
opinions**, and my software was written as though it did not.

A mixer level. A gain stage. Sound arriving back at a microphone through air. A
speaker sharing a body with the thing that listens. None of these appear in an
API surface, none of them show up in tests against a fake device, and all of
them dominate the experience.

If you are building something embodied, budget for this. The intelligence is a
library call. Making a physical object hear and be heard in a room where people
live is the actual work, and it is the part nobody solves in a weekend.

---

*Next: a deadlock caused by the garbage collector, and the debugging tool that
turned two hours of guessing into thirty seconds of certainty.*
