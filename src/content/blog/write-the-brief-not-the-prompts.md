---
title: "Write the brief, not the prompts"
date: 2026-07-20
tags: ["ai", "development", "architecture", "sdlc"]
cover: "/blog/write-the-brief-not-the-prompts/cover.webp"
cardTag: "AI · SDLC"
draft: false
---

This website used to be WordPress. It is now a static site, rebuilt from
nothing, and I did almost none of the typing.

That sentence has been available for a couple of years now, and it has usually
meant "I generated some components and fixed them by hand for a week". This
time it meant something closer to what it says. So this is a post about the
thing that actually made the difference, which had nothing to do with the code
and everything to do with what I wrote before any code existed.

I wrote a brief. Not prompts. A brief.

## The job nobody volunteers for

Moving a site off WordPress sounds like a design exercise and is really an
archaeology exercise. Thirty-seven posts going back to 2022. Fifteen app pages. A
picture book in four languages. A media library with 1,751 files in it, most of
them uploaded by a version of me who was not thinking about the person who would
later have to move them.

And the URLs. The old site used plain permalinks, which look like this:

```
https://mityjohn.com/?p=941
https://mityjohn.com/?page_id=184
https://mityjohn.com/?tag=ai
```

Every post, every page, every tag: a query string. Every share, every backlink,
every QR code on a conference slide points at a number after a question mark.
Move to a static host and all of those quietly resolve to the homepage, because
static hosts do not read query strings. Nothing errors. Nothing alerts. You just
slowly stop existing in search results.

That is the actual project. The Astro build is a weekend. The other 110 URLs are
the work.

<figure>
  <img src="/blog/write-the-brief-not-the-prompts/cables.webp"
       alt="A tangle of old network cables on the left, merging into one clean modern connector on the right."
       width="1600" height="900" loading="lazy" />
  <figcaption>Every one of those used to be a link somebody shared.</figcaption>
</figure>

## Why prompting stops working at this size

Prompting is conversational. You say a thing, you look at what comes back, you
correct it. It is a wonderful way to work and it holds together for about two
hours.

Past that, three things go wrong. You forget what you decided on Tuesday. The
agent has no way to know that a decision was load-bearing rather than casual. And
"done" drifts, because you are the only definition of done and you get tired.

The fix is not a better prompt. It is moving the decisions out of the
conversation and into a document that both of you are held to. Mine was called
`MIGRATION_BRIEF.md`, it ended up at 870 lines, and near the top it said: if the
chat and this document disagree, the document wins.

That one line changes the relationship. The agent stops being a fast intern
you're steering and starts being a contractor working to a signed scope.

## What actually belongs in it

Four things carried the entire project. Steal all four.

**Non-negotiables, numbered, at the top.** Six of them, N1 to N6. These are the
constraints that quietly destroy the project if violated, and they need to be
findable in two seconds. Mine included:

> **N2** — `/wp-content/uploads/**` keeps working at the identical path.

Not a preference. Every image in every old post and every social preview resolves
through those paths. Rename one folder to something tidier and you have broken a
decade of other people's links, in a way nobody reports because it looks like it
was always broken.

**Phases with acceptance criteria you can mechanically check.** Eight of them.
Design intake, inventory, reconciliation, scaffold, migration, integrations,
stores, cutover. Each one ended with a report against its own criteria, and the
next did not start until the previous passed.

The word "mechanically" is the whole trick. "SEO is preserved" is a feeling.
"Every legacy URL returns a literal 301 with the correct Location" is something
you can run at two in the morning and get a yes or a no.

**A decision log with reasons.** Ten closed decisions, each with why. When you
hit the same question again in phase six — and you will — you read the reason
rather than re-deciding badly because it is late.

**An explicit list of what you are not building.** Book detail pages went in the
brief as dropped, with a sentence explaining why. Written down, that is a scope
decision. Left unwritten, it becomes a thing you feel vaguely guilty about for
three weeks.

None of this is new project management. What is new is that it now pays off
inside a single evening instead of across a quarter, because the thing consuming
the spec reads at machine speed and never skims.

## Fable 5 and the shape of the work

Most of this was built with Fable 5, and the brief approach is not incidental to
that — it is the thing that makes Fable worth using on a project this size.

