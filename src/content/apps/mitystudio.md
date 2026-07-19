---
name: "mITyStudio"
code: "STUDIO"
tag: "music"
cat: "music"
blurb: "A local-first AI music studio. Describe a song, get a real multitrack project you can shape by hand — and sing it in a voice you trained."
repo: "mITyStudio"
order: 1
isNew: true
wpId: 514
wpSlug: "mitystudio"
---

_A local-first AI music studio. Describe a song, get a real multitrack project you can shape by hand — and hear it sung in a voice you trained yourself._

mITyStudio is a music studio that runs entirely on your own computer. You describe the song you want in plain language; it builds the arrangement, picks instruments from your own sound library, writes the lyrics and sings them. What you get back is not a finished audio file — it’s a full project with tracks, clips and a piano roll, which you then edit like any other DAW.

It is free, open source, and nothing you feed it leaves your machine.

> **Download for Windows** → [Latest release](https://github.com/janvanwassenhove/mITyStudio/releases)   
> **Source code** → [github.com/janvanwassenhove/mITyStudio](https://github.com/janvanwassenhove/mITyStudio)

![](/wp-content/uploads/2026/07/studio-1024x610.webp)

## What it does

**Chat a song into existence.** Type _“create a synthwave track at 105 BPM in A minor with a dreamy pad, punchy drums and a sung chorus about neon rain”_ and you get sections, chords, drums, bass, melody, lyrics and a vocal — using instruments from your library, in the language you’re chatting in.

**Sings in your voice, with consent.** A guided wizard records your voice (consent line, range test, coached exercises with live pitch feedback), then trains a personal model on your own GPU. Vocal tracks sing your lyrics in that voice, in English, Dutch, French or German. Install a singing voicebank and the words come out as properly sung phonemes, with your trained voice supplying the timbre. A voice profile cannot be created without recorded consent from the person being cloned.

**Plays your own sounds.** Drop `.sf2`/`.sf3` SoundFonts and audio samples into a folder and rescan. mITyStudio reads what’s inside each SoundFont and sorts it by category, shows you who made it and under what terms, and tags your samples by what they actually sound like — so a file called `XZ_0231.wav` still turns up when you go looking for a pad.

**Edits like a real DAW.** Split, duplicate, drag and resize clips. Piano roll for melodic parts, step grid and Smart Drums for percussion, playable pads, chord strips and keyboard. Effects per track. A mixer whose faders, mutes and solos take effect while the song is playing. Lyrics with karaoke timing and version history. Undo, redo, keyboard shortcuts.

**Imports what you already have.** MIDI, MusicXML, Guitar Pro — or a photo or PDF of a chord sheet, which it reads and turns into an editable song.

**Exports cleanly.** A WAV or MP3 mixdown, or a portable bundle containing the project, every sound it uses and your AI voices, so the whole thing rebuilds on another machine.

![](/wp-content/uploads/2026/07/onboarding-1024x610.webp)

## What you need

-   **Windows.** The installer bootstraps its own Python runtime and fetches FluidSynth and ffmpeg for you. Installing a new version over an old one updates in place and leaves your projects, sounds and voices untouched.
-   **Your own sounds.** SoundFonts and samples are not bundled — the studio plays your library. The first-start guide walks you through adding them.
-   **A GPU, optionally.** Voice cloning and singing work on CPU, but an NVIDIA card makes training and rendering considerably faster.
-   **An AI provider, optionally.** Chat composition needs an API key (OpenAI, Anthropic, OpenRouter or any compatible endpoint). Everything else — instruments, editing, rendering, singing — works without one.

---

## Where to get it

-   **Windows installer** — [Latest release](https://github.com/janvanwassenhove/mITyStudio/releases)
-   **Source, issues and documentation** — [github.com/janvanwassenhove/mITyStudio](https://github.com/janvanwassenhove/mITyStudio)
-   **The story behind** — [mITyStudio — I can’t (or hardly) play music. So I built something that can.](/blog/mitystudio-i-cant-or-hardly-play-music-so-i-built-something-that-can/)
-   **Background reading** — [SoundFonts: The Unsung Heroes of Virtual Instruments](/blog/soundfonts-the-unsung-heroes-of-virtual-instruments/)

---

## A note on licences

The speech-cloning engine is licensed for non-commercial use. Singing voicebanks come from their creators under their own terms — read them before releasing anything. Voice profiles require recorded consent, including your own.

---

**Completely Serious Disclaimer.** _mITyStudio will not teach you to play the mandolin. Nothing will teach you to play the mandolin except playing the mandolin, which remains the single most annoying fact in this entire field. The speech-cloning engine is licensed for non-commercial use only, and any singing voicebank you install arrives under its creator’s own terms — read them, because “the computer did it” has never once worked as a legal argument. Voice profiles require recorded consent, including your own, which means you must formally give yourself permission to sing. This is less ridiculous than it sounds and considerably less ridiculous than the alternative._
