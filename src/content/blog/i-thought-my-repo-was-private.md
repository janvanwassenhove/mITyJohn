---
title: "\"I thought my repo was private\""
date: 2026-11-15
tags: ["security", "privacy", "development", "git"]
cover: "/blog/i-thought-my-repo-was-private/cover.webp"
cardTag: "Security · Git"
draft: true
---

I spent an afternoon carefully preparing a repository for publication. Auditing
the full history, rewriting the parts that should not be public, verifying the
result three times because a history rewrite is not something you get to do
twice casually.

Then, near the end, I ran one more check.

```
"private": false
"visibility": "public"
```

It had been public the whole time.

## How the afternoon started

The plan was sensible. Before making a repository public you audit it properly,
because publishing is irreversible and takes the entire git history with it —
not the current files, everything that has ever been committed.

The mechanical part came back clean, and I have written about why: a scanner
runs in the pre-commit hook and again in CI, denying whole classes of file. Four
thousand-odd objects in history, zero blocked paths, no credentials.

So there were no secrets to rotate. Good.

Then I went looking for what a scanner cannot catch.

## What a scanner cannot catch

Two real first names, belonging to members of my household, used as test
fixtures.

Not in passing. One appeared as a person with role `family` and an attached
music preference — a small, specific fact about a real person's taste. The other
appeared in a *face recognition* test, with a `school` fact and a homework
skill attached.

That second one is data about a child.

No path rule catches this. No content rule catches this. `"display_name": "..."`
in a test file is exactly what a test file is supposed to contain. The only
thing that catches it is a person reading their own repository and asking who
these strings refer to.

Alongside that, less serious but still mine: home network addresses, and a
development diary that is candid in the way notes to yourself are candid.

## Why fixing the current files is theatre

The obvious move is to open the four test files, swap the names, commit. Twenty
minutes.

It achieves nothing. The names remain in every commit that ever contained them,
and on a public repository those commits are as browsable as the current
version. "Removed in the latest commit" is not removal; it is a note explaining
where to look.

The only real fix is rewriting history, which means every commit hash changes.
That is genuinely disruptive — and worth it when the alternative is a child's
first name attached to biometric test data in a permanent public record.

## The trap that nearly wrecked the documentation

Here is where it got interesting, and where I nearly did real damage.

One of the names was **Elke**. In Dutch — the working language of the
project's ledger — *"elke"* is an ordinary word meaning "every". It appears
constantly, including capitalised at the start of sentences: *"Elke connector
krijgt een Test-knop"*, *"Elke capability is een..."*

A global find-and-replace would have swapped a name in four test files and
mangled the documentation of a three-hundred-commit project into nonsense,
across all of history, in a single irreversible operation.

So: context-specific rules only. Replace `"Elke"` in quotes. Replace
`person_id="elke"`. Replace `people/elke`, `jan/Elke`, `Forget Elke?`. Never the
bare word.

And then, because a rule I wrote is not evidence, a proof: enumerate **every
remaining occurrence** in the rewritten history and check each one is prose.
Seven remained. All seven were the ordinary Dutch word at the start of a
sentence.

## It took three attempts

**First attempt.** Missed `jan+Elke` — I had covered the variant with a slash
and not the one with a plus. Also, I had chosen the replacement name *Mila*,
which collided with an existing fictional demo character in the project called
Mila. Two different Milas is worse than the problem I was solving.

**Second attempt.** New names, checked for collisions first. Then I ran the test
suite against the rewritten history, which is the step it would have been very
tempting to skip. Two tests failed. Four lowercase forms I had not covered —
`person="elke"`, `by_person["elke"]`, `https://elke.example` — leaving
identifiers that no longer matched their data.

That failure is the entire argument for testing a history rewrite. A text
substitution across a codebase is a refactor performed by a tool with no
understanding of syntax.

**Third attempt.** Enumerated every code-shaped variant across the *original*
history first, rather than guessing again. Wrote the complete rule set. Rewrote.
All suites green: 346 brain tests, 88 console, 142 schemas, 40 connectors. Zero
remaining occurrences of anything but Dutch prose.

Then pushed, and confirmed the old commits were no longer retrievable.

## And then I checked

The habit that produced this post is small: after finishing, verify the thing you
assumed at the start.

I ran one API call to confirm the repository's state before flipping it to
public.

`"private": false`. An anonymous request returned `200`.

Public since creation. Which means the names, the child's school fact, the home
network layout and the diary had all been publicly readable for weeks — during
the entire afternoon I spent carefully preparing them for publication.

## What actually mitigated it

Not skill. A handful of facts:

- **Zero forks, zero watchers, zero stars.** Nobody had made a copy.
- **The old commits were already unreachable** after the force-push — GitHub
  returned "No commit found for SHA" within minutes.
- **No credentials were ever committed**, because the scanner had been doing its
  job for three hundred commits. Nothing to rotate.
- **First names only.** No surnames, no contact details, no photographs. Private
  network addresses that are not routable.

So the practical damage was small. I want to be precise about that rather than
dramatic. But the size of the damage was luck, and the lesson is not.

## The actual lesson

It is not about git. It is about which assumptions you never articulate, and
therefore never check.

I checked the history exhaustively. I checked for credentials, for databases,
for audio, for keys. I built a scanner and ran it over four thousand objects. I
verified the rewrite three separate ways.

Every one of those checks was downstream of an assumption I had never once
stated out loud: *this repository is private*.

I do not remember deciding that. I remember believing it, which is different and
much more dangerous, because a belief you never stated is a belief you never
scheduled a check for.

The practical version, which I now do: **when you begin a piece of careful work,
write down the assumptions it rests on — and verify the cheapest ones first.**
The visibility check was one API call. I ran it last. It should have taken thirty
seconds and it should have been step one.

---

*Next: shipping. The update that deleted its own face recognition — twice, for
two different reasons.*
