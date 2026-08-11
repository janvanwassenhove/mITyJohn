---
title: "AURA 04 · From an assembled robot to a running service"
date: 2026-08-27
tags: ["robotics", "hardware", "raspberry-pi", "development"]
cover: "/blog/from-robot-to-running-service/cover.webp"
cardTag: "Robotics · Hardware"
draft: false
---

The robot was built. It powered on, the head moved, the demo behaviours ran.

That is where an unboxing post ends. It is roughly one percent of the way to a
robot that does something useful in a house, and this post is about the other
ninety-nine — which turned out to be ports, services, trust boundaries and a
process that would not die.

## The daemon that bound its port and then went quiet

First boot. The robot came up, the service was listening, and then it stopped
responding.

Not crashed. Not refusing connections. Accepting them and never answering.

I rebooted it. It worked. Fifteen minutes later it did exactly the same thing.

I want to dwell on this, because "fixed by a reboot" is where most write-ups
stop and it is precisely where the useful thinking starts. **A reboot is not a
fix. It is a finding.** It tells you three things:

- The fault is in *accumulated state*, not configuration. Configuration is
  identical after a restart; state is not.
- Something is being exhausted or deadlocked rather than set wrongly. A wrong
  setting fails immediately and consistently.
- Whatever it is takes roughly a quarter of an hour of normal operation to
  reach, which is a real constraint on what it could be.

That is genuine diagnostic narrowing. It is just not a solution, and writing
"fixed by a reboot" in your notes lets you pretend otherwise.

My honest position at the time: the daemon's media path was unreliable, I did
not yet understand why, and I chose to build around it rather than block on it.
That call was right — the project would have stalled for weeks otherwise — but
the same subsystem cost me real time later, and I knew it might.

## Deciding which machine holds the secrets

Before writing a line of robot code I had to answer one question, and it turned
out to be the most consequential decision in the whole project.

**Which machine is allowed to hold anything sensitive?**

The answer: the laptop. All of it. API keys, OAuth tokens, encrypted profiles,
face embeddings, conversation history. The Pi runs a small service that moves
motors, plays audio and serves camera frames, and holds none of it.

The question only exists in this shape because this is the *wireless* Reachy
Mini: the Pi is inside the robot, on the Wi-Fi, with an address of its own. A
tethered robot would have made the question disappear and taken the good answer
with it — when the body is a peripheral of the brain's machine, there is no
boundary to put the secrets on the right side of.

Steal the robot and you get motors.

This sounds like an obvious precaution until you notice how many devices in this
category do the opposite — the camera on the shelf holding the credentials that
reach your cloud account. A robot is a physically accessible computer sitting in
a room other people walk through, occasionally get curious about, and
occasionally pick up. Treating it as untrusted is not paranoia. It is an accurate
description of where it is.

There is a second reason, and it is the one I would lead with if I were
persuading someone: **the trust boundary and the software boundary are the same
line.** Because the robot holds nothing and does nothing clever, the interface
between "brain" and "body" is a small, explicit network API. Which means the
entire system runs without hardware.

There is a fake robot adapter, and for months it was the *only* development
target — not as a discipline I chose, but because the real one was still in a
warehouse somewhere. The entire assistant was built against a stub that moved
no motors and saw nothing.

I would like to claim that as foresight. It was circumstance. But it turned out
to be the right order anyway, and I would now do it deliberately: building
against a fake forces you to define the boundary between brain and body as an
explicit contract, instead of letting it grow into whatever the vendor's SDK
happened to expose. When the real hardware finally arrived, it plugged into a
seam that already existed.

What the hardware then did was tell me which of my assumptions about the
physical world were wrong. There were a lot of them, and the rest of this series
is largely a list.

If your answer to "which machine holds secrets" is "both", you have not decided
yet.

## The deploy, and the process that would not die

Getting the runtime onto the Pi was straightforward once SSH was available:
install `uv`, transfer the repository as a git bundle, install the service under
systemd so it survives a power cut.

Then it started crash-looping. `NRestarts=22` and climbing.

The cause was mundane, and you will hit it: an earlier manual run — started with
`nohup` while testing, forgotten, still alive — was holding port 8001. The
systemd unit started, could not bind, failed, and was restarted. Twenty-two
times. Meanwhile the stale process, stuck in its own initialisation loop, was
politely hammering the daemon's media-release endpoint every ten seconds.

Two cheap lessons:

**Check for the ghost before debugging the service.** The failure mode of "my new
deployment cannot bind" is almost always "my old deployment". The restart
counter is the tell — a configuration error fails identically every time and does
not usually produce a *loop*.

**`nohup` during exploration is a liability.** Anything you start by hand on a
device you are about to automate should die with your session, or you will be
debugging your own past self at an inconvenient moment. I now start exploratory
runs in a way that cannot outlive the terminal.

## Do not build on mDNS alone

The robot lived at `reachy-mini.local`. Zero configuration, works immediately,
genuinely lovely — until one day it did not resolve, and the application
reported:

> **Robot: offline**

Which was true and useless. "Offline" is a conclusion. The software knew rather
more than it was saying: it knew a *name* had failed to resolve, which is a
completely different problem from a machine being powered off, which is different
again from a machine that is up and refusing connections.

That single change of state generated three units of work — making the error say
what actually failed, giving the owner somewhere to act on it, and finally
having the software go and find the robot itself. There is a whole post coming
about that, including the part where my network diagnosis was confidently and
instructively wrong.

The practical advice now, before you need it: **have an address you can set, and
have something that can go looking.** mDNS is excellent when it works and fails
in ways that look exactly like the device being dead.

## What I would tell someone starting today

**Decide the trust boundary before you write code.** It determines your
architecture, not just your security posture.

**Build against a fake first, even if you own the hardware.** I did it because I
had no choice. I would do it again on purpose: it forces the boundary between
brain and body to be an explicit contract rather than whatever the vendor's SDK
happened to expose, and it means a delivery delay costs you nothing.

**Treat "fixed by a reboot" as an open ticket.** Write down what you learned from
the fact that it worked.

**Expect the boring layer to dominate.** Ports, services, hostnames, audio mixer
levels, stale processes. The intelligence is a library call. Making a physical
thing reliably reachable in a house is where the evenings go, and it is the part
nobody writes about because it is not impressive.

It is, however, the part that decides whether you end up with a robot or an
ornament.

---

*Next: the agent loop that built everything on top of this — a backlog, hard
edges, and 226 units.*
