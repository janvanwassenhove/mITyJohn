---
title: "AURA 15 · A privacy scanner in your pre-commit hook"
date: 2026-11-08
tags: ["security", "privacy", "development", "python"]
cover: "/blog/a-privacy-scanner-in-your-pre-commit-hook/cover.webp"
cardTag: "Security · Development"
draft: true
---

For a system that holds personal data, the most valuable test in the repository
is not the one that proves a feature works. It is the one that refuses to let
the data out.

Mine exists because I found a file that had already been committed.

## The incident

A skill-usage log. Innocuous name, sitting in a directory that had never
occurred to me as sensitive. Its contents were the owner's literal spoken
requests — everything that had been said to the assistant, in plain text, in git
history.

Nobody did anything careless. It was a log file in a project directory, and
project directories get committed. That is the entire mechanism, and it is why
"be careful" is not a control. Once is enough for that kind of data, and by the
time you notice, it is in history rather than in a file.

So the rule became structural: a scan that runs before every commit and refuses
anything that looks like personal data.

## Deny by class, not by guesswork

The important design decision. It is tempting to write a scanner that looks for
things that seem sensitive — clever heuristics, entropy checks, name detection.
That approach has an unbounded false-negative rate and you cannot reason about
its coverage.

Instead: enumerate the *classes* of file that must never be committed, and refuse
all of them.

- Runtime data directories — databases, encrypted stores
- Audio recordings, in any format
- Log files and line-delimited logs (transcripts, observations)
- Skill files, because a skill is a personal routine — playlists, habits, names
- Encrypted personal-data stores and exports
- Key material, certificates, SSH private keys
- `.env` files
- Camera snapshots

Plus content rules, applied inside text files: provider API-key patterns, GitHub
tokens, Slack tokens, AWS access keys, private-key blocks, credential
assignments with a real-looking value, and personal e-mail addresses at consumer
domains.

The distinction matters. "Is this file sensitive?" is a judgement call. "Is this
a `.db` file?" is not. The second question can be answered correctly every time,
by a machine, in milliseconds.

## Why the hook is not enough

A pre-commit hook is a courtesy, not a control:

- `git commit --no-verify` skips it.
- A fresh clone does not have it, because hooks are not versioned content. You
  have to opt in with `git config core.hooksPath .githooks`, and a new machine
  will not.
- Any tool that commits programmatically may not run it.

So the same scanner runs in continuous integration, over the whole tree, as an
enforced backstop. One implementation with two entry points — one that checks
only what you are about to commit, for speed, and one that sweeps the whole tree.
Not two scanners that drift apart.

There is a satisfying detail here: the scanner has its own tests, and CI runs
those too. A scanner nobody tests is a scanner that quietly stops matching.

## Escape hatches that stay visible

Every rule of this kind needs a way out, or people route around the rule
entirely. The question is whether the exception is *visible*.

Two hatches:

**An allow-list of paths** that match a deny rule but are deliberate templates —
`.env.example` with empty values, a production config containing only localhost
URLs. Content rules still apply to them.

**A marker on an individual line**, for a reviewed false positive — a documented
fake key in a test, say. It sits in the source, so the next person to read that
line can see the judgement was made deliberately.

Both appear in the diff. Someone adding an exception is making a visible,
reviewable claim rather than a private decision. Compare that to the usual
alternative — `--no-verify` — which leaves no trace at all.

Which, I should say, was not hypothetical. Writing this series, my own hook
stopped a commit of mine: two test passphrases in a new test file. They were
fake, they were fine, and the right move was to mark those two lines as
reviewed — not to bypass the check.

## Does it work?

Here is the number that convinced me.

When I audited this repository's full git history — not the current files, every
object that has ever existed — I scanned **4106 objects** against these same
rules.

Zero blocked paths. No `.env`, no database, no encrypted store, no audio, no
snapshot, no key material, no personal skill file. Ever. Two content findings,
both fake credentials in tests.

That is not luck. That is what a class-based deny rule buys you over three
hundred commits: the categories of mistake it covers simply did not happen,
including the ones I would certainly have made at eleven at night.

## What to steal

**Deny by class.** Enumerate what must never be committed as *categories of
file*. You will be able to reason about your coverage.

**Two entry points, one implementation.** The hook for speed, CI for
enforcement. Never two scanners.

**Test the scanner.** It is the thing standing between you and a permanent
mistake.

**Make exceptions visible.** An escape hatch that appears in review is a feature.
One that appears in someone's shell history is a hole.

**Assume you will make the mistake.** I am careful. I still committed a log of
spoken requests. The scanner is not there because I am careless; it is there
because the failure is silent, permanent, and about other people's data rather
than mine.

---

*Next, and last: verifying an installer before you run it — because
auto-update is remote code execution you have opted into.*
