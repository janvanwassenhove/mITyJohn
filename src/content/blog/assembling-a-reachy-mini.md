---
title: "Assembling a Reachy Mini, and what the box does not tell you"
date: 2026-08-23
tags: ["robotics", "hardware", "raspberry-pi"]
cardTag: "Robotics · Hardware"
draft: true
---

Unboxing posts end with the assembled robot on the desk, everything working,
soft music. This one starts there, because the gap between "the robot arrived"
and "the robot does something useful" is where the real work lives — and almost
none of it is AI.

## What a Reachy Mini actually is

A Raspberry Pi 5 with motors, a camera, a microphone array and a speaker, in a
body designed to be expressive rather than industrial. Pollen Robotics ship it
as an open platform, not a product, and that distinction is the whole reason it
is interesting.

A product decides what you may do with it. A platform hands you a Pi with an SSH
port and gets out of the way. That means nothing is finished for you, and it
also means nothing is closed to you. If you want a robot that runs *your*
software rather than a vendor's assistant, this is the trade you want.

The assembly itself is pleasant and well documented, and I have nothing useful
to add to the instructions. The interesting part started at first boot.

## The daemon that bound its port and then went quiet

The robot came up. The service was listening. And then it stopped responding —
not crashed, not refusing connections, just accepting them and never answering.

I rebooted it. It worked. Fifteen minutes later it did the same thing.

I want to dwell on this, because "fixed by a reboot" is where most write-ups
stop and it is exactly where the useful thinking starts. A reboot is not a fix.
It is a *finding*: it tells you the fault is in accumulated state rather than
configuration, that something is being exhausted or deadlocked rather than
mis-set, and that whatever it is takes roughly a quarter of an hour of normal
operation to reach.

That is a real diagnostic narrowing. It is just not a solution, and writing
"fixed by a reboot" in your notes lets you pretend it was one.

The honest status at that point: the daemon's media path was unreliable, I did
not yet understand why, and I decided to build around it rather than block on
it. Which turned out to matter, because the same subsystem cost me weeks later.

## The split that is actually the security model

Before writing a line of robot code I decided where things would live, and this
turned out to be the most consequential decision in the project.

Everything sensitive stays on the laptop: the API keys, the OAuth tokens, the
encrypted profiles, the face embeddings, the conversation history. The Pi runs a
small service that moves motors, plays audio and serves camera frames. It holds
no keys, no tokens and no personal data.

Steal the robot and you get motors.

This sounds like an obvious precaution until you notice how many devices in this
category do the opposite — the camera on the shelf holding the credentials that
reach your cloud account. A robot is a physically accessible computer in a room
other people walk through. Treating it as untrusted is not paranoia, it is just
where it sits.

It also has a pleasant engineering side effect: the boundary between "laptop
brain" and "robot body" is a network API, so the entire system runs without
hardware. There is a `FakeRobot` adapter, and it is the *primary* development
target. Everything gets built and tested against it, and the real robot is where
you find out which of your assumptions about the physical world were wrong.

## Deploying to the Pi, and the process that would not die

Getting the runtime onto the robot was straightforward once SSH was available:
install `uv`, transfer the repository as a git bundle, install the service under
systemd so it comes back after a power cut.

Then the service started crash-looping. `NRestarts=22` and climbing.

The cause was mundane and worth knowing, because you will hit it: an earlier
manual run — started with `nohup` while I was testing, forgotten, still alive —
was holding port 8001. The systemd unit started, found the port taken, failed,
and got restarted. Twenty-two times. Meanwhile the stale process, in its
initialisation loop, was politely hammering the daemon's media-release endpoint
every ten seconds.

Two lessons, both cheap:

**Check for the ghost before debugging the service.** The failure mode of "your
new deployment cannot bind" is almost always your old deployment. The restart
counter is the tell — a config error fails identically every time and does not
usually produce a *loop*.

**`nohup` during exploration is a liability.** Anything you start by hand on a
device you are about to automate should be started in a way that dies with your
session, or you will be debugging your own past self at an inconvenient moment.

## Then the name stopped resolving

The robot was reachable at `reachy-mini.local` — mDNS, zero configuration,
lovely. Until it was not, at which point the app reported "Robot: offline",
which was true and completely useless.

That single change of state produced three units of work: making the error say
what actually failed, giving the owner somewhere to *act* on that information,
and finally having the software find the robot itself. There is a whole post
coming about that, including the part where my network diagnosis was confidently
and instructively wrong.

For now the practical advice: **do not build on mDNS as your only path to the
device.** It is excellent when it works and it fails in ways that look like the
device being dead. Have an address you can set, and have something that can go
looking.

## What I would tell someone starting today

**Decide the trust boundary before you write code.** Which machine holds
secrets? If the answer is "both", you have not decided.

**Build against a fake first.** Not for purity — for iteration speed and because
it forces you to define the interface between brain and body rather than letting
it grow into whatever the SDK happened to expose.

**Treat "fixed by a reboot" as an open ticket.** Write down what you learned
from the fact that it worked.

**Expect the boring layer to dominate.** Ports, services, network names, audio
mixer levels. The intelligence is a library call. Making a physical thing
reliably reachable in a house is where the evenings go.

None of that is what I expected to be writing about when the box arrived. It is
what actually stood between me and a robot that does something useful, which is
why it is post two rather than a footnote.

---

*Next: the agent loop that built everything on top of this — a backlog, hard
edges, and 226 units. The project is
[on GitHub](https://github.com/janvanwassenhove/aura); the setup guide covers
both the real device and the hardware-free path.*
