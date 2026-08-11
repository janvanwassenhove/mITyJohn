---
title: "AURA 10 · Looking for a robot that was there the whole time"
date: 2026-10-04
tags: ["hardware", "networking", "robotics"]
cover: "/blog/looking-for-a-robot-that-was-there-the-whole-time/cover.webp"
cardTag: "Hardware · Networking"
draft: true
---

I swept the entire subnet. Two hundred and fifty-four addresses. Nine devices
answered. None of them was the robot, and nothing anywhere was listening on port
8001.

I reported this with the quiet authority of a man holding evidence.

The robot was, at that moment, sitting three metres away, powered on, listening
on port 8001, waiting to be asked anything at all.

Both of my tools had answered honestly. I had asked them the wrong questions.

## How it started: a name that stopped resolving

The robot lived at `reachy-mini.local`. mDNS, zero configuration, no thought
required — until one day it required rather a lot, and the app said:

> **Robot: offline**

Which was true and useless. "Offline" is a conclusion, not an observation, and
the software knew considerably more than it was letting on. It knew that a
*name* had failed to resolve — which is a different problem from a machine being
powered off, which is different again from a machine that is up and refusing
connections. Three distinct situations, one shrug.

So the first fix was to make the error say what actually happened:

> the name 'reachy-mini.local:8001' could not be resolved — set
> ROBOT_RUNTIME_URL to the robot's IP address

Better. And it immediately exposed the next problem.

## Advice with nowhere to act on it

That message tells the owner to set an environment variable. The environment
variable lived in a configuration file, inside the application's data directory,
which is to say: in a folder nobody has ever opened on purpose.

So the instruction amounted to *find a hidden directory, open a file you have
never heard of, edit a line, save it, restart everything.*

That is not advice. That is a locked door with a helpful sign on it.

Telling someone to do a thing there is no button for is worse than saying
nothing, because it converts "this is broken" into "this is broken and
apparently that is your fault for not knowing".

So: a field for the robot's address, placed **inside the error box itself** —
not in a settings screen, because nobody opens settings when something has just
broken. Pre-filled with the current address. Applied immediately, no restart, so
trying one costs nothing. And it tests the address and reports back honestly,
because *saved* and *reachable* are different words and only one of them is
interesting.

Small details that turned out to matter: people type an address without the
scheme, so the missing `http://` is added rather than rejected. People paste a
path, which silently breaks every route built on top of it, so a path is refused
with an explanation.

## And then the real problem

The owner's next message was six words:

> Still not working, restarted robot as well.

I had given them a field to type the robot's address into, and then left them to
find that address themselves. On a home network that means a router admin page
or a port scanner.

**You cannot type in an address you do not know.**

The brain sits on the same network. It can simply go and look. Which is what it
does now — and the reason this post exists is what happened when I tried to do
the looking myself first.

## Two tools, one assumption, zero robots

Before writing the scanner I diagnosed by hand, with the two things everyone
reaches for.

**A ping sweep.** Nothing that looked like a Pi.

**The ARP table.** Nine devices, none with a matching hardware address.

Conclusion: the robot is not on this network. I said so out loud. I even had a
supporting theory — the laptop was on Ethernet, the Reachy on wifi, perhaps some
segmentation was involved. It was a good theory. It explained everything except
reality.

Here is what I had actually asked:

**Ping asks: "will you answer ICMP?"** A Raspberry Pi is under no obligation to.
Firewall rules, power settings, or plain configuration can leave a perfectly
healthy device silent. A ping sweep does not enumerate the devices on a network.
It enumerates the devices that feel like answering pings.

**ARP asks: "who have I spoken to recently?"** It is a cache, not a census. A
device I had not addressed since the name stopped resolving would not be in it —
and the name failing to resolve is precisely what had stopped me addressing it.

So my two independent confirmations were not independent at all. They were two
ways of failing to notice a machine that was sitting there the entire time, up,
listening, unbothered.

A plain TCP connect sweep — *"will anything accept a connection on 8001?"* —
found it immediately. That question had an unambiguous answer, and the answer
was yes.

## Making the scan fast enough to be a button

The first working version built an HTTP client per address and asked each one
for `/health`. Correct, thorough, and it took about **48 seconds** for a /24.

Which is unusable — not because 48 seconds is objectively long, but because of
*when* it happens. Someone is staring at an error, having already restarted the
robot, wondering whether the software is broken. Forty-eight seconds of nothing
is where they close the app and go and do something else with their evening.

The fix is a two-pass scan:

1. **A bare TCP connect to every host.** Almost every address on a home network
   settles in milliseconds — something accepts, or the connection is refused
   immediately. Only genuinely absent addresses cost you the timeout.
2. **Ask `/health` only of the handful that answered.** Building an HTTP client
   is the expensive part; doing it 254 times to find one device is the actual
   cost.

Bounded on purpose: own subnet only, one second per host, 64 at a time. A few
seconds, not a background service, and never beyond the owner's own network.

**48 s → about 1.4 s.** Same information. The difference between a background
job and a button someone presses while glaring at an error message.

It found the robot on the first run, at a perfectly ordinary address on the
network I had publicly declared empty.

## What I keep from this

**Know what your tool actually asks.** "No response to ping" is not "not
present". "Not in ARP" is not "not present". Both are answers to narrower
questions than the one in your head, and the gap between them is exactly where
confident wrong diagnoses live.

**Two failing tools are not corroboration if they share an assumption.** Mine
both required the device to volunteer something. A connect attempt does not ask
the device to volunteer anything; it asks the kernel.

**Latency is contextual.** Forty-eight seconds is fine for a nightly job and
fatal in an error dialog. How long an operation may take is a property of the
moment it happens in, not of the operation.

**Never make someone supply information you could go and fetch.** That is the
one that travels furthest. Every time software asks a person for a value it
could determine itself, somebody ends up on a router admin page at half past
ten at night. For a while that somebody was me, on my own software, and I still
had to look it up.

---

*Next: what "encrypted at rest" should actually buy you, and why deleting a
person here destroys a key rather than a row.*
