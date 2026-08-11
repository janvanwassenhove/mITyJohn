---
title: "AURA 02 · The architecture, and the day I deleted five services"
date: 2026-08-20
tags: ["ai", "development", "architecture", "robotics"]
cover: "/blog/the-architecture/cover.webp"
cardTag: "AI · Architecture"
draft: false
---

I built this as six microservices in Docker. Six containers, six health checks,
six Dockerfiles, network hops between all of them.

Then I read my own architecture back and noticed something awkward: the event
bus I was so pleased with was in-process *per container*, and everything
actually talking to anything else was doing it over plain HTTP. I was paying the
full price of microservices and receiving, in return, none of the decoupling.

For a single-user robot on a desk, that is not an architecture. It is a costume.

So this post is the shape the thing settled into, and why — because "how is it
put together" turns out to be almost entirely a series of decisions about
**where the trust boundaries are**, and only incidentally about code.

## Two machines, and one of them is stupid on purpose

Everything lives on one of two devices.

The **laptop** holds all of it: the API keys, the OAuth tokens, the encrypted
profiles, the face embeddings, the conversation history, the language-model
calls, the decisions.

The **robot** — a Reachy Mini *Wireless*, which is a Raspberry Pi 5 with a
battery and a radio inside a robot — moves motors, plays audio, and serves
camera frames over Wi-Fi. It holds no keys, no tokens, and no personal data
whatsoever.

The wireless part is not a convenience feature here, it is the reason this split
is possible at all. The tethered version is a peripheral: it needs a computer at
the end of a cable, and the temptation is then to let that computer be the
robot. The wireless one is a host on the network with its own address, so brain
and body can be two machines that agree on a small contract — and one of them
can be the machine holding nothing worth stealing.

Steal the robot and you get motors.

<figure class="diagram">
  <div class="diagram-scroll">
    <img src="/blog/the-architecture/two-hosts.svg"
         alt="Diagram of the trust boundary. The laptop holds the API keys, OAuth tokens, encrypted profiles, face embeddings, conversation history and skills, and runs the orchestrator, conversation, connectors, memory and identity modules on one event bus. The robot — a Reachy Mini Wireless with a Raspberry Pi 5 inside — has motors, a speaker, a microphone array and a camera, and stores nothing: no keys, no tokens, no profiles. Between them a Wi-Fi link carries only move, speak and frame; no secrets cross it."
         width="1000" height="880" loading="lazy" />
  </div>
  <figcaption>The trust boundary and the software boundary are the same line —
  which is the only reason the whole thing also runs with no robot at all.</figcaption>
</figure>

That sentence is the whole security model, and everything downstream falls out
of it. A robot is a physically accessible computer standing in a room other
people walk through, pick up, and occasionally take home to show someone. Any
design that puts credentials on it is a design that has not thought about where
it actually sits.

The pleasant side effect is that the trust boundary and the software boundary
end up in the same place. Because the robot does nothing clever, the interface
between brain and body is a small, explicit network contract — which means the
entire system runs with no robot at all, against a fake.

For the first several months, that was not a convenience. It was the only way
the project existed.

## One process, five modules, one bus

On the laptop, what used to be six services is now one process that mounts five
modules onto a single event bus:

- **orchestrator** — the turn pipeline, the approval gate, personas, the
  developer agent, presentations
- **conversation** — speech-to-text and text-to-speech providers, and the
  realtime speech transport
- **connectors** — mail, calendar, chat, tasks
- **memory** — sessions, reminders, todos
- **identity** — tokens in the OS credential store, persona, mode

They are still separate packages, with separate tests. They are simply not
separate *deployables* any more, because nothing about a desk robot benefits
from them being separate deployables.

That decision has a name I like: the collapse was not about performance, it was
about honesty. Six containers implied an independence that did not exist. One
process with five well-tested modules describes what is actually happening.

## What happens in a single turn

Somebody says something. Here is what that costs.

**Round one** goes to a fast model with a short context: who is talking, a
handful of facts about them, and the message. Most turns end here, and they end
quickly, because someone is standing there waiting for a spoken reply.

**If tools are needed**, round two onwards switches to a stronger model — the
one that will orchestrate actions rather than produce a sentence. Independent
tool calls run concurrently; anything that needs approval serialises, because
approval is a conversation with a human and humans do not parallelise.

**Anything that touches the world stops and asks.** Sending a message, writing a
file, committing, spending money, deleting a person. Every time, unless you have
explicitly told it to stop asking for that one tool — a checkbox that writes
itself into your settings file, which is a decision the interface should make
you feel. And queued actions never fire on reconnect, because approval is not a
token you can bank.

**Then it speaks**, and while it speaks it keeps listening, so you can cut it
off mid-word.

<figure class="diagram">
  <div class="diagram-scroll">
    <img src="/blog/the-architecture/one-turn.svg"
         alt="Flowchart of one conversational turn. Someone speaks; round one runs a fast model with a short context of who is talking plus a few facts. A decision asks whether tools are needed: most turns answer no and go straight to speaking while still listening. If yes, round two onwards uses a stronger model, running independent tools concurrently while anything approval-gated diverts to an approval gate that stops and asks the owner every time."
         width="1000" height="900" loading="lazy" />
  </div>
  <figcaption>Two rounds, one gate. The expensive model is only reached by turns
  that actually need it, and the gate is the only door to the outside world.</figcaption>
</figure>

## The desktop app is a lie, and that is deliberate

What the owner installs is a single desktop application. What it actually
contains is an Electron shell that starts a Python process, serves a Vue console
to itself, and shows you that in a window.

Nobody should have to know that. The entire packaging effort — bundling a Python
runtime, bootstrapping dependencies on first launch, surviving its own updates —
exists so that a person can double-click something and have a robot assistant,
rather than clone a repository and read a setup guide.

That layer cost more evenings than any of the interesting parts, and it is
invisible when it works. Which is the definition of infrastructure.

## Where the data actually is

Four things persist, and it matters which:

| What | Where | Encrypted |
|---|---|---|
| People, facts, observed signals | Laptop | Yes, per-person keys |
| Face embeddings | Laptop | Yes |
| Conversations, todos, reminders | Laptop | No — no biometrics involved |
| Skills | Laptop, plain markdown | No — they are your procedures |
| Anything at all | Robot | Nothing is stored |

Everything lives in the per-user application data directory rather than beside
the program, which sounds like a triviality and is not: an installer replaces
the program directory, and I learned that the expensive way.

## Degrade, never freeze

Every dependency has a defined behaviour for "not answering", and none of them
is "block".

Robot offline → the assistant keeps working, text only, and says so. Internet
gone → a local model takes over, and if that is missing, a small set of
regex-handled commands survives. Laptop unreachable entirely → the robot runs
its own tiny behaviour loop so it stays polite instead of becoming an ornament.

Each of those is worse than the full system and dramatically better than a hang,
because a degraded system tells you something and a frozen one tells you
nothing.

## What I would keep, and what I would not

**Keep:** the two-machine split, decided before any code. It determined the
architecture, not just the security posture.

**Keep:** building against a fake first. It forces the boundary between brain
and body to be a contract instead of whatever the vendor SDK happened to expose.

**Would not repeat:** six services. I built the shape I had read about rather
than the shape the problem had. Collapsing it was a week of work that a
half-hour of honesty would have saved.

**Still unresolved:** the desktop app carries a Python runtime around like a
rucksack. It works. It is not elegant, and every update has to move it.

---

*Next: the box arrives. What it is like to assemble a Reachy Mini, and why an
hour with a screwdriver paid off weeks later.*
