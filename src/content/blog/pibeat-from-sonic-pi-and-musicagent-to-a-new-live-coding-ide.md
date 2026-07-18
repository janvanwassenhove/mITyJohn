---
title: "PiBeat: From Sonic Pi and MusicAgent to a New Live-Coding IDE"
date: 2026-04-21T22:01:00
updated: 2026-05-31T20:28:36
tags: ["generative-ai", "music", "sonicpi", "ai", "development", "fun"]
cover: "/wp-content/uploads/2026/03/ChatGPT-Image-21-mrt-2026-22_58_21.png"
cardTag: "GenAI · Music"
wpId: 852
wpSlug: "pibeat-from-sonic-pi-and-musicagent-to-a-new-live-coding-ide"
---

I did not set out to build PiBeat in one clean, cinematic act of product vision.

It arrived the way many projects arrive: sideways.

First there was the long-standing admiration for Sonic Pi. Not just the language, but the original IDE itself. The whole idea that code could be a musical instrument instead of an administrative burden. That timing could be typed. That structure could groove. That a programming environment could feel playful without becoming silly.

Then, a couple of years ago, there was MusicAgent.

MusicAgent was my earlier experiment in AI-assisted music creation: a multi-agent system that could help generate songs, lyrics, and album-cover ideas around a Sonic Pi-centered workflow. It was a strange and fascinating machine. Sometimes clever. Sometimes gloriously overconfident. Occasionally one good prompt away from sounding like it had developed artistic ambition and a minor caffeine problem.

And somewhere inside that experiment, a more stubborn idea started tapping on the glass.

The assistant was interesting. The instrument was the real story.

![](/wp-content/uploads/2026/03/image-3-1024x683.png)

So this is the first release of PiBeat.

PiBeat is a desktop live-coding music environment built with Tauri, Rust, React, TypeScript, and a workflow deeply inspired by the original Sonic Pi and its IDE. You write code. You run it. The machine answers with rhythm instead of a stack trace. On good days, it even answers with style.

![](/wp-content/uploads/2026/05/1-1024x512.png)

That last part is not guaranteed, of course. Software can provide a synth. It cannot provide taste. We remain tragically responsible for that ourselves.

## When the side quest became the main quest

Because once MusicAgent existed, I could no longer avoid the more awkward question.

If I cared this much about AI helping with music creation, did I care enough about the music-coding environment itself?

The answer, inconveniently, was yes.

And that answer came with technical burdens attached to it like unpaid luggage.

Because now the problem was no longer just “can an agent help compose music code?”

Now the problem was all of this at once:

-   can the editor feel good enough to invite experimentation
-   can the runtime respond quickly enough to protect the creative loop
-   can the syntax stay close to the Sonic Pi spirit without becoming a shallow imitation
-   can AI be useful without becoming unbearable
-   can the whole thing feel like a real instrument instead of a demo with very confident screenshots

That was the moment PiBeat became inevitable.

Because code-based music tools often arrive with one of two personalities.

The first is brilliant but frozen in amber: powerful, beloved, and full of ideas, but not necessarily shaped like a tool you would design from scratch today.

The second is shiny but shallow: a polished interface wrapped around very little actual musical leverage.

I wanted a third option.

Something that keeps the immediacy and delight of live coding, but feels like a modern desktop instrument. Something that treats music code as a serious creative medium without making the whole experience feel like a museum tour through educational software, nor like a startup pitch deck that accidentally swallowed a drum machine.

## What the machine actually does

At its core, PiBeat is a place to write music as code and hear the result immediately.

That sentence sounds neat and tidy. Building it was not.

![](/wp-content/uploads/2026/03/image-2-1024x658.png)

The first release includes:

-   a live code editor built on Monaco
-   Sonic Pi-inspired syntax for fast musical ideas
-   real-time code execution with immediate audio feedback
-   multiple buffers for organizing sections
-   waveform visualization and timeline-oriented feedback
-   built-in samples, synths, scales, chords, and pattern tools
-   effects controls for shaping sound while you work
-   an AI assistant that can help generate or reshape musical code

The important bit is not the checklist.

The important bit is the workflow.

PiBeat is built around that wonderful moment where an idea is still half-formed, your timing is questionable, your harmony is optimistic, and yet within a few lines of code something starts moving. A kick lands. A pad opens up. A bassline begins to behave suspiciously like intention.

That is where this tool wants to live.

## Where the pleasant idea meets physics

PiBeat is built as a Tauri desktop application, with a React and TypeScript frontend and a Rust backend handling the real-time music side of the job.

That architecture matters.

It means the interface can feel like a modern code tool while still honoring what made the Sonic Pi IDE compelling in the first place: immediacy, readability, and the sense that music and code belong in the same room. At the same time, the performance-critical work stays close to the metal where it belongs.

That decision was not aesthetic. It was survival.

Creative tools are merciless about latency, awkward feedback, and brittle behavior. If a business app is clumsy, people grumble. If a music tool is clumsy, the idea evaporates before you can hear it.

