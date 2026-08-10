---
title: "AURA 10 · Looking for a robot that was there the whole time"
date: 2026-10-04
tags: ["hardware", "networking", "robotics"]
cover: "/blog/looking-for-a-robot-that-was-there-the-whole-time/cover.webp"
cardTag: "Hardware · Networking"
draft: true
---

I swept the entire subnet. 254 addresses. Nine devices answered. Not one of
them was the robot, and nothing anywhere was listening on port 8001.

I reported this with confidence. It was wrong, and it was wrong in a way worth
writing down, because both of my tools had answered honestly. I had asked them
the wrong questions.

## How it started: a name that stopped resolving

The robot lived at `reachy-mini.local`. mDNS, zero configuration, delightful —
until one day it did not resolve, and the app said:

> **Robot: offline**

Which was true, and useless. "Offline" is a conclusion, not an observation. The
app knew considerably more than it was saying: it knew that a *name* had failed
to resolve, which is a completely different problem from a machine that is
powered off, which is different again from a machine that is up but refusing
connections.

The first fix was to make the error say what actually happened. Instead of
"offline":

> the name 'reachy-mini.local:8001' could not be resolved — set
> ROBOT_RUNTIME_URL to the robot's IP address

Better. And it exposed the next problem immediately.

## Advice with nowhere to act on it

That message tells the owner to set an environment variable. That variable lived
in a `.env` file inside the application's data directory.

So the instruction was, in effect: *find a hidden folder, open a config file,
edit a line, save it, restart the app.* For a desktop application, that is not
advice. It is a dead end with good grammar.

Telling someone to do something there is no button for is worse than saying
nothing, because it converts "this is broken" into "this is broken and it is
apparently my fault for not knowing how".

So: a field for the robot's address, placed **inside the error box itself** —
not in a settings screen, because nobody opens settings when something has just
broken. Pre-filled with the current address. Applied immediately without a
restart, so trying an address costs nothing. And it tests the address and
reports honestly, because *saved* is not the same as *reachable*, and the second
one is what you actually want to know.

Small details that turned out to matter: people type `192.168.0.42:8001` without
a scheme, so the missing `http://` gets added. People paste a path, which
silently breaks every route built on top of it, so a path is rejected with an
explanation.

## And then the real problem

The owner's next message was short:

> Still not working, restarted robot as well.

I had given them a field to type the robot's address into, and then left them to
find that address themselves. On a home network that means a router admin page
or a port scanner.

**You cannot type in an address you do not know.**

The brain is on the same network. It can simply go and look. So that became the
next unit — and the reason this post exists is what happened when I tried to do
the looking myself first.

## Where I was confidently wrong

Before writing the scanner, I diagnosed by hand. Two standard tools:

**A ping sweep.** Nothing that looked like a Pi.

**The ARP table.** Nine devices, none with a matching MAC.

Conclusion: the robot is not on this network. I said so. I even had a plausible
supporting theory — the laptop was on Ethernet while the Reachy was on wifi, so
perhaps some segmentation was involved.

Both tools were working perfectly. Here is what I had actually asked them:

**Ping asks: "will you answer ICMP?"** A Raspberry Pi does not have to. Firewall
rules, power settings, or simple configuration can leave a perfectly healthy
device silent to ping. A ping sweep does not enumerate devices on a network; it
enumerates devices that choose to answer pings.

**ARP asks: "who have I recently exchanged traffic with?"** It is a cache, not a
census. A device I had not spoken to since the name stopped resolving would not
be in it — and the name failing to resolve is precisely what had stopped me
speaking to it.

So my two independent confirmations were not independent at all. They were two
ways of failing to see a device that was sitting there, up, listening, on port
8001, the whole time.

A plain TCP connect sweep — *"will anything accept a connection on 8001?"* —
found it immediately. That question had an unambiguous answer, and the answer
was yes.

## Making the scan fast enough to be a button

The first working version built an HTTP client per address and asked each one
for `/health`. Correct, and it took about **48 seconds** for a /24.

That is unusable. Not because 48 seconds is objectively long, but because of
*when* it happens: someone is staring at an error message, having already
restarted the robot, wondering if the software is broken. Forty-eight seconds of
nothing is where they close the app.

The fix is a two-pass scan:

1. **A bare TCP connect to every host.** Almost every address on a home network
   settles in milliseconds — either something accepts or the connection is
   refused immediately. Only genuinely absent addresses cost you the timeout.
2. **Ask `/health` only of the handful that answered.** Building an HTTP client
   is expensive; doing it 254 times to find one device is the actual cost.

Bounded on purpose: own /24 only, one second per host, 64 at a time. A few
seconds, not a background service, and never beyond the owner's own subnet.

**48 s → about 1.4 s.** Same information. The difference between a background
job and a button someone presses while staring at an error.

And it found the robot on the first run, at a plain address on the same network I
had declared empty.

## What I keep from this

**Know what your tool actually asks.** "No response to ping" is not "not
present". "Not in ARP" is not "not present". Both are answers to narrower
questions than the one in your head, and the gap between them is where confident
wrong diagnoses live.

**Two failing tools are not corroboration if they share an assumption.** Mine
both depended on the device volunteering something. A connect attempt does not
ask the device to volunteer anything; it asks the kernel.

**Latency is contextual.** 48 seconds is fine for a nightly job and fatal for an
error dialog. The acceptable duration of an operation is a property of the
moment it happens in, not of the operation.

**Never make the owner supply information you could go and get.** That is the
one that generalises furthest. Every time a piece of software asks a person for
a value it could determine itself, someone is going to open a router admin page
at half past ten at night. There was a stretch of this project where that person
was me, on my own software, and I still had to look it up.

---

*Next: sound. Why the robot was inaudible, why loudness consistency beats peak
loudness, and the acoustic problem I have not solved.*