Fable rewards being told the destination rather than the next turning. Hand it a
phase with acceptance criteria and it will work through the boring middle of that
phase on its own: mirroring 1,751 files, converting 37 posts, rewriting every
internal link, then grepping its own output to prove none survived. It does not
get bored around file 800. It does not quietly decide that ninety per cent is
basically all of them.

Hand it something vague and it will produce something plausible in the wrong
direction, very fast. The failure mode of a capable agent is not incompetence,
it is confident momentum. A brief is how you point the momentum.

The last stretch — cutover, the redirect layer, the awkward final ten per cent of
the design where everything is a judgement call — I finished with Opus 4.8. Same
brief, different gear. That is worth knowing: the document is portable. Switching
models mid-project cost me nothing, because the context that mattered was in the
repo rather than in a chat history.

## What it was good at, and where I still had to look

Good at: volume, consistency, and never skipping the tedious verification step
when the brief said to do it. The most valuable thing it produced was not the
migration. It was a script that replays all 110 old URLs against the live site
and asserts each one returns a literal 301 to the right place. The migration
happens once. The thing that proves the migration is still correct is what you
keep.

Not good at: knowing what it does not know.

At one point it wrote an app description explaining that Typix is a tool for
"typing pixels into being". Typix is a personality assessment tool. It does
nothing of the kind. The agent had inferred the description from the name, and
written it confidently, in my voice, in a file full of otherwise correct
descriptions.

<figure>
  <img src="/blog/write-the-brief-not-the-prompts/apps.webp"
       alt="The app store page of the new site, showing a grid of app cards with screenshots, short descriptions and download buttons."
       width="1376" height="1184" loading="lazy" />
  <figcaption>Every blurb here got rewritten against the app's own page. Twice, in one case.</figcaption>
</figure>

This is the part that matters for anyone doing the same thing: the errors are not
random and they are not obvious. They are plausible, well-structured, internally
consistent, and wrong. They look exactly like the correct output, because they
were produced by the same process. You cannot spot them by reading for quality.
You spot them by checking claims against sources, which is slow, which is why you
must decide up front which claims are worth checking.

## Your brief will also be wrong

Mine was, in a way that mattered. One section confidently specified a redirect
mechanism that the platform does not actually support, and I found out by trying
to upload the file and getting an error.

<figure>
  <img src="/blog/write-the-brief-not-the-prompts/stamp.webp"
       alt="A worn wooden rubber stamp lying on a form, beside its own impression, which has been struck through with a single red line."
       width="1600" height="900" loading="lazy" />
  <figcaption>The confident paragraph is always the dangerous one.</figcaption>
</figure>

Which sounds like an argument against writing briefs, and is the opposite. The
error was in one place, with a number on it, so I corrected it in one place and
left a dated note saying what it used to claim. Ten minutes.

Now picture the same decision living where most decisions live: in a chat thread,
four hours deep, between a question about favicons and a tangent about something
else entirely. It would not have been wrong. It would have been *gone*. And when
the redirects failed on cutover day, the debugging would have started from
nothing, because nobody would remember what we agreed to build or why.

A written decision can be found, dated, blamed and fixed. An unwritten one can
only be reconstructed under pressure, which is the expensive way to learn what
you used to think.

## What to steal

- **Write the non-negotiables before the nice-to-haves.** Six numbered
  constraints beat six pages of vision.
- **Make every acceptance criterion mechanical.** If you cannot check it while
  tired, it is not a criterion.
- **Put the spec in the repo, not the chat.** Then it survives your memory, your
  session, and your choice of model.
- **Decide in advance which claims you will verify.** The agent's mistakes look
  like its successes.
- **Ship the verification, not just the thing.** The migration took two days. The
  script that re-proves it takes three seconds and will still work next year.

<figure>
  <img src="/blog/write-the-brief-not-the-prompts/home.webp"
       alt="The homepage of the rebuilt mityjohn.com, with the headline 'What happens when curiosity gets root access' above eight numbered level cards and a row of counters."
       width="1395" height="1110" loading="lazy" />
  <figcaption>Eight numbered levels, because the brief specified structure and said nothing about tone.</figcaption>
</figure>

The site you are reading this on has 38 posts, 15 apps, a picture book in four
languages, every old link still resolving, and a mobile performance score in the
nineties. It also has an arcade animation between every section, because the
brief said nothing about restraint and I chose to read that generously.

The brief is still in the repo. It is the most useful file in the project, and it
contains no code at all.