So the technical burden here was always deeply personal too. The editor could not feel incidental. The parser could not feel ornamental. The playback engine could not behave like it had a meeting scheduled before every kick drum.

The result is a setup that gives me room to experiment with music language support, playback behavior, effects, visualization, and agent-assisted composition without turning the whole application into a ceremonial bonfire of latency.

The editor uses a custom language definition for the Sonic Pi-style syntax, which means the code experience is part of the product rather than a text box that happened to be nearby.

The AI side is also treated as a tool, not a mascot.

PiBeat can work with models from OpenAI and Anthropic, plus a local fallback path, to help generate ideas, reshape patterns, or push a half-finished loop somewhere more interesting. That part is not accidental either. It is a direct descendant of what I was exploring earlier in MusicAgent. The goal is still not to replace the person making the music. The goal is to reduce the distance between “I have a vague idea” and “that actually sounds like a track now.”

That distinction matters. There is enough AI theater in the world already. We do not need a trumpet section every time autocomplete learns to clap on beat three.

## Why this is more than a polite little demo

Three things.

### 1\. It keeps the fun loop intact

Live coding is not just “music production with extra brackets.” It has its own rhythm, its own speed, and its own kind of play. You are not just arranging clips. You are conversing with time.

PiBeat is designed to keep that loop tight.

Write a phrase. Run it. Hear it. Change it. Break it. Fix it. Accidentally make something better than the original idea. That cycle is the whole point.

### 2\. It modernizes without sanding off the oddness

This was important to me.

The charm of code-driven music is that it is slightly improbable. It feels a bit like persuading mathematics to go clubbing. If you polish that too much, you lose something essential.

So the goal was never to make PiBeat behave like a conventional DAW wearing fake glasses. The goal was to build a better instrument for people who like composing with patterns, timing, functions, samples, synths, and a little bit of controlled mischief.

That also means being honest about the reference point. Sonic Pi matters here. Its original IDE matters here. PiBeat is not pretending those ideas did not exist. It is starting from respect, then asking what a fresh implementation can become if you rebuild the experience with a different stack, a different interface ambition, and lessons learned from projects like MusicAgent.

### 3\. It starts with floorboards, not fireworks

First releases are interesting because they are honest.

They show the shape of the idea before years of layering, compromise, and feature archaeology. This version already supports a substantial amount of musical workflow, but more importantly, it establishes the direction: serious desktop engineering, expressive music coding, richer parity with the Sonic Pi world, and room for increasingly capable creative assistance.

In other words, this is not “the complete answer.”

This is the opening chord.

## Who this strange little instrument is for

PiBeat is for people who like music tools with some intellect in them.

If you enjoy writing patterns instead of dragging them, if you think rhythm engines and synth parameters are legitimate forms of play, if you like the idea of a desktop app that treats coding as a musical interface rather than a punishment, then PiBeat is aimed directly at your particular flavor of curiosity.

It is also for developers who secretly wanted their editor to do something more fun than compile.

And for the record, yes, traditional musicians are welcome too. No one is required to arrive wearing a Rust hoodie and an opinion about Euclidean rhythm generation.

## What the build taught me, repeatedly

The big lesson is that creative software lives or dies on feedback loops.

Not feature count. Not screenshots. Not how many times you can say “AI-powered” before a grown adult sighs and closes the tab.

Feedback loops.

When you are making music with code, every extra bit of friction becomes audible. Every awkward control flow leaks into the creative process. Every delay between intent and sound is not just a technical issue. It is a broken thought.

Building PiBeat sharpened that lesson over and over again.

The parser matters because syntax flow matters. The runtime matters because timing matters. The editor matters because creative confidence starts with not fighting the interface. The agent matters only insofar as it helps you keep moving.

That is probably the most personal part of this whole release. I did not want to make a clever prototype about musical possibility. I wanted to make a tool that earns a place in the moment where someone is trying to turn a vague pulse in their head into an actual piece of sound.

Everything else is decoration.

## What happens after the opening chord

The first release is exactly that: first.

There is more to do around parity with the original Sonic Pi experience, deeper musical behavior, more refinement in sound design, broader workflow support, and continued tightening of the experience between typing an idea and hearing something convincing come back at you.

But a first release should not pretend to be the end of the story.

It should do something better.

It should make the case that the story is worth continuing.

That is what PiBeat is for me right now: a serious little machine for turning code into music, structure into movement, and technical curiosity into something you can actually hear.

Which, if we are being honest, is a far more satisfying outcome than most software manages.

If PiBeat succeeds, it will not be because it copied an old tool or imitated a fashionable one. It will be because it took what was powerful about Sonic Pi, what was provocative about MusicAgent, and turned both of those lines of thought into a live-coding IDE that feels immediate, expressive, and current again.

That seems like a good first beat.

[PiBeat on GitHub](https://github.com/janvanwassenhove/PiBeat)  
[PiBeat @ mITyJohn](/apps/pibeat/)

![](/wp-content/uploads/2026/03/image-4-1024x683.png)
