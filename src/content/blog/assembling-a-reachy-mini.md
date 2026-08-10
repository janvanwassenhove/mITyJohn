---
title: "Assembling a Reachy Mini"
date: 2026-08-23
tags: ["robotics", "hardware", "raspberry-pi"]
cover: "/blog/assembling-a-reachy-mini/cover.webp"
cardTag: "Robotics · Hardware"
draft: true
---

A box arrived containing a robot in pieces. This is what it was like to put it
together, and what I thought about while doing it.

There is a second post after this one about getting the assembled thing to
actually *do* something, which turned out to be a completely different kind of
work. This one is just the build.

## What a Reachy Mini is

A Raspberry Pi 5 with motors, a camera, a microphone array and a speaker, in a
body designed to be expressive rather than industrial. Roughly the size of a
desk plant. It has a head that moves with real degrees of freedom, two small
antennae that turn out to carry a surprising amount of personality, and a face
that is mostly camera.

[Pollen Robotics](https://pollen-robotics.com/reachy-mini/) ship it as an open
platform rather than a finished product, and that distinction is the whole
reason I bought one.

A product decides what you may do with it. You get an app, a cloud account, and
a set of behaviours somebody else chose. A platform hands you a Pi with an SSH
port and gets out of the way. Nothing is finished for you, and nothing is closed
to you either.

If what you want is a robot that runs *your* software — where the intelligence,
the data and the decisions are yours — that is the trade you are looking for.
It is also, I should say, the more expensive trade in evenings.

## The build

<figure>
  <img src="/blog/assembling-a-reachy-mini/1-unboxing.webp"
       alt="The opened shipping box: nested cardboard compartments printed with line drawings of the robot, beside a Getting Started booklet."
       width="1200" height="1200" loading="lazy" />
  <figcaption>Nested compartments, each printed with the part it holds. The packaging is the first half of the instructions.</figcaption>
</figure>

The assembly is genuinely pleasant. Pollen's
[assembly guide](https://www.youtube.com/watch?v=PC5Yx950nMY) is clear and
paced for someone doing it for the first time, and I have nothing to add to the
instructions themselves — follow them, they work.

What I did not expect was how much the process tells you about the machine.

You handle every part before it becomes invisible. You see where the camera sits
relative to the microphones, which matters enormously later when the thing
starts hearing its own voice. You see how the head is actually driven, which
explains why some motions feel natural and others do not. You see how little
space there is around the speaker.

Weeks later, debugging why speech sounded wrong in a room, I had a mental model
of the physical object to think with. That model came from an hour with a screwdriver,
and I do not think I would have got it from a datasheet.

<figure>
  <img src="/blog/assembling-a-reachy-mini/2-base.webp"
       alt="The open base: a blue battery pack, the power board and the cable runs laid out inside the circular chassis."
       width="1200" height="1200" loading="lazy" />
  <figcaption>The base first: battery, power board, and the cable runs that have to survive a head turning above them.</figcaption>
</figure>

<figure>
  <img src="/blog/assembling-a-reachy-mini/3-platform.webp"
       alt="The head platform lifted out of the base shell on six polished steel linkages."
       width="1200" height="1200" loading="lazy" />
  <figcaption>Then the platform rises out of the shell on six linkages.</figcaption>
</figure>

That is the part I would have skipped if it had arrived pre-assembled, and
it is the part I referred back to most. The head is not on a pan-tilt
bracket; it sits on a platform driven by six independent linkages.

<figure>
  <img src="/blog/assembling-a-reachy-mini/4-linkages.webp"
       alt="The same platform seen from directly above: six linkages radiating from a central hub, with motor blocks and looms of black cable beneath."
       width="1200" height="1200" loading="lazy" />
  <figcaption>Six linkages, one platform. Which explains, months later, why some motions read as looking and others read as mechanism.</figcaption>
</figure>

## The moment it stops being a kit

There is a specific point in a build like this where the pile of parts becomes
an object. For me it was fitting the head onto the body: before that it was
components, after it was a robot, and nothing had changed except that the shape
was now complete.

<figure>
  <img src="/blog/assembling-a-reachy-mini/5-finished.webp"
       alt="The assembled Reachy Mini: a white rounded body, a head with two dark camera eyes, two coiled wire antennae, and a single power cable running off to the side."
       width="1200" height="1200" loading="lazy" />
  <figcaption>Every part in this photograph passed through my hands an hour earlier. That is the whole difference.</figcaption>
</figure>

That transition matters more than it should for something as pragmatic as
software architecture, and I want to be honest about why.

A robot on your desk is an *object other people react to*. My family walked past
the laptop running this project for weeks without comment. The robot got
reactions on day one — from everyone, unprompted, including people with no
interest whatsoever in what it does.

That changes the standards you hold yourself to. Software that is slow is
annoying. A robot that turns its head a second and a half after you have already
walked past is *broken*, visibly, in front of people. Software that mis-hears you
produces a wrong line of text. A robot that mis-hears you says something wrong
out loud, in a room, while somebody is watching.

I did not anticipate how much that would sharpen my priorities. Latency stopped
being a number in a table. It became the difference between something that feels
alive and something that feels faulty.

## What the box does not tell you

Here is the thing nobody puts on the product page, and it is not a criticism —
it is just the shape of this kind of project.

**The gap between "assembled" and "useful" is where all the work is.** The build
takes an hour. Getting from a correctly assembled robot to one that reliably
does something in your house took considerably longer, and almost none of it was
artificial intelligence.

It was ports and services and network names. It was a daemon that bound its port
and then went quiet. It was audio mixer levels on the Pi that had nothing to do
with my code. It was discovering that the robot's hostname had stopped resolving
and that both of my diagnostic tools were confidently telling me it was not on
the network at all.

That is the next post, and several after it. If you are considering one of
these, budget for that part rather than being surprised by it.

## Would I recommend it

Yes, with one condition: **be honest about which project you are starting.**

If you want a robot that does things out of the box, this is not that, and it
does not claim to be. If you want a physical platform you can put your own
software on — where you decide what it knows, what it says, and where its data
lives — then it is exactly right, and the openness is not a marketing word. It
is an SSH port and a documented API.

I have spent more evenings on this than I planned. I have also learned more
about the gap between "works on my machine" and "works in a room where people
live" than any purely-software project has ever taught me.

---

*Next: getting from an assembled robot to a service that actually runs — the Pi,
the deploy, the daemon that hung twice, and deciding which machine is allowed to
hold the secrets.*
