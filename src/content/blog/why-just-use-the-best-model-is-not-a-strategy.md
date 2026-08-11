---
title: "AURA 08 · Why \"just use the best model\" is not a strategy"
date: 2026-09-20
tags: ["ai", "generative-ai", "development"]
cover: "/blog/why-just-use-the-best-model-is-not-a-strategy/cover.webp"
cardTag: "AI · GenAI"
draft: true
---

I broke every conversational turn in my assistant. Every single one, for days.
It kept answering. It answered by echoing my own question back at me, politely,
and I did not notice.

This is a post about model routing, and about the specific way that a good
fallback can hide a total failure.

## The setup

AURA does not use one model. It uses several, in distinct roles:

- **Conversation** — the first round of every turn. Needs to be fast, because
  someone is standing there waiting for a spoken reply.
- **Tasks and tools** — takes over from round two onward, once a turn becomes
  multi-step. Needs to be strong, because it is orchestrating actual actions.
- **Screen control** — driving a desktop UI. Needs vision.
- **Voice** — the speech-to-speech realtime loop. A different class of model
  entirely.

Splitting these is not premature optimisation. Using the strongest available
model for round one adds latency to every single reply, and using a fast small
model for tool orchestration produces confident nonsense at the point where
things get clicked. The roles have genuinely different requirements.

Which means someone has to choose, and the UI has to help them choose.

## The first bug: a model that was there and invisible

The original role selectors were HTML `<input list=…>` datalists. The complaint
was "I cannot pick the same model for tasks — `gpt-5.4` is not in the list."

It was in the list. A datalist filters its suggestions against what is already
typed in the field, so with `gpt-4.1` in the box the browser simply stops
offering `gpt-5.4`. The model was available. It was unfindable.

Fixed with real select elements. Worth mentioning because it is the least
glamorous failure here and cost the most user frustration: the feature worked
perfectly and the control was lying about what it could do.

## The second bug: a list that was honest but useless

The dropdown was populated from the provider's own API, which felt
unimpeachable — no hardcoded list to go stale.

Except the provider returns *everything*: chat models, embedding models,
text-to-speech, transcription, image models, realtime endpoints, all mixed
together. So you could select an embedding model for conversation. It would sit
there looking plausible and fail on first use with a message about the endpoint
not supporting it.

The fix was classification: work out for each model whether it can hold a text
conversation, look at an image, or run a live speech session — drop anything
that does none of the three — and give each role exactly the list it can use.
Conversation gets chat models, screen control gets vision models, voice gets
realtime.

A detail I am glad I added: a previously-saved model the provider no longer
offers stays visible, labelled *"(not in the provider's list)"*, rather than
silently vanishing. A setting that disappears without explanation is worse than
one that is wrong, because the owner cannot tell whether they imagined it.

And an honest limitation, recorded in the ledger: **the classification is tested
against id patterns, not against a live account.** If a provider names something
unusually, it lands in the wrong bucket. I know that, and it is written down
where someone can find it.

<figure>
  <img src="/blog/why-just-use-the-best-model-is-not-a-strategy/model-roles.webp"
       alt="The settings dialog showing four model roles — conversation, voice, tasks and tools, screen control — each with its own dropdown."
       width="1600" height="1000" loading="lazy" />
  <figcaption>Four roles, four lists, and the sentence at the bottom that this whole post is about: only Voice takes a realtime model, because the others go through chat-completions and a realtime model cannot serve those.</figcaption>
</figure>

## The third bug: the one that broke everything

Now the interesting one, which was entirely my own doing.

While fixing the list, I reasoned: the *Conversation* role feeds the voice loop,
voice needs speech-to-speech, therefore Conversation should offer realtime
models only. It sounded obviously correct, and the UI now offered exactly those.

The owner picked a realtime model, as instructed.

**Round one of every turn — including typed messages — goes through chat
completions, using the model configured for the conversation role.** Realtime
models are not valid there. Every turn started returning:

```
404 – This is not a chat model and thus not supported in the
v1/chat/completions endpoint
```

Every turn. Typed and spoken. For days.

## Why nobody noticed

Because the system had a fallback, and the fallback worked.

When the language-model call fails, the pipeline degrades to an echo provider so
the assistant remains responsive rather than dying. It prefixes its output with
`[echo]`. Nothing crashed. No alert fired. The console was green. The
configuration endpoint reported `provider=openai, model=gpt-4o-mini, key set` —
which was true, and which described a different setting than the one in the
failing path.

The report that finally surfaced it was not "the assistant is broken". It was:
*"the robot does not respond to the wake word any more, is the microphone
working? And in the chat it echoes my question back."*

That `[echo]` prefix was the whole tell. The wake word was fine; every turn it
started was dying downstream.

## What I changed, and what I would tell you

**Give each role the models it can actually run.** Conversation went back to
chat models. The voice model moved to its own field, read separately by the
realtime loop — where it had always belonged.

**Make the backend refuse impossible combinations.** This is the part that
matters beyond my project. It is not enough to fix the dropdown, because the
dropdown is not the only way a value gets set — there is an env file, an API,
and a future me with a config script. The server now rejects a realtime model
for the chat role with a `422` explaining where it *does* belong, and a rejected
value is not partially applied.

A UI choice must not be able to write an unrecoverable state.

**Make fallbacks loud.** This is the lesson I actually carry. A silent fallback
is a bug that keeps your service up while returning nothing of value, and it
will do so for exactly as long as nobody looks closely. Degradation should be
visible in the interface, not just in a log prefix that a human has to notice
and interpret.

If I had spent five minutes adding a banner that said *the language model is
unavailable; you are talking to a fallback*, this would have been a
five-minute bug.

**And the meta-lesson:** I introduced this while making the system *safer*. The
restriction was well-intentioned, locally reasonable, and wrong because of a
data flow one file away from where I was working. Good tests would not have
caught it either — the unit tests for model selection all passed, because model
selection was working correctly. What failed was the assumption about which
role fed which code path.

Sometimes the only thing that catches that is using the thing.

---

*Next: hardware. Taking camera latency from 1554 ms to 131 ms, and the cache I
shipped with a zero percent hit rate.*
