---
title: "AURA 02 · The architecture, and the day I deleted five services"
date: 2026-08-12
tags: ["ai", "development", "architecture", "robotics"]
cover: "/blog/the-architecture/cover.webp"
cardTag: "AI · Architecture"
draft: false
---

I built this as six microservices in Docker. Six services in the compose file,
six health checks, a Dockerfile each — seven containers once you count the
console — and a network hop between all of them.

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

The **robot** — a [Reachy Mini *Wireless*](https://pollen-robotics.com/reachy-mini/),
which is a Raspberry Pi 5 with a battery and a radio inside a robot — moves motors, plays audio, and serves
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

## The wiring, concretely

Boxes and arrows are cheap. Here is what actually listens on what.

On the laptop there are two processes and they are both on loopback. The
**brain** is a FastAPI application on `127.0.0.1:8020`. The **console** is a
Vue app served as static files on a second local port. The desktop shell
starts both and picks the ports at launch, because the alternative — a fixed
port — is a promise you cannot keep on a machine that also runs other people's
software. I found that out the way everyone does.

The console talks to exactly one address: the brain. It never talks to the
robot, not even for video. Two channels: ordinary REST for anything you ask
for, and a single WebSocket at `/ws/events` for everything you did not ask
for — a face recognised, a motion started, an approval waiting, the robot going
offline. Anything that changes state anywhere arrives on that socket, which is
why the interface can be a dumb reflection of the system rather than a thing
that polls and guesses.

Between laptop and robot there is one Wi-Fi link, it carries plain HTTP, and it
runs in one direction. The laptop calls the robot. The robot never calls the
laptop — it has no address to call, no key to authenticate with, and nothing to
say that is not the answer to a question. That is not an optimisation, it is
the trust boundary showing up again as a network property.

<figure class="diagram">
  <div class="diagram-scroll">
    <img src="/blog/the-architecture/wiring.svg"
         alt="Diagram of the wiring. On the laptop an Electron desktop shell contains the Vue console and the aura-brain process; the console talks to the brain over HTTP REST and one WebSocket at /ws/events, and the brain listens on 127.0.0.1 port 8020. Both ports are chosen at launch and nothing binds a public interface. One Wi-Fi link carries HTTP in one direction only — move, speak, listen and frame — down to the robot, which runs robot-runtime on port 8001 with motors, a speaker and microphone array and a camera, holds no keys and stores nothing, and falls back to an on-device loop when no command arrives for fifteen seconds."
         width="1000" height="1000" loading="lazy" />
  </div>
  <figcaption>Everything on the laptop is loopback; the only link that leaves the
  machine carries move, speak, listen and frame. The arrows point one way on
  purpose.</figcaption>
</figure>

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

## Eyes and ears, which is where the architecture gets opinions

A turn diagram is tidy. Audio and video are where the design stops being tidy,
because both of them are continuous, both cross the Wi-Fi link, and neither
forgives you for being a tenth of a second late.

The rule for all three paths is the same: **the robot carries the transducers,
the laptop does the thinking.** No model runs on the Pi. No key reaches it.
What crosses the link is pixels one way and audio the other.

**What it sees.** The camera makes one JPEG when asked, downscaled on the Pi
before it goes anywhere. The obvious design is the opposite — an MJPEG stream,
frames pushed continuously — and it is the design I shipped first. It has a
subtle failure: TCP does not drop a late frame, it delays it, so on a link
slower than the producer a queue forms and never drains. Measured, the picture
fell from 0.6 s to 2.5 s behind and stayed there. Pulling one frame at a time
means there is never more than one in flight, so no queue can form: 0.22–0.28 s,
flat. Fewer frames, but each one is *now*, and for a robot that turns its head
towards you, "now" is the entire product.

The brain proxies every frame — that is why the console needs only one address —
and caches the encode for 80 ms, so the video panel and the face recogniser
looking at the same moment cost one grab rather than two. Face matching happens
on the laptop, on the encrypted embeddings, which is the only place it is
allowed to happen.

**What it hears.** The microphone array records 16 kHz mono and returns the raw
peak level alongside the audio, so a silent window can be thrown away before
anything is transcribed — the cheapest possible way to not pay for silence. In a
live conversation that fixed window is replaced by a chunked stream and the
endpointing moves to the model's own voice-activity detection.

The wake word is worth a sentence of its own, because it is not what people
expect. There is no keyword spotter on the device. The audio is transcribed and
the wake word is matched **in the text**, on the laptop. That costs more than an
on-device detector, and it buys the thing that mattered: the robot has no notion
of what it is listening for, so changing its name is a setting rather than a
firmware.

**What it says.** Speech synthesis happens on the laptop, cloud or local, and
the result goes to the robot as raw PCM. The robot plays it. It does not know
what was said, it cannot produce speech on its own, and it holds no credential
that would let it try. During a live session the reply arrives in segments and
each one is played as it lands rather than buffering the whole sentence, which
is the difference between a reply that starts when you stop talking and one that
starts a beat later.

<figure class="diagram">
  <div class="diagram-scroll">
    <img src="/blog/the-architecture/media.svg"
         alt="Diagram of the three media paths. What it sees: the camera makes one JPEG at request time, downscaled on the Pi, fetched over GET /camera/frame.jpg with never more than one frame in flight; the brain proxies it and caches for eighty milliseconds so two viewers cost one grab. Pull rather than push, because the MJPEG stream drifted to 2.5 seconds behind while this holds 0.22 to 0.28 seconds, flat. What it hears: the microphone array sends 16 kHz mono plus the raw peak level over POST /robot/listen or a chunked stream; speech-to-text runs on the laptop, in the cloud or with Whisper locally, and silence is dropped before anything is transcribed. What it says: text-to-speech runs on the laptop, cloud or Kokoro and Piper offline, and PCM at 24 kHz is posted to the robot, which plays it and does nothing else with it."
         width="1000" height="880" loading="lazy" />
  </div>
  <figcaption>Three paths across one link. The measured numbers are the reason
  the middle column looks the way it does rather than the way it should.</figcaption>
</figure>

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

Every dependency has a defined behaviour for "not answering", and not one of
them is "wait".

Something has to notice first. A heartbeat pings each backend every thirty
seconds; three consecutive failures drop the system into a degraded mode, thirty
seconds of clean beats bring it back, and a full day stuck down there is treated
as maintenance rather than a blip. Deliberately dull numbers — the point of the
detector is that it never argues.

Then there is a ladder, and each rung is strictly worse than the one above it.

**No robot.** Everything else carries on, text only, and the interface says so.
This is the rung the whole project lived on for months.

**No internet.** A local OpenAI-compatible server answers instead — Ollama,
llama.cpp, whatever is on the machine. Same shape of reply, no tools, because
tools are exactly the part that needed the internet.

**No model at all.** Six pattern-matched commands survive: the time, a timer, a
reminder, a status check, and two honest refusals for mail and calendar. That is
not an assistant. It is a device that still answers when you speak to it, which
on a shelf in a kitchen is worth more than it sounds.

**No laptop.** Now the robot is alone, and this is the only rung that runs on
the robot's side of the link. Every command from the brain refreshes a
timestamp; if fifteen seconds pass with none, the robot concludes the brain is
gone, says so out loud exactly once, and falls into an idle motion loop. No
network, no model, no cleverness. It stays a thing that is present in the room
instead of becoming an ornament.

<figure class="diagram">
  <div class="diagram-scroll">
    <img src="/blog/the-architecture/degrade.svg"
         alt="Diagram of the degradation ladder. A heartbeat pings every backend every thirty seconds; three consecutive failures mean degraded, thirty seconds clean means online again. Rung one, no robot: everything else keeps working, text only, and it tells you so. Rung two, no internet: a local model answers instead, same shape of reply but no tools. Rung three, no model at all: six patterns survive — time, timer, reminder, status, and two refusals. Rung four, no laptop: after fifteen seconds of silence the robot says so once and keeps moving. Not one of these is to wait."
         width="1000" height="860" loading="lazy" />
  </div>
  <figcaption>Four rungs, each worse than the last, none of them a hang. A
  degraded system tells you something; a frozen one tells you nothing.</figcaption>
</figure>

## What you actually install

One desktop application, one double-click. Inside it: an Electron shell, a
bundled Python runtime, the brain, and the console as static files. The shell
starts the Python process, serves the console to itself on a local port, and
puts that in a window with a native menu.

I want to be plain about why that shape, because it is the least fashionable
part of the system and it is the part that decides whether anyone else ever
runs it. The alternative is a repository, a package manager, a virtual
environment and a setup guide — which is a fine way to ship something to people
who are already like you, and no way at all to ship something to the household
it is meant to live in.

Three things that layer has to survive, none of which are interesting until they
fail:

**Its own updates.** An installer replaces the program directory. Everything
that must outlive that — profiles, keys, conversations, skills — lives in the
per-user application data directory instead, which is a triviality right up
until the first release that wipes somebody's data. Ask me how I know.

**A machine that is already busy.** Fixed ports are a promise you cannot keep;
another project of mine was on the same one, and the app cheerfully showed me
that project instead. Both ports are now chosen at launch.

**Its own file list.** The packaged build ships an explicit allowlist of files,
and a release once went out with one module missing from it — the app installed
perfectly and crashed on start. There is now a test that unpacks the built
archive and checks that every module the shell requires is actually inside it.

It is unglamorous, it took more evenings than the interesting parts, and it is
completely invisible when it works. Which is the definition of infrastructure,
and roughly the definition of this whole layer of the project.

## What I would keep, and what I would not

Three of these were decisions. One of them is still a wart.

**Keep: the two-machine split.** Decided before there was any code, and it turned
out to determine the architecture rather than merely the security posture.
Because the robot holds nothing, the interface to it had to be small and
explicit; because the interface is small and explicit, the whole system runs
without a robot; because it runs without a robot, most of it was built before
one existed. That is one decision paying out three times.

**Keep: building against a fake first.** Not a mock in a test — a fake robot
speaking the same network contract, good enough to develop against for months.
It forces the boundary between brain and body to be a contract you designed
rather than whatever surface the vendor SDK happened to expose. When the real
hardware arrived, everything it broke was informative, because the shape of the
thing did not have to change.

**Keep: measuring the paths that have a face attached.** Every number in the
media section above exists because something looked wrong in the room, not
because a dashboard was red. A robot is an unusually honest test harness.

**Would not repeat: six services.** I built the shape I had read about rather
than the shape the problem had. The tell was there from the beginning — the
event bus I was proud of was in-process per container, so nothing was actually
subscribing to anything across a boundary. Collapsing it was a week of work that
half an hour of honesty would have saved.

**Still unresolved: the Python runtime.** The desktop app carries one around
like a rucksack, and every update has to move the whole thing. It works, it is
not elegant, and I do not yet have a version of this that is both.

---

*Next: the box arrives. What it is like to assemble a Reachy Mini, and why an
hour with a screwdriver paid off weeks later.*
