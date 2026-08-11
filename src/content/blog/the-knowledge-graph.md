---
title: "AURA 09 · A graph of people, and the wiki-links that build it"
date: 2026-09-17
tags: ["ai", "development", "architecture", "privacy"]
cardTag: "AI · Architecture"
draft: true
---

The previous post was about *how* the assistant learns. This one is about what
that accumulates into, and it turns out to be a shape rather than a list.

Every fact in a profile can contain wiki-style links. Not because I wanted a
personal knowledge base — because the moment two people are both linked to
*espresso*, the system knows something neither profile contains on its own.

<figure>
  <img src="/blog/the-knowledge-graph/graph.webp"
       alt="The knowledge graph: a dense cluster of small nodes labelled with topics, skills and facts, radiating from a larger central node for a person."
       width="1600" height="1000" loading="lazy" />
  <figcaption>One person, a few dozen facts, and the topics they mention. This
  is the fictional demo profile that ships with the app — a real one looks the
  same and is nobody else's business.</figcaption>
</figure>

## Four kinds of node, and only one of them is a person

The graph has exactly four node types, which is fewer than I expected to need.

**People.** The centre of everything, and the unit of both privacy and deletion.

**Facts.** Things known about a person, each belonging to a category — sport,
likes, work — and each free to mention topics.

**Topics.** Not entered by anyone. They come into existence because a fact
mentioned them, which means the topic vocabulary is *emergent* rather than
designed. Nobody sat down and decided the taxonomy. It accreted.

**Skills.** Procedures, which may be general or attached to one person.

<figure class="diagram">
  <div class="diagram-scroll">
    <img src="/blog/the-knowledge-graph/node-model.svg"
         alt="Diagram of the four node types. A person node, which holds a key, points to three fact nodes — sport, likes and habit — and to a skill node drawn with a dashed border because a skill may belong to one person or to everybody. The facts point onward to shared topic circles: running, espresso and Java 21. Espresso is reached from two different facts, illustrating that shared topics are the cheapest possible context. A note records that topics are never entered by anyone: they exist because a fact mentioned them."
         width="1000" height="780" loading="lazy" />
  </div>
  <figcaption>Four node types and two edge types. The vocabulary on the right
  was never designed — it accreted, one fact at a time.</figcaption>
</figure>

Edges are equally boring: a person has facts, a fact mentions topics, a skill
belongs to a person or to everybody. There is no weighting, no inference, no
embedding similarity. It is a plain graph, and its usefulness comes from being
*legible* rather than clever.

## Why links rather than tags

I tried tags first. Tags are a flat vocabulary you have to maintain, and the
maintenance is the part nobody does — six months in you have `coffee`,
`espresso` and `Coffee`, and the assistant treats them as three unrelated
interests.

Links inside the text avoid that, because they are written where the thought
already is. You are recording that someone is serious about espresso; the link
is part of writing it down, not a separate act of classification afterwards.

The pleasant consequence is that the graph is a *side effect of writing facts
properly*, which means it is never out of date with the profiles, because it is
generated from them rather than maintained alongside them.

## What the graph is actually for

Not visualisation. The picture is a debugging tool for me and a reassurance for
whoever wants to know what is stored — genuinely useful, but not the point.

The point is that **shared topics are the cheapest possible form of context.**
When two people in a household both link to the same subject, a question from
one of them can be answered with awareness of the other, without either profile
having to mention the other person. The connection lives in the graph rather
than in a fact somebody had to think to write.

And the second use, which I did not anticipate: it makes the system's beliefs
*inspectable as a whole*. A list of facts tells you what is stored. A graph
tells you what is **concentrated** — which topics have accumulated weight, which
person has drifted into being described mostly through one interest, which parts
of a profile came from things somebody typed and which grew sideways.

## Filtering by person, and why that mattered more than it should

The first version drew everyone at once. With one profile that is a diagram.
With a household it is a hairball, and a hairball is not an interface.

So the graph filters by person: chips along the top, click to include, click
again to drop. The default is everyone; the useful view is usually one.

That sounds like a small piece of UI work and it was, apart from one bug worth
mentioning because it is a category rather than an incident. The filter rebuilt
its selection on every render, which meant the graph's watcher saw a new value
every time, which meant the force layout restarted — so the nodes drifted
gently back to the middle every few hundred milliseconds, forever, like a
slowly collapsing soufflé.

The fix was to compute the selection once instead of on every render. The lesson
is broader: **a value that is recreated each render is not the same value, even
when it contains the same things**, and anything watching it will believe the
world has changed.

## What the graph deliberately does not do

**It does not infer.** No "these two people both like X, therefore Y". Every
edge exists because something was written down. The moment a graph starts
generating its own edges, nobody can answer the question "why does it think
that", and being able to answer that question is the entire product.

**It does not leave the machine.** The language model never receives the graph.
It receives a short paragraph about one person, assembled per turn under
role-based rules. The graph is for the owner, not the model.

**It does not survive the person.** Deleting someone destroys their encryption
key, and their facts go with it — which means their topics lose those edges and
any topic that existed only through them stops existing at all. Deletion in a
graph is normally a nightmare of dangling references. Here it falls out of the
crypto: no key, no facts, no edges.

---

*Next: the day the assistant started answering questions nobody had asked,
because its own voice was hallucinating its own wake word back into its own
input.*
