---
title: "AURA 04 · A backlog, a loop, and 226 units"
date: 2026-08-30
tags: ["ai", "development", "agents", "sdlc"]
cover: "/blog/a-backlog-a-loop-and-226-units/cover.webp"
cardTag: "AI · SDLC"
draft: true
---

An agent that can hold a conversation is a demo. An agent that can hold a *goal*
is a colleague, and the difference is not the model — it is the structure you
put around it.

This is how AURA actually got built: a ledger of units, a loop that works
through them, and a small set of rules that made the whole thing survivable
rather than merely impressive.

## The shape

There is a file called `implementation-backlog.md`. It contains numbered units,
`U1` through `U226` at the time of writing, and it is the most important file in
the project — more important than any source file, because it is the only thing
that makes the source trustworthy.

The loop is unglamorous:

1. Pick the next unit.
2. Build it.
3. Test it.
4. Commit it.
5. Release it.
6. **Write down what was measured.**

Step six is the one that does the work. Not "implemented caching" — *"0 hits out
of 14 sequential requests, 0 of 3 concurrent, because the cache keyed on a frame
each request had already fetched."* Not "improved latency" — *"1554 ms → 131 ms,
1366 KB → 69 KB, measured against the robot on my desk."*

An agent will happily write "done" in a ledger. Making it write down a number
forces it to go and get one, and getting one usually means running the thing on
real hardware, which is where the disagreements between intention and reality
live.

## The rule that makes it survivable

**The loop may run twenty rounds. Every sensitive action still asks the owner,
every time.**

Not "asks the first time and remembers". Not "asks unless it is confident". Not
"asks in a batch at the end". Every time, for every action that touches the
outside world: sending a message, writing a file outside the workspace,
committing, pushing, spending money, deleting a person from the knowledge store.

Two details matter more than the rule itself.

**The gate is never bypassed, including by the agent's own reasoning.** It is
not a prompt instruction, which a sufficiently motivated model will talk itself
around. It is code in the path.

**Queued actions never auto-execute on reconnect.** This one is easy to get
wrong. The robot goes offline, three actions queue up, connectivity returns —
and a naive implementation now fires three approved-ages-ago actions into a
world that has moved on. Approval is not a token you can bank. When the queue
drains, it asks again.

## What the loop is genuinely good at

I want to be specific here, because both the hype and the backlash are
unspecific.

**Mechanical breadth.** Renaming a concept across forty files, threading a new
parameter through six layers, updating every call site of a changed signature.
It does not get bored on file thirty-one, which is precisely where I do.

**Consistency under repetition.** Every unit gets tests. Every unit gets a
ledger entry. Every unit gets the same commit-message discipline. Humans decay
on this and agents do not.

**Working while I am not.** Obvious, but the second-order effect is the real
one: the cost of "let's just try it and see" collapses. Several of the better
decisions in this project came from being able to build two versions and measure
them, which I would never have done by hand.

**Writing the test I would have skipped.** This is the underrated one. The test
that asserts the tampered installer is *refused*, the one that proves the
migration leaves data untouched when the passphrase is wrong — those exist
because writing them cost nothing.

## What it is bad at

**Fixing the wrong layer, confidently.** The most expensive failures were not
wrong code. They were correct code solving a problem one level away from the
actual fault. A camera felt slow; the loop optimised the encoder; the problem
was that the frame was 1.3 MB and had no business crossing the network at that
size. Every step was reasonable. The direction was wrong.

**Declaring success on the metric rather than the goal.** I asked for a cache
and got one. It was well-structured and tested. Its hit rate in production was
zero. The tests verified that the cache stored and retrieved things, which it
did, beautifully, for keys nothing ever asked for twice.

**"Verification" that only proves the code ran.** This is the failure mode to
watch for, because it looks exactly like diligence. A migration reported "14
face embeddings migrated". It had counted the encrypted blobs without
decrypting any of them. Every one could have been corrupt and the number would
have been identical. The fix was three lines; noticing was the work.

**Optimism about its own output.** Left alone, an agent writes ledger entries
that read like a press release. The countermeasure is structural: require the
entry to state what was measured, and require it to say plainly when something
was *not* verified. There are entries in this ledger that say, in effect, "the graph itself was
never actually seen — the preview window reports itself as hidden, so the
browser never paints, and I measured exactly zero frames drawn". That sentence
is worth more than the feature it describes.

## The ledger is the artefact

If you take one thing from this post, take this.

The code an agent produces is not the interesting output. You can regenerate
code. What you cannot regenerate is the record of *why* it looks like that,
which alternatives were tried, what was measured, and what is still known to be
broken.

Six months later, that record is the difference between a codebase you can
change and one you can only rewrite. It is also what makes external review
possible: this project's ledger is public, and every claim in this series of
posts can be checked against it.

There is a quieter benefit too. Writing the failures down while they are still
embarrassing changes what the loop does next. An entry that says "my first three
attempts at this were wrong, here is why" is a constraint on future work in a
way that a green test suite is not.

## Where this stops being enough

I do not want to end on a note of "and thus it was solved". Some things this
structure does not fix.

It does not tell you whether the *unit itself* was worth building. The loop is
excellent at working through a backlog and completely indifferent to whether the
backlog is any good. That judgement stayed mine, and the units I regret are all
ones where I let the loop pick.

It does not catch the failure that spans units. My worst regression was
introduced by one unit and only became visible in another, and both were
individually correct — a whole post is coming about that.

And it does not save you from an assumption you never articulated. The loop
checks what you told it to check; the thing you never thought to state is
exactly the thing nobody verifies.

---

*The ledger is [here](https://github.com/janvanwassenhove/aura/blob/master/docs/implementation-backlog.md).
It is long, it is candid, and it is in Dutch — the working language of the
project.*
