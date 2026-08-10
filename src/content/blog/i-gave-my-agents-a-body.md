---
title: "AURA 01 · I gave my agents a body"
date: 2026-08-16
tags: ["ai", "development", "robotics", "agents"]
cover: "/blog/i-gave-my-agents-a-body/cover.webp"
cardTag: "AI · Robotics"
draft: true
---

There is a version of agentic AI you have already met. It lives in a chat
window, it occasionally calls a tool, and when it finishes you read what it
produced and decide whether to keep it.

This is about the other version. A backlog instead of a prompt. A loop that
keeps going after you stop watching. Approval gates on anything that touches
the world. And, because I wanted the feedback to be impossible to ignore, a
robot on my desk that looks up when I walk into the room.

It is called AURA, it runs on a Reachy Mini, and this is the first of a series
about building it — including the parts that went badly, which is most of the
interesting parts.

## The name is the specification

I named it before I built it, which sounds like vanity and turned out to be the
most useful thing I did. **AURA** stands for **Adaptive, Unified, Robotic
Assistant**, and each of those four words is a constraint I had to keep meeting.

**Adaptive.** It adjusts to the person in front of it, the context and the
situation. Not a settings screen with a "tone" dropdown — the assistant knows
who walked in, what it has learned about them, and what it is allowed to know.
A guest gets a name and a polite greeting; a family member gets continuity; a
child gets only what they were explicitly told, never anything inferred.

**Unified.** One conversation over mail, calendar, chat, tasks, memory and
agents, rather than seven assistants that each know a quarter of your day. This
is the least glamorous word and the one that generates the most work, because
"unified" is where all the integration lives.

**Robotic.** Physically embodied, through a Reachy Mini. Not a metaphor and not
a mascot: a device with a camera, a microphone array and motors, which means
every latency figure in this series has a face attached to it.

**Assistant.** A copilot, not a chatbot. The difference is whether it can *act*
— and therefore whether it needs approval gates, an audit trail, and a stop
button that works mid-sentence.

Keeping the name honest turned out to be a decent test. Every time I was tempted
to build something clever, I could ask which of those four words it served. More
than once the answer was "none", and the feature did not get built.

## The question everyone is asking is the wrong one

"How good will the models get" is not the question that decides what happens to
software work. The models are already good enough to be disruptive at the task
level. What has actually changed in the last year is *duration*: an agent can
now hold a goal across hours and dozens of steps instead of producing one good
answer and forgetting why it was asked.

That sounds like a quantitative improvement. It is not. It changes which part
of the job is hard.

When an assistant writes a function, you read the function. Reviewing it costs
less than writing it, so you come out ahead. When an agent works for four hours
across thirty files, reading the output is no longer cheaper than doing the
work. You have crossed a threshold, and on the other side of it your job is not
writing code and it is not reviewing code either. It is **deciding what
"done" means precisely enough that something else can check it**, and building
the machinery that does the checking.

The bottleneck moves from production to verification and trust. That is the
whole story, and almost everything I got wrong on this project was a version of
getting that wrong.

## Three things that break the moment you actually delegate

It is easy to write the paragraph above. It is much less comfortable to run it.
Three failures show up immediately, and they are not the ones the demos prepare
you for.

**The agent optimises what you measured, not what you meant.** Ask for a cache
and you will get a cache. It will be well-structured, it will have tests, and
those tests will pass. Later in this series I will show you one I shipped that
had a *zero percent hit rate in production* — fourteen requests, zero hits —
because the design was plausible, the tests were self-consistent, and nobody
had measured the thing that mattered.

**Verification costs more than the work.** This is the real tax. Anyone can
generate a change; the expensive part is knowing it did what you wanted on your
machine, with your data. On this project the answer was a test suite that gates
every unit — currently 346 tests for the brain alone, plus the console, schemas
and connectors — and a rule that a unit is not done until the ledger records
what was *measured*, not what was intended.

**Failure is silent.** This is the one that nearly ruined the project. A
well-built system degrades gracefully, and graceful degradation is
indistinguishable from working unless you look. I once broke every single
conversational turn — every one — and the system kept answering. It answered
with an echo of the question, politely, for days.

## So I gave it a body

You can address all three of those on paper. I have read the blog posts. I have
written some of them. What I had not done was put an agent somewhere it could
embarrass me in front of my family.

A robot is unusually good at this. It sits on the desk. When the camera
pipeline is slow you do not read it in a dashboard, you watch it turn its head
a second and a half after you have already left. When speech recognition
mis-hears, it says something wrong *out loud*. When a release wipes its own
data, the person asking "where did my profile go?" is standing in front of you.

AURA is what came out of that. It recognises who is in the room and adapts to
them. It holds a spoken conversation you can interrupt mid-sentence. It reaches
into mail, calendar, chat and tasks, with an approval gate on anything that
matters. Everything personal is encrypted on my own laptop; the robot itself
holds no keys, no tokens and no profiles, so stealing it gets you motors.

And it was built the way this post is about: by an agent loop working a backlog,
unit by unit, each one committed, tested and released.

## The numbers, and what they are worth

Roughly 226 units. 287 commits. About 50 releases. A test suite that runs on
every push, and a scan that refuses to let personal data reach git.

Those numbers are real but they are not the point, and I want to say that
plainly because throughput is the easiest thing to brag about and the least
interesting thing to know. A loop that produces 226 units of confident nonsense
is worse than no loop. What makes the number mean anything is the ledger sitting
next to it: every unit recorded with what was measured, including the entries
that say *this was not visually verified* or *my first three attempts were
wrong*.

That ledger is the actual artefact. The code is downstream of it.

## What this series will cover

Every post is anchored to something you can check in the
[public repository](https://github.com/janvanwassenhove/aura) — a measured
number, a commit, or a failure recorded while it was still embarrassing.

The **agent loop** itself: how a backlog-driven loop is structured, where the
hard edges go, and the rule that made it survivable — the loop may run twenty
rounds, but every sensitive action still asks me, every time.

The **subloops**: perception, conversation and maintenance running at different
frequencies, and the bugs that live in between them. Including the day the robot
started answering questions nobody had asked, because its own voice was
hallucinating its own wake word back into its own input.

The **hardware**, which fights back: taking camera latency from 1554 ms to
131 ms, and hunting for a robot that was on the network the entire time while my
diagnostic tools confidently told me it was not.

And **privacy as engineering**: envelope encryption where deleting a person
destroys their key rather than a row — and the day I discovered the encryption I
was proud of was protecting nothing, because the passphrase was sitting in a
file next to the ciphertext, with the same permissions.

There is one post in the middle that I think matters most, and it is the one
that sounds least dramatic: how the thing actually learns. Not by fine-tuning a
model — by accumulating structured evidence about people, adapting what it says
to who is standing there, and writing down skills that I approve one at a time.
That is where "assistant" stops being a word and starts being a design.

---

*AURA is [open source](https://github.com/janvanwassenhove/aura) (Apache-2.0)
and there are [installers](https://github.com/janvanwassenhove/aura/releases/latest)
for Windows, macOS and Linux. The whole stack runs without a robot if you just
want to poke at it.*
