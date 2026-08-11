---
title: "AURA 10 · The day the agent started talking to itself"
date: 2026-09-13
tags: ["ai", "development", "agents", "voice"]
cover: "/blog/the-day-the-agent-started-talking-to-itself/cover.webp"
cardTag: "AI · Voice"
draft: true
---

The robot answered a question nobody had asked.

Not a wrong answer to a real question. That is ordinary, that is Tuesday. This
was a complete, polite, faintly corporate answer, delivered at conversational
volume, to an empty room.

Then it did it again.

I would like to report that I responded with the composure of a professional.
What I actually did was stand very still in my own kitchen at half past ten at
night, waiting to see whether it would do it a third time.

It did.

## Nobody was in the room, which narrows things

The first theory is always the microphone. Some noise got in, something got
transcribed, the machine did as it was told. That is roughly right and
completely useless, because it does not explain the *shape* of the thing.

Ambient noise does not produce a conversation. For the assistant to answer,
something had to reach it looking exactly like a request — well formed enough to
survive the wake-word check, the echo guard, and every other piece of defensive
plumbing between the microphone and the model.

Something in my house was being extremely articulate.

## Six reasonable decisions in a row

Here is the chain. I want it in order, because not one link in it is a mistake.

**One.** Whisper accepts a prompt that biases transcription toward expected
vocabulary. I had given it the wake word, "Richie", so it would catch the name
reliably instead of producing "ritchy" or "rich e". This measurably improved
wake-word accuracy. It is standard practice. It worked.

**Two.** With that hint in place, ambiguous audio began resolving to the biased
token. Ambient noise. The fridge. And — this is the one that matters — the
robot's own voice, arriving back through its own microphone. The model had been
told this word was likely. Handed something unclear, it produced the likely
word. Doing precisely what it was configured to do.

**Three.** The echo guard noticed the robot was hearing itself and stripped the
echoed content out, exactly as designed. What remained was the wake word. Alone.

**Four.** Downstream, that surviving transcript was treated as user input. Which
is to say the assistant received, as a command, the single word: *"richie"*.

**Five.** The model answered it. Of course it did. Handed one word and no
content, a language model produces something pleasant and non-committal, which
is roughly what you would do if someone said your name and then stopped.

**Six.** The robot said that answer out loud. Into the room. Where the
microphone was.

Return to step two.

## Everything was working perfectly, which was the problem

I went looking for the broken component, and that is the part worth stealing,
because it cost me an hour.

I checked the microphone gain. Fine. I checked the echo guard's thresholds.
Correct. I checked whether the wake-word detector was firing spuriously — it was
not. It was firing accurately, on input that genuinely contained the wake word,
because the transcriber had helpfully put one there.

Every component passed inspection.

I now treat that as a *positive finding* rather than a dead end. When all the
parts are individually fine, the fault lives in the composition, and the useful
move is to stop testing components and start drawing the path.

The second thing that slowed me down is more embarrassing. I had a pipeline in
my head — audio in, text, model, speech out — and pipelines have ends. This one
did not. The output was physically connected back to the input by the air in the
room, and my mental diagram stopped politely at the loudspeaker.

## Four lines

The fix, once seen:

> A command with fewer than two characters left after the wake word is stripped
> never reaches the language model.

Strip "Richie", and the common mis-hearing "Ritchie" while we are here. If what
remains is empty or near-empty, discard it. *"Richie, play some music"* becomes
*"play some music"* and proceeds. A bare *"richie"* — from noise, from echo, or
from a real person who said the name and then thought better of it — goes
nowhere.

Four lines. Tested in both directions: bare and echoed wake words ignored, real
commands unaffected.

One hour of investigation. Four lines. A certain amount of dignity.

## What it actually taught me

**Draw the loop your outputs close.** Any system whose output re-enters its own
input has a cycle — a speaker near a microphone, an agent that writes files it
later reads, a bot posting into a channel it monitors. Draw it on purpose,
before it introduces itself.

**Gate where the loop closes, not where the symptom appears.** My instinct was
to make the echo guard cleverer, because the echo guard was where the noise came
from. That would have been an arms race against a fridge. The right place was
the boundary where a transcript becomes a *command*, because that is where the
cycle actually closes. Removing echo was the guard's job. Deciding what counts
as a request was never its responsibility.

**Beware the well-intentioned bias.** The prompt hint made the system better at
the thing I measured and worse at something I had not thought to measure. Any
time you bias a recogniser toward an expected token, you increase the rate at
which ambiguous input becomes that token. That is not a flaw in the technique.
That *is* the technique.

**"Empty" is a value, and it needs handling.** A surprising number of bugs in
this project reduce to something empty being treated as something meaningful: an
empty transcript as a command, an absent checksum as a passing check, a missing
marker as proof of completion. Every boundary where content becomes action
deserves an explicit answer to *what if there is nothing here?*

The kitchen is quiet now. The robot no longer reacts to hearing its own name,
which is a form of maturity that took me considerably longer to acquire.

---

*Next: how I broke every conversational turn in the system for days without
noticing, because the fallback was too polite to complain.*
