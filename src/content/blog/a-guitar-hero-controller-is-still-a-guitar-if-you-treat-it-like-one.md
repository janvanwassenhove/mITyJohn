---
title: "A Guitar Hero Controller Is Still a Guitar (If You Treat It Like One)"
date: 2026-01-04T21:29:01
updated: 2026-01-04T21:30:38
tags: ["ai", "development", "electron", "programming", "rust", "fun"]
cover: "/wp-content/uploads/2026/01/ChatGPT-Image-4-jan-2026-22_28_26-768x768.webp"
cardTag: "AI · Development"
wpId: 711
wpSlug: "a-guitar-hero-controller-is-still-a-guitar-if-you-treat-it-like-one"
---

I didn’t set out to build a new music application.  
I wanted to clean my attic.

That plan failed almost immediately.

During the Christmas–New Year holidays, I stumbled upon my old Nintendo Wii. Next to it: a Guitar Hero / Rock Band guitar controller. Plastic body, five colored frets, strum bar, whammy bar. A device that once convinced an entire generation they were playing music.

![](/wp-content/uploads/2026/01/controller-1-768x644.webp)

Out of curiosity, I plugged it in.

![](/wp-content/uploads/2026/01/dongle-768x644.webp)

And the interesting part wasn’t nostalgia. It was that the thing still _made sense_.  
Five buttons. A strum. Timing. Harmony. Expression.

The problem was never the controller.  
The problem was that it had been locked inside a game.

So instead of replaying old songs for high scores, I did what any reasonable person does during holiday downtime: I turned that controller into a real instrument.

That’s how **mITyGuitar** started.

---

## What is mITyGuitar?

**mITyGuitar** is a desktop application that allows you to connect your old Guitar Hero or Rock Band guitar to your PC or laptop and use it as a musical instrument.

![](/wp-content/uploads/2026/01/mITyGuitar-Logo-1-1024x1024.webp)

Not as a game controller.  
Not as a nostalgic toy.  
As an actual way to play music.

You can:

-   play live using chord mappings
-   freely jam in real time
-   load songs and play along
-   follow chord progressions and lyrics
-   learn songs in a gamified, low-friction way

The project is open source and available on GitHub:  
[https://github.com/janvanwassenhove/mITyGuitar](https://github.com/janvanwassenhove/mITyGuitar)

## This is not Guitar Hero (and that’s intentional)

mITyGuitar is not a clone of Guitar Hero or Rock Band.

There’s no score chasing, no star power, no failure screens screaming at you because your timing was slightly off. It doesn’t try to recreate the arcade pressure loop.

Instead, it asks a simpler question:

What if we treated that guitar controller as an instrument instead of a game mechanic?

So:

-   you trigger real chords, not note sequences on rails
-   timing matters, but expression matters more
-   mistakes are part of learning, not something to be punished

It feels familiar, but the goal is fundamentally different.

## Two modes, one idea

![](/wp-content/uploads/2026/01/splashscreen-1-1024x851.webp)

### Live Mode

In Live Mode, the guitar controller becomes exactly what it always wanted to be.

Each fret maps to a chord.  
The strum bar triggers the sound.  
The whammy bar adds expression.  
Tilt is available for additional control.

You choose an instrument, start playing, and just play. No song loaded. No rails. No instructions.

This is usually the point where people who say they “can’t play an instrument” quietly stop saying that.

### Song Mode

Song Mode adds structure without turning music into a reaction test.

You load a song and play along:

-   chord progressions are visualized
-   lyrics are shown
-   timing is guided, not enforced

It borrows the familiarity of Rock Band, but shifts the focus. Instead of “press the right button now”, it becomes “this is the chord, this is the moment — play”.

Gamification, without punishment.  
Guidance, without rigidity.

---

## The uncomfortable technical part (and why AI matters here)

There’s another reason this project exists.

I had never developed a desktop application in **Rust** before.  
I don’t usually work close to hardware input.  
And real-time controller handling is not exactly the most fun or forgiving type of development.

Normally, that combination alone would be enough reason _not_ to start a side project like this. This time, it wasn’t.

Using **GitHub Copilot** and **ChatGPT**, I could move surprisingly fast — even in unfamiliar territory. Handling raw controller input, mapping events, structuring the application: all things that would normally involve a lot of trial, error, and documentation archaeology.

Instead, the workflow became iterative and conversational.

I wasn’t “learning Rust first and then building something”.  
I was building something — and learning Rust along the way.

---

## The models and tools behind the scenes

For this project, I mainly relied on:

-   **GitHub Copilot** for in-editor guidance, refactoring, and pattern discovery
-   **ChatGPT** for architecture, iteration, and problem framing

On the model side, I used:

-   **Claude Sonnet 4 and 4.5** for reasoning-heavy exploration and design discussions
-   **GPT-5.2** for implementation details, refinement, and cross-checking ideas

This combination turned what could have been a frustrating hardware-heavy experiment into something playful and fast.

Not because the hard parts disappeared — but because they became manageable.

---

## Why this matters beyond this project

mITyGuitar isn’t really about a plastic guitar.

It’s about what happens when:

-   unfamiliar languages stop being blockers
-   hardware interaction becomes approachable
-   side projects stop being “too big to start”

AI doesn’t remove complexity.  
It changes who carries it.

And that’s what made this project possible during a couple of holiday weeks instead of a few abandoned weekends.

---

## Retro, but not a museum piece

Yes, this project is rooted in nostalgia.  
Yes, it clearly originates from the late 2000s.

But technically, mITyGuitar is a modern desktop application:

-   real-time input handling
-   flexible chord mapping
-   extensible song format
-   open source by design

This isn’t a tribute project.  
It’s a usable tool.

---

## Final chord

mITyGuitar exists because sometimes creativity doesn’t start with mastery or long-term planning.

Sometimes it starts with unfamiliar technology, a forgotten controller, and the realization that with the right tools, you don’t need to know everything upfront.

You just need to start.

---

Source code

[https://github.com/janvanwassenhove/mITyGuitar](https://github.com/janvanwassenhove/mITyGuitar)
