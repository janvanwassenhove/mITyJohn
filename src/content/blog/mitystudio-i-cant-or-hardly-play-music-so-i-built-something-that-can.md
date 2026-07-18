---
title: "mITyStudio — I can't (or hardly) play music. So I built something that can."
date: 2026-07-12T15:52:20
updated: 2026-07-18T16:51:20
tags: ["ai", "music", "fun"]
cover: "/wp-content/uploads/2026/07/ChatGPT-Image-18-jul-2026-17_54_14-1024x1024.webp"
cardTag: "AI · Music"
wpId: 931
wpSlug: "mitystudio-i-cant-or-hardly-play-music-so-i-built-something-that-can"
---

_A local-first AI music studio. You describe the song, it hands you a real multitrack project you can shape by hand — and it can sing your lyrics in a voice you trained yourself._

I own a couple of guitars and a mandolin. I can play almost none of it.

What I can do is build things. That is the one skill I actually have, and I have it in some quantity. So when the gap between _I have a song in my head_ and _I can play a song_ refused to close — and it has had years to close — I did the thing IT people do instead of practising.

A normal person books lessons. Half an hour a week, a patient teacher, some scales, and within a year they can play something for their friends. I wrote a Python backend, a Vue frontend, wired in four neural networks and implemented a consent audit trail. The mandolin is still in the corner. It is perfectly in tune, because nobody has ever played it.

This is mITyStudio, and I have just rebuilt it from scratch.

![](/wp-content/uploads/2026/07/studio-1-1024x610.webp)

## The point isn’t that a computer makes the music

It would be easy to sell this as _type words, receive song_, because that part is real. Type _“create a synthwave track at 105 BPM in A minor with a dreamy pad, punchy drums and a sung chorus about neon rain”_ and you get a song: sections, chords, drums, bass, melody, lyrics, a sung vocal.

But that is not the interesting bit, and it’s not why I kept going. Here is the actual thing I learned building this, and it’s the part worth stealing:

**For someone who builds, the studio is the instrument.**

I am never going to develop the muscle memory. That ship sailed, waved, and sank. But I can describe precisely what I want, I can hear immediately whether it’s wrong, and I can change it. What I needed wasn’t a machine that hands me a finished MP3 — that’s a slot machine, and you can’t disagree with a slot machine. I needed a machine that hands me something I can _argue with_.

So mITyStudio never gives you a rendering. It gives you a **project**. Real tracks, real clips, a piano roll where you can drag a note that bothers you, a beat grid, a mixer, effects per track. If the chorus is wrong, you fix the chorus. You don’t re-roll and hope.

That distinction is the entire product. Everything below is in service of it.

## The AI proposes, the engine disposes

This is the design decision I’d keep if I threw away everything else.

The language model in mITyStudio never generates audio. It isn’t allowed near the render path. All it does is emit **structured, validated operations** — _add a section, assign this instrument, write these notes, rewrite those lyrics_ — which the backend checks before anything is applied.

The practical effect: it cannot invent a sound that doesn’t exist, cannot reference a sample that isn’t on your disk, and cannot quietly do something you didn’t ask for. When it picks an instrument, it picks one of _yours_, because your library is all it can see. An AI that is structurally incapable of lying about what it did is a better collaborator than one that merely promises not to.

It composes properly, too. Ask for a bass part and you get a playable one instantly; if you’ve connected an AI provider, the model then writes a real line note by note in the background and swaps it in when it’s finished. That takes a couple of minutes for something like ninety-five notes, which is why it happens behind you instead of behind a progress bar.

## It sings — and it can sing in your voice

A guided wizard records your voice. You read a consent line aloud, do a range test, then work through coached exercises with live pitch feedback and a quality check on every take. It trains a personal voice model on your own GPU, in your own house.

After that, vocal tracks sing your lyrics in that voice, in English, Dutch, French or German. You can install a singing voicebank — a model genuinely trained to _sing_ rather than a speech model bent into shape — so the words come out as sung phonemes with proper vowels, with your trained voice supplying the timbre. And if you can carry a tune better than you can play one, sing the take yourself and have it converted; that route sounds the most human, because it started human.

The consent isn’t decoration. A voice profile cannot exist without explicit, recorded permission from the person being cloned, kept as a permanent record. In a field currently running on scraped audio and optimism, asking first is either quaint or the only defensible position. I’ve settled on the second.

## Your sounds, not a subscription’s sounds

mITyStudio doesn’t rent you a curated library. It plays _your_ files: drop `.sf2`/`.sf3` SoundFonts in a folder, drop audio in another, hit rescan.

Then it does the tedious part for you. It reads what’s actually inside every SoundFont and sorts it — 89 piano banks, 26 basses, 12 drum kits — so the library becomes browsable instead of intimidating. It surfaces who made each bank and under what terms, which is information those files have been carrying since the 1990s that almost nothing bothers to show you. And it listens to your samples with an audio model, tagging them by what they sound like rather than what they’re named, so a file called `XZ_0231.wav` still turns up when you go looking for a pad.

## It behaves like a DAW, because eventually you’ll want it to

Clips split, duplicate, drag and resize. Fades per clip. A piano roll for melodic parts, a step grid for drums, a Smart Drums board where you push pieces around until the groove is right, plus pads, chord strips and a keyboard that all audition with the real instrument sound. A mixer whose faders, mutes and solos take effect _while the song is playing_ — which sounds like a low bar until you’ve used software where they don’t.

Lyrics get karaoke timing and version history. Export a WAV or MP3 mixdown, or a portable bundle containing the project, every sound it uses and your AI voices, so the whole thing rebuilds on another machine.

## Everything stays on your machine

Your recordings, your voice models, your projects and your API keys never leave your computer. Rendering, voice cloning, singing and mixing all run locally — on your GPU if you have one, your CPU if you don’t. The only thing that ever leaves is the chat request, and only if you choose to connect a provider at all.

![](/wp-content/uploads/2026/07/ChatGPT-Image-18-jul-2026-18_49_58-1024x576.webp)

It installs like a normal Windows application. A new version installed over an old one updates in place and leaves your workspace alone, because your projects, sounds and voices live outside the install folder where no installer can reach them.

---

## Get it

-   **Download the Windows installer** — [Releases](https://github.com/janvanwassenhove/mITyStudio/releases)
-   **Read the source** — [github.com/janvanwassenhove/mITyStudio](https://github.com/janvanwassenhove/mITyStudio)
-   **Related reading** — [SoundFonts: The Unsung Heroes of Virtual Instruments](/blog/soundfonts-the-unsung-heroes-of-virtual-instruments/)

---

**Completely Serious Disclaimer.** _mITyStudio will not teach you to play the mandolin. Nothing will teach you to play the mandolin except playing the mandolin, which remains the single most annoying fact in this entire field. The speech-cloning engine is licensed for non-commercial use only, and any singing voicebank you install arrives under its creator’s own terms — read them, because “the computer did it” has never once worked as a legal argument. Voice profiles require recorded consent, including your own, which means you must formally give yourself permission to sing. This is less ridiculous than it sounds and considerably less ridiculous than the alternative._
