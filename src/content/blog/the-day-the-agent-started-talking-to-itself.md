---
title: "The day the agent started talking to itself"
date: 2026-09-13
tags: ["ai", "development", "agents", "voice"]
cover: "/blog/the-day-the-agent-started-talking-to-itself/cover.webp"
cardTag: "AI · Voice"
draft: true
---

The robot answered a question nobody had asked.

Not a wrong answer to a real question — that is ordinary. A complete, polite,
generic answer to nothing at all, delivered to an empty room. Then, a little
later, it did it again.

This is my favourite bug in the whole project, because every single component
involved was working correctly.

## The symptom

"Ghost conversations." The assistant would produce a reply with no preceding
input, the reply would be bland and non-committal in a way that felt like the
model had been handed almost nothing, and it had a tendency to repeat.

The first instinct is to suspect the microphone: stray noise being transcribed
into something. That is roughly right and almost entirely unhelpful, because the
interesting question is not *whether* noise got in but what shape the noise had
to be to make it all the way to a spoken answer.

## The chain

Here is what was actually happening, in order.

**1. The speech-to-text prompt hint.** Whisper accepts a prompt to bias
transcription toward expected vocabulary. I had given it the wake word,
"Richie", so it would reliably catch the name rather than producing "ritchy" or
"rich e". This measurably improved wake-word recognition. It is standard
practice and it worked.

**2. The bias fired on nothing.** With that hint in place, ambient noise — and,
worse, the robot's own voice coming back through the microphone — was
occasionally transcribed as exactly the biased token. The model had been told
this word is likely. Given something ambiguous, it produced the likely word.
Doing precisely what it was configured to do.

**3. The echo guard did its job.** There is a guard for the robot hearing
itself. When it detects self-hearing, it strips the echoed content and returns
what remains. What remained, in this case, was the bare wake word.

**4. The bare wake word became a command.** And here is the bug. Downstream code
took the post-guard transcript and treated it as user input. A transcript
consisting of nothing but the wake word was passed to the language model as a
command: `"richie"`.

**5. The model answered.** Of course it did. Handed a single word with no
content, it produced something generic and conversational.

**6. The robot spoke the answer out loud.** Which the microphone heard. Which
could be transcribed as the wake word again.

Six steps. Every one defensible in isolation. The bug did not live in any of
them — it lived in the composition, in the assumption that a transcript which
survived the guard was necessarily a *request*.

## Why it took a while to see

Because I kept looking for the broken component.

I checked the microphone gain. I checked the echo guard's thresholds. I checked
whether the wake-word detector was firing spuriously — it was not; it was firing
*correctly* on input that genuinely contained the wake word, because the
transcriber had put it there.

Every component passed inspection. That is the signature of a composition bug,
and I now treat "all the parts look fine" as a positive finding rather than a
dead end. It tells you to stop testing components and start drawing the path.

The other thing that slowed me down: I did not have *the loop* in my head as a
loop. I had a pipeline in my head — audio in, text, model, speech out. Pipelines
have ends. This one did not; the output was physically connected back to the
input by the air in the room.

## The fix

Trivial, once seen:

> A command that has fewer than two characters left after stripping the wake
> word never reaches the language model.

Strip "Richie" (and the common mis-transcription "Ritchie"). If what remains is
empty or near-empty, discard it. `"Richie play some music"` becomes
`"play some music"` and proceeds. A bare `"richie"` — whether from noise, from
echo, or from someone genuinely saying just the name — is dropped.

Four lines. Tested in both directions: bare and echoed wake words are ignored,
a real command with the wake word attached still works.

## What I actually take from this

**Draw the loop your outputs close.** In any system whose output re-enters its
own input — a speaker near a microphone, an agent that writes files it later
reads, a bot posting to a channel it monitors — there is a cycle, and you should
draw it explicitly rather than discovering it.

**Gate where the loop closes, not where the symptom appears.** My instinct was
to make the echo guard smarter, because the echo guard was where the noise came
from. That would have been a fragile arms race of thresholds. The right place
was the boundary where a transcript becomes a *command*, because that is where
the cycle actually closes. The guard's job is to remove echo; deciding what
counts as a request was never its responsibility.

**Beware the well-intentioned bias.** The prompt hint made the system better at
the thing I measured (wake-word accuracy) and worse at something I had not
thought to measure (false positives on noise). Any time you bias a recogniser
toward an expected token, you have increased the rate at which ambiguous input
becomes that token. That is not a bug in the technique. It is the technique.

**"Empty" is a value that needs handling.** A surprising number of bugs in this
project reduce to something empty being treated as something meaningful — an
empty transcript as a command, an absent checksum as a passing check, a missing
marker as proof of completion. Every boundary where content becomes action
deserves an explicit answer to "what if there is nothing here?"

The assistant is quiet in an empty room now. It took four lines, and about two
hours of staring at components that were all working perfectly.

---

*Next: how I broke every conversational turn in the system for days without
noticing, because the fallback was too polite to complain.*
