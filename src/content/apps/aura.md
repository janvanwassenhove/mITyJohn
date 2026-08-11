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

## The name is the promise

| | |
|---|---|
| **Adaptive** | Adapts behaviour and interaction to the person, the context and the situation. |
| **Unified** | Brings conversation, mail, Teams, calendar, todos, memory and agents together in one place. |
| **Robotic** | Physically embodied through Reachy Mini — it looks at you, reacts, gestures. |
| **Assistant** | A personal assistant and copilot, not just another chatbot. |

## Why it feels different

-   **It looks at you and talks back.** Spoken replies over a live audio session, head tracking that follows your face, gestures timed to the words.
-   **It knows the room.** Faces are recognised, new visitors become guests, and every person gets their own encrypted profile — greeting, tone and context adapt to who is standing there.
-   **It does the work.** Mail, calendar, Teams, todos, music, screen control and dev tasks behind one conversation, with approval gates on anything sensitive.
-   **It gets better by itself.** Skills are written from real usage — and the assistant may *propose* one, but only you can save it.
-   **It keeps running when the internet doesn't.** Offline tier, local models, and a robot that behaves gracefully instead of freezing.
-   **Privacy is the product, not a checkbox.** AES-256-GCM per-person encryption, biometrics that never touch disk unencrypted, a step-up gate on destructive actions, and a scanner that blocks personal data from ever reaching git.

## The robot is optional

The physical Reachy arrived months after development started. Everything until then was built and tested against a fake robot speaking the same network contract — which is why the whole system still runs without one.

To try it you need a laptop and nothing else: `ROBOT_ADAPTER=fake` and `LLM_PROVIDER=echo` are the defaults, so you get the console, the brain, the encrypted knowledge store, the graph, skills, the approval gate and the event log. Replies come back as `[echo] …` because no model is attached, which is enough to walk the whole system.

For real conversations, one API key — OpenAI, OpenRouter or Google Gemini. For a body, a [Reachy Mini](https://pollen-robotics.com/reachy-mini/) Wireless on the same Wi-Fi.

Without the robot you lose exactly three things: motion, the camera — so face recognition and gestures — and room audio. Everything else behaves identically.

## Get it

Installers for Windows, macOS and Linux are on the [releases page](https://github.com/janvanwassenhove/aura/releases/latest). Source and the full architecture write-up, including the decision records, are on [GitHub](https://github.com/janvanwassenhove/aura).
