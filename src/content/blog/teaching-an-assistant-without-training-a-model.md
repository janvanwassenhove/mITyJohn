---
title: "AURA 08 · Teaching an assistant without training a model"
date: 2026-08-18
tags: ["ai", "development", "agents", "privacy"]
cover: "/blog/teaching-an-assistant-without-training-a-model/cover.webp"
cardTag: "AI · Agents"
draft: false
---

When people hear that an assistant "learns about you", they picture fine-tuning.
Weights, gradients, a model that has absorbed you.

This one has never been fine-tuned and never will be. It learns the way a good
colleague does: it accumulates specific, inspectable facts, it notices patterns
and gets more confident as evidence piles up, and when you correct it, it writes
the correction down.

All of which turns out to be a design problem rather than a machine-learning
problem — and a considerably more interesting one, because every part of it has
to answer the question *"who is allowed to know this?"*

## Three kinds of memory, deliberately separate

**Facts** are explicit. Someone typed them, or the assistant asked and was told.
*Family, not a guest. Drinks espresso, no sugar.* They are editable in the
interface and they are exactly what they look like.

**Signals** are observed. Nobody typed them; the assistant noticed. And crucially
a signal is never simply true. Alongside what was noticed — *prefers short
answers*, say — it carries three things: how sure the assistant is, how many
times it has seen this, and when the observation should be treated as stale.

Every time the same thing is observed again, the confidence rises by a tenth,
the count goes up, and the expiry moves out. Below a confidence of **0.55** a
signal is not shown to the language model at all.

That threshold does more work than any other number in the system. It means a
single coincidence never becomes a belief. You have to do something roughly five
times before the assistant will act on having noticed it — and because every
observation carries an expiry, a habit you have dropped fades back out instead
of haunting you for ever.

**Skills** are procedures. Not "Nora likes espresso" but *"when he asks for a
specific track, do not guess with generic media control — search first, confirm
the match, then play."* They live as markdown files with a little frontmatter:
name, description, triggers, which personas they apply to, and optionally which
*person* they belong to.

Three memory types, three lifecycles. Conflating them is the mistake I would
most want to warn someone off. A fact you were told and a pattern you inferred
should never carry the same weight, and neither is a procedure.

<figure>
  <img src="/blog/teaching-an-assistant-without-training-a-model/brain-profile.webp"
       alt="The brain panel showing a person's profile: a demo badge, a fact counter reading twenty-two, and the first of those facts grouped by category — sport, likes, habit, interest — each written in plain language with wiki-style links to topics."
       width="1174" height="1766" loading="lazy" />
  <figcaption>Everything the assistant believes about someone, in one editable list. This is the fictional demo profile that ships with the app — note the badge, and note that every fact is a row you can delete.</figcaption>
</figure>

## The part where it teaches itself, and the part where it does not

The assistant can propose a skill. The system prompt nudges it: *when the owner
corrects you, or tells you how they work, consider writing that down.*

It cannot save one.

Writing a skill to disk is an approval-gated action. The agent drafts the text,
I see the whole thing, and I approve or refuse. Refuse and nothing is written at
all — not a partial file, not a draft kept "for later". That path has a test of
its own, because "the refuse button mostly works" is not a security model.

I want to be precise about why, because "human in the loop" is often decoration.
A skill is not a note; it is a **standing instruction that changes future
behaviour**. An assistant that writes its own standing instructions from its own
inferences is one bad inference away from confidently doing the wrong thing for
ever, and — worse — from doing it *plausibly*, in a file nobody remembers
approving.

So the loop is: it notices, it drafts, I approve. The learning is real and the
authorship is mine. In practice this costs about five seconds and it is the
single feature I would keep if I could keep only one.

<figure>
  <img src="/blog/teaching-an-assistant-without-training-a-model/skills-library.webp"
       alt="The skills library: procedures stored as cards, each with its trigger phrases listed beneath."
       width="1174" height="1131" loading="lazy" />
  <figcaption>Skills are procedures, not facts — each with the phrases that trigger it. The assistant may propose one of these. It may not save one.</figcaption>
</figure>

## What the model is actually told about you

Here is the part I find most interesting, and it is where privacy stops being a
policy document and becomes a function signature.

The language model never receives a profile. Every turn, a stateless judgment
layer reads a *minimal slice* and turns it into a short paragraph. The rules are
role-based, and they are not advisory:

| Role | What reaches the model |
|---|---|
| **Guest** | Display name. That is all — enough for a polite greeting. |
| **Minor** | Explicit facts only. Observed signals are **never** included. |
| **Family / owner** | Top facts, plus signals at or above the confidence threshold. |

The minor rule is the one worth dwelling on. It is not "we are careful with
children's data". It is a branch in the code: passive learning does not reach
the prompt for a minor, and recording a signal for one requires explicit,
owner-granted consent. The default is that a child's assistant knows what it was
*told* and nothing it has *inferred*.

There is a fourth rule that applies to everyone: raw biometrics and bulk profile
dumps never leave the machine. Face embeddings exist only encrypted; what the
cloud model gets is a paragraph of natural language, not a dossier.

And there is one entry that leads all the others, kept separate from ordinary
facts: a distillation of past conversations. Continuity is what
makes an assistant feel like it knows you, far more than any preference does.

## Why a paragraph rather than everything

The obvious implementation is to stuff the whole profile into the context and
let the model sort it out. Context windows are enormous now. Why not?

Three reasons, in increasing order of how much they cost me to learn.

**It gets worse, not better.** A model handed forty facts about someone will
find a way to use them, including the eleven that were irrelevant to the
question. Constraining the slice improved answer quality before it improved
anything else.

**The blast radius of a prompt leak is whatever you put in the prompt.** Send a
paragraph, leak a paragraph.

**Every byte is a decision you have made about someone.** When the slice is
small, you have to choose what matters — and that choice is inspectable, in one
function, rather than emergent from whatever happened to be in the store.

## You can look at all of it

Everything above would be worth very little if it were not legible.

The knowledge panel lists every person, every fact — editable — every observed
signal with its confidence, and the skills that exist. If the assistant believes
something about you, you can find where that belief came from and delete it.
Deleting a person destroys their encryption key, so their data becomes
unreadable rather than merely unlisted.

That is the property I would defend hardest, and it is the reason none of this
is fine-tuning. **A fine-tuned model cannot be asked what it knows about you,
and cannot be made to forget it.** Weights do not have a delete button. A row
does.

Personalisation that you can read, correct and revoke is a different product
from personalisation that has been baked into a model — even when the two behave
identically on a good day. The difference only shows up on a bad one.

## What still bothers me

**Confidence is a counter, not a probability.** Plus 0.1 per observation is a
heuristic that happens to work at household scale. It has no calibration behind
it, and I would not defend the number 0.55 as anything other than a value that
behaved sensibly in a house with four people in it.

**Skills accumulate faster than they are pruned.** Writing one is five seconds;
noticing that two of them now contradict each other is not automatic. There is a
rewrite path, but nothing yet that says *these two disagree*.

**"Adapts to the person" is easier to say than to evaluate.** I can show you the
slice that was injected. Proving the reply was better *because* of it needs an
experiment I have not run.

---

*Next: what all of that accumulates into — a graph of people, facts and the
topics they turn out to share.*
