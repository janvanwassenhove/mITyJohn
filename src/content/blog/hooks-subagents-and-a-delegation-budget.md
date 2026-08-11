---
title: "AURA 06 · Hooks, sub-agents, and a budget for delegation"
date: 2026-09-03
tags: ["ai", "development", "agents", "architecture"]
cover: "/blog/hooks-subagents-and-a-delegation-budget/cover.webp"
cardTag: "AI · Agents"
draft: true
---

Give an agent tools and it will use them. Give an agent the ability to spawn
*more agents* and you have invented middle management, with all the attendant
risks: work that expands to fill the available rounds, decisions made three
levels down that nobody remembers authorising, and a budget nobody is watching.

Which is a shame, because delegation is genuinely useful. A main loop that has
to read forty files to answer one question spends its entire context on
reading, and then reasons badly about what it read. Handing that off to
something with its own context, and getting back a paragraph, is strictly
better.

So the question is not *whether* to let an agent delegate. It is what the
delegated thing is allowed to do.

## The sub-agent can look. It cannot touch.

When the main loop delegates a subtask, the thing it spawns runs with:

**A hard read-only allowlist.** Not a suggestion in a prompt — a check in the
code path that runs every tool call. If a tool is not on the list, it is
refused, *including when the current mode would otherwise permit it*. The
sub-agent cannot write files, cannot commit, cannot send anything.

**Its own round budget.** Four rounds by default, six at the very most — the
main loop may ask for fewer but cannot ask for more. Then it returns whatever it
has. There is no "just one more look".

**No onward delegation.** A sub-agent cannot spawn a sub-agent. The tree is
exactly two levels deep, always, by construction.

That third rule is the one I would argue for hardest, and it is the one that
looks most like a limitation. Unbounded delegation is where agent systems go
quietly insane: each level is individually reasonable, the total is
unaccountable, and by the time you notice, something four levels down has
decided that the fastest way to satisfy the request is to delete the failing
test.

Two levels is enough to move the reading out of the main context. Three is
enough to lose track.

<figure class="diagram">
  <div class="diagram-scroll">
    <img src="/blog/hooks-subagents-and-a-delegation-budget/delegation-bounds.svg"
         alt="Diagram of delegation bounds. Level one is the main loop, which may read, may write with approval, and may delegate. It delegates to a level-two sub-agent, which may read but may never write and may never delegate onward, and which returns a summary rather than a context. A level three is drawn crossed out: it does not exist, by construction. Below, the three bounds on a sub-agent are listed: a read-only allowlist checked in the tool path, a budget of six rounds, and a depth limit of two levels."
         width="1000" height="985" loading="lazy" />
  </div>
  <figcaption>Two levels, three bounds, and a level three that was never built.
  None of these makes the agent smarter; all of them make it survivable.</figcaption>
</figure>

## Hooks: policy that fires whether the model likes it or not

The other half of this is smaller and, I think, more useful to steal.

A hook is a declarative rule — a line of JSON, editable while the system runs —
that sits in front of a tool call. There are two kinds.

**A blocking hook replaces the call.** Not "discourages". Replaces. If a rule
says "run the tests before pushing", then a push attempt does not push. It
returns the hook's message instead, the model reads why it was stopped, and
adapts on the next round. It is a wall with an explanation written on it.

**A trailing hook appends a note to the result.** Write a file, and the result
comes back with "now run the linter" attached — advice at exactly the moment it
is relevant, rather than in a system prompt nobody re-reads by round nine.

The important property, and the reason these exist at all:

> Hooks are policy, not model behaviour. They fire every time, and they never
> replace the approval gate.

<figure class="diagram">
  <div class="diagram-scroll">
    <img src="/blog/hooks-subagents-and-a-delegation-budget/hook-order.svg"
         alt="Diagram of where a hook sits. The model asks for a tool. A blocking hook checks whether a rule matches; if it does, the call is replaced and the model reads why it was stopped and adapts on the next round. Otherwise the call reaches the approval gate, which stops anything touching the outside world, then the tool actually runs, then a trailing hook appends a note before the result returns to the model."
         width="1000" height="830" loading="lazy" />
  </div>
  <figcaption>Every box in that row is code in the tool path. A prompt that says
  "always run the tests first" works most of the time, which is exactly the
  failure profile you cannot build on.</figcaption>
</figure>

Everything I have learned about agentic systems says the same thing in different
words. **Anything you need to be true must be true in code.** A prompt saying
"always run the tests first" works most of the time, which is exactly the
failure profile you cannot build on. A rule in the tool path works every time,
including on the run where the model is tired, confused, or has convinced itself
that this case is special.

## The one thing it may write, and the price of writing it

There is exactly one way for the assistant to change its own future behaviour:
it can propose a skill — a procedure, in plain markdown, with the phrases that
should trigger it.

It cannot save one. Writing to disk is approval-gated. The agent drafts, I read
the whole thing, I approve or refuse. Refuse and nothing is written at all: no
partial file, no draft kept "for later". That path has its own test, because
"the refuse button mostly works" is not a security model.

The system prompt actively encourages the proposing — *when the owner corrects
you, or tells you how they work, consider writing that down* — because the
learning is genuinely valuable. What it does not get is authorship.

A skill is not a note. It is a standing instruction that changes what happens
next time, and an agent that writes its own standing instructions from its own
inferences is one bad inference away from confidently doing the wrong thing
forever — plausibly, in a file nobody remembers approving.

Five seconds of my attention, once. It is the single feature I would keep if I
could keep only one.

## What this is really about

Every mechanism in this post is the same mechanism wearing different clothes:
**bound the thing you cannot fully predict.**

A read-only allowlist bounds what a delegated agent can reach. A round budget
bounds how long it can go on. A depth limit bounds how far the tree can grow.
A hook bounds the order operations may happen in. An approval gate bounds what
reaches the world.

None of those makes the agent smarter. All of them make it *survivable*, which
matters more, because the agent is going to be wrong sometimes and the only
question that counts is what it can reach when it is.

The honest limitation: none of this evaluates whether the delegated work was any
*good*. A sub-agent that reads forty files and returns a confident, wrong
paragraph is well within budget and entirely permitted. Bounding the blast
radius is not the same as bounding the error rate, and I do not have a good
answer for the second one yet.

---

*Next: the loops that keep running whether or not anyone is talking to it — and
the bugs that live between them rather than inside any one of them.*
