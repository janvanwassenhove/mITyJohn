---
name: "AURA"
code: "AURA"
tag: "lab"
cat: "lab"
blurb: "A desk robot that knows who you are and joins your workday. Everything it learns stays encrypted on your own laptop — and it runs perfectly well without the robot."
repo: "aura"
order: 1
isNew: true
---

**Adaptive Unified Robotic Assistant.** A personal chief-of-staff that recognises the person in front of it, holds a real spoken conversation, reaches into mail, calendar, chat and tasks, and moves like it means it.

The interesting part is where things live. Every key, every profile, every face embedding stays on your laptop, encrypted with a passphrase only you have. The robot on the desk holds nothing at all — steal it and you get motors.

<figure>
  <video controls preload="none" playsinline width="1280" height="720"
         poster="/video/aura-crawl-poster.webp?v=2"
         aria-label="AURA's opening crawl: one minute of text scrolling away into a starfield, introducing what the assistant does">
    <source src="/video/aura-crawl.mp4?v=2" type="video/mp4" />
  </video>
  <figcaption>One minute, in its own words: the opening crawl from the Devoxx
  talk. No sound.</figcaption>
</figure>

## The name is the promise

<ul class="acronym">
  <li>
    <span class="acronym-letter" aria-hidden="true">A</span>
    <span class="acronym-word">Adaptive</span>
    <span class="acronym-text">Adapts behaviour and interaction to the person, the context and the situation.</span>
  </li>
  <li>
    <span class="acronym-letter" aria-hidden="true">U</span>
    <span class="acronym-word">Unified</span>
    <span class="acronym-text">Brings conversation, mail, Teams, calendar, todos, memory and agents together in one place.</span>
  </li>
  <li>
    <span class="acronym-letter" aria-hidden="true">R</span>
    <span class="acronym-word">Robotic</span>
    <span class="acronym-text">Physically embodied through Reachy Mini — it looks at you, reacts, gestures.</span>
  </li>
  <li>
    <span class="acronym-letter" aria-hidden="true">A</span>
    <span class="acronym-word">Assistant</span>
    <span class="acronym-text">A personal assistant and copilot, not just another chatbot.</span>
  </li>
</ul>

## Why it feels different

-   **It looks at you and talks back.** Spoken replies over a live audio session, head tracking that follows your face, gestures timed to the words.
-   **It knows the room.** Faces are recognised, new visitors become guests, and every person gets their own encrypted profile — greeting, tone and context adapt to who is standing there.
-   **It is not one assistant.** Ten characters, each with its own voice, humour and way of moving: Scout explains itself, Sentinel answers in one line and says how sure it is, Buddy is for children, and Grump does everything and enjoys nothing. The camera decides which one you meet.
-   **It does the work.** Mail, calendar, Teams, todos, music, screen control and dev tasks behind one conversation, with approval gates on anything sensitive. Where there is no integration, it finds its own way on the desktop — any app, its window, its keys — and asks before it does.
-   **It gets better by itself.** Skills are written from real usage. When you correct it, or it works out a route on its own, it offers to keep the steps that worked — and only you can save them.
-   **It keeps running when the internet doesn't.** Offline tier, local models, and a robot that behaves gracefully instead of freezing.
-   **Privacy is the product, not a checkbox.** AES-256-GCM per-person encryption, biometrics that never touch disk unencrypted, nothing learned from a child's conversations unless you opt in, a step-up gate on destructive actions, and a scanner that blocks personal data from ever reaching git.

## A mode for every room

The header switches between **Home**, **Work**, **Quiet**, **Stand** and **Present**, and each one decides what it may reach and how it behaves.

**Stand** is for a fair: one click and it wanders, looks at whoever comes up, and talks with visitors — while mail, calendar, files, the screen and everything it knows about you and your household are out of reach, and it remembers nobody it meets. **Present** puts it on stage: a talk is a script of cues, it moves as it speaks, the projector shows subtitles of what it says, and its voice can come out of the laptop instead of the robot — still its own voice. It was built for exactly that, for the Devoxx talks.

When nobody needs it, it can wander where it stands: look around, follow the people it sees, turn towards voices, and now and then giggle, go *hmm* or yawn — the robot's own recordings, not a synthesiser.

## The robot is optional

The physical Reachy arrived months after development started. Everything until then was built and tested against a fake robot speaking the same network contract — which is why the whole system still runs without one.

To try it you need a laptop and nothing else. Without a robot it uses the fake, and without an API key it answers on a test provider that echoes what you say, so replies come back as `[echo] …` — enough to walk the console, the brain, the encrypted knowledge store, the graph, skills, the approval gate and the event log.

For real conversations, one API key — OpenAI, OpenRouter or Google Gemini. Screen control needs an Anthropic key. For a body, a [Reachy Mini](https://pollen-robotics.com/reachy-mini/) Wireless on the same Wi-Fi.

Without the robot you lose exactly three things: motion, the camera — so face recognition and gestures — and room audio. Everything else behaves identically.

## Get it

Installers for Windows, macOS and Linux are on the [releases page](https://github.com/janvanwassenhove/aura/releases/latest), and the app updates itself. Source and the full architecture write-up, including the decision records, are on [GitHub](https://github.com/janvanwassenhove/aura). The story of how it was built — the mistakes included — is the [AURA series](/blog/i-gave-my-agents-a-body/) on the blog.
