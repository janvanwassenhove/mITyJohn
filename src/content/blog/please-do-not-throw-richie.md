---
title: "Please Do Not Throw Richie"
date: 2026-10-10
tags: ["games", "ai", "devoxx", "development"]
cover: "/blog/please-do-not-throw-richie/cover.webp"
cardTag: "Games · Devoxx"
draft: false
---

Richie has a keynote in ten minutes. It is in Auditorium 8, upstairs, at the far
end of Kinepolis Antwerp. Richie is down at registration.

Richie has no legs.

<figure>
  <video data-loop muted loop playsinline preload="none" width="960" height="540"
         poster="/blog/please-do-not-throw-richie/race-poster.webp"
         aria-label="Animation: four robots line up at registration under the line everybody has somewhere to be. Three of them walk off to the keynote; Richie, who has no legs, stays where he is.">
    <source src="/blog/please-do-not-throw-richie/race.mp4" type="video/mp4" />
  </video>
  <figcaption>From the keynote. Everybody has somewhere to be; three of them can
  walk there.</figcaption>
</figure>

Devoxx Belgium ran a game competition this year, the Robot Games, and the brief
was the conference's three robots — Voxxy, Droid and Biggy — in this building. I
happen to have a fourth robot. It sits on my desk, runs [AURA](/apps/aura/),
answers to Richie, and has a head that turns every way yours does, two antennae,
and nothing whatsoever to walk with.

So I entered, and on 8 October I showed the result in Stephan Janssen's Robot
Games session. This is that talk, written down, with the parts that did not fit
into four minutes.

## One move

Richie can do exactly one thing, and it is hop. Hold Space, his head sinks into
the shell, a meter labelled *questionable potential* fills up, and you let go.

<figure>
  <video data-loop muted loop playsinline preload="none" width="960" height="540"
         poster="/blog/please-do-not-throw-richie/hop-poster.webp"
         aria-label="Gameplay: Richie, a small white robot, hops from the registration desk into the exhibition hall past conference visitors, each landing marked BONK, until a security guard's red vision cone appears on the floor.">
    <source src="/blog/please-do-not-throw-richie/hop.mp4" type="video/mp4" />
  </video>
  <figcaption>The entire movement repertoire. Registration to the exhibition
  floor, one bonk at a time.</figcaption>
</figure>

Then the floor runs out, and the other robots offer to help in the way robots
help. Voxxy picks Richie up, aims, and throws him across the gap. Biggy reverses,
builds momentum and hits him onto the next floor. In the auditorium Droid
reclines a cinema seat, twice politely, and then switches to eject mode.

<figure>
  <video data-loop muted loop playsinline preload="none" width="960" height="540"
         poster="/blog/please-do-not-throw-richie/voxxy-poster.webp"
         aria-label="Gameplay: Voxxy, an orange robot, stands under a sign reading Voxxy can help, picks Richie up and throws him over a gap; he lands at the foot of the grand staircase as the words the title was a suggestion appear.">
    <source src="/blog/please-do-not-throw-richie/voxxy.mp4" type="video/mp4" />
  </video>
  <figcaption>Voxxy's assist, with the game's own commentary arriving
  mid-flight.</figcaption>
</figure>

By the end you are flinging a research robot into a crowd of developers and
hoping they catch. The title was never a warning. It was a suggestion — which,
for the record, is also what the game tells you while Richie is in the air.

## Why it is called that

Security. Guards patrol the building with their vision cones drawn on the floor.
When one of them sees you the cone turns red, an exclamation mark appears over
their head, and then they run.

<figure>
  <video data-loop muted loop playsinline preload="none" width="960" height="540"
         poster="/blog/please-do-not-throw-richie/security-poster.webp"
         aria-label="Gameplay: a guard spots Richie in the exhibition hall under the words Hey, no robots; the guard catches him, carries him off, and Richie lands back at registration under the words escorted out.">
    <source src="/blog/please-do-not-throw-richie/security.mp4" type="video/mp4" />
  </video>
  <figcaption>Hey, no robots. Escorted out, back one checkpoint, and the
  checkpoint goes with you.</figcaption>
</figure>

Line of sight is a real ray cast against the venue's walls, so a booth between
you and a guard is a hiding place rather than decoration, and the exhibition hall
needs a route rather than a direction. The results card keeps count, under
*escorted out*, a few lines below *unintended stair descents* and
*coffees destroyed*.

My own best run is about a minute and a half. On stage I invited the room to beat
it, which is the kind of thing you say before you have thought about how many
people in a Devoxx audience own a phone and a competitive streak.

## A game that could not walk there either

Here is the uncomfortable parallel. The game could not get itself to the stage
either. It got thrown.

<figure>
  <video data-loop muted loop playsinline preload="none" width="1280" height="720"
         poster="/blog/please-do-not-throw-richie/checkpoints-poster.webp"
         aria-label="Slide animation titled five checkpoints to release: a small cartoon Richie hops along a route of five checkpoints, and at each one a card rises in — registration, ChatGPT, a brainstorm and a brief of 1,800 lines; exhibition floor, Codex with GPT-6 Astra, the physics, the hop and the route; grand staircase, Claude Code with Opus 5.5, robots, venue, security and finale; cinema corridor, ChatGPT image generation, booths and Duke, driven by Claude; auditorium 8, Sonic Pi plus AI, Synaptic Drift. A different booth poster appears above Richie at every stop.">
    <source src="/blog/please-do-not-throw-richie/checkpoints.mp4" type="video/mp4" />
  </video>
  <figcaption>From the Robot Games talk: five checkpoints, one booth each. Rubber
  Duck AI listens and judges; the Robo-Barista 9000 now comes with 40% fewer
  burns.</figcaption>
</figure>

**First the brief.** A brainstorm with ChatGPT turned into a design brief of
around eighteen hundred lines: the route, the robots, the physics, the jokes. It
is in the repository, and everything that came after was held up against it.

**Then Codex, with GPT-6 Astra, for the physics.** The first iteration had one goal, recorded in
the development log with admirable economy: *SPACE → BOING → BONK*. A fixed-step
Rapier world, a charged hop, a little control in the air, and getting up again
after a tumble.

**Then Claude Code, on Opus 5.5, for nearly everything else**: the venue, the three robots
rebuilt against the official Robot Games model sheets, Richie converted from
Pollen's real Reachy Mini geometry, the crowd, security, the finale, the hosting,
and a release pipeline that publishes a new version with screenshots on every
push.

**The textures came from ChatGPT image generation** — the grey exhibition
carpet, the confetti carpet upstairs, booths selling robot gadgets nobody asked
for — with Claude Code driving the prompts through my own ChatGPT session. I did
not drive. Self-driving, all the way down.

**And the music is mine.** The track is *Synaptic Drift*, written in Sonic Pi
code with [PiBeat](/apps/pibeat/) doing the generating, then recorded and
dropped into the game.

## How it runs

Every game is one loop, and this one is small enough to say out loud. You press
a key, or tap the screen — the touch buttons press the same keys, so the physics
never knows which device it is on. Rapier moves the world: gravity, the hop,
Richie bouncing off whatever is in the way. Three.js draws the picture. Then
round again, sixty times a second, about seventeen milliseconds a lap.

<figure>
  <video data-loop muted loop playsinline preload="none" width="1280" height="720"
         poster="/blog/please-do-not-throw-richie/architecture-poster.webp"
         aria-label="Slide animation titled one loop, sixty times a second: three steps joined by arrows that draw themselves into a circle — step 1, you press, keyboard or touch; step 2, the world moves, Rapier physics, gravity, hops and bumps; step 3, you see it, Three.js draws the picture — with sixty times a second, one lap about 17 milliseconds, in the middle and dots running round the loop. On the right, who lives in that world: Richie, Voxxy, Biggy and Droid, security, and Kinepolis. Along the bottom: built with TypeScript and Vite; every push tests, builds and releases to GitHub Pages; in your browser, no backend, offline.">
    <source src="/blog/please-do-not-throw-richie/architecture.mp4" type="video/mp4" />
  </video>
  <figcaption>The architecture, as it was on the slide: one loop, and everything
  else lives inside it.</figcaption>
</figure>

Everything else — Richie, the three robots, security, the building — lives
inside that loop. It is TypeScript, built with Vite, and all of it runs in the
browser: no backend, no account, and after the first visit no network either,
which is handy on a train and essential at a conference where the Wi-Fi belongs
to everybody. Every push to GitHub tests it, builds it, cuts a release and puts
it live on GitHub Pages by itself.

## What the tools did not catch

The generated code was good. The interesting part of the development log is the
section headed *observed problems*, because almost none of those were found by
whatever wrote the code.

**The black frame.** With bloom switched on, most of the frame went black. The
obvious suspect was overflowing highlights. It was NaN: Richie's simplified mesh
carried a few dozen zero-length normals, each one a single black pixel nobody had
ever noticed, until a blur smeared them across the screen. It was found by
reading the bloom's bright-pass target back as raw half-floats and looking for
the NaN underneath Richie.

**The unreachable finale.** The end trigger fired again on every physics step and
reset the finale timer each time, so a real run could never reach the results
card. The finale was lovely. Nobody could get to it.

**The crowd that cheered too early.** The auditorium started out hyped, before
anything had happened. Not enthusiasm: the first animation frame could carry a
timestamp from before the game started its own clock, which made the first frame
delta negative and ran the excitement decay backwards.

**The screenshots that were not there.** The README images would have been
broken on GitHub while everything looked fine locally, because a `.gitignore`
line meant for one folder quietly matched every folder with that name.

And the human contribution was mostly the word *no*. The app icon went through
four flat mock-ups (*make Richie more realistic*), four photoreal renders (*more
app icon, not photorealistic*), and three in app-icon style, of which the two
funniest were combined: a security guard holding Richie by an antenna while his
coffee and croissant sail on. It is the picture at the top of this post. A
painted face texture for the crowd lasted about an hour, under the verdict
*these faces look really ugly*.

If you take one thing from this, take the shape of that log. For every iteration:
the goal, the tool, what it generated, what was observed to be wrong, and the
human decision. The last column is the one that turns a pile of generated code
into a game somebody actually chose to make.

## The finale

Get Richie to the stage and the other robots run in from the wings, the confetti
comes down, and the results card reports, with total sincerity, *against all
reasonable expectations: keynote ready*.

<figure>
  <video data-loop muted loop playsinline preload="none" width="960" height="540"
         poster="/blog/please-do-not-throw-richie/finale-poster.webp"
         aria-label="Gameplay: on the keynote stage, Richie and the other robots dance under falling confetti in front of a big Devoxx screen, with the words robots assemble and then keynote ready, before the results card appears.">
    <source src="/blog/please-do-not-throw-richie/finale.mp4" type="video/mp4" />
  </video>
  <figcaption>Robots assemble. The results card has been counting your
  faceplants the whole time.</figcaption>
</figure>

There is one more thing hidden in there. When the conference is over, the robots
are still in the building, and some of them have unresolved issues. That is
[Runtime Rumble](/apps/runtime-rumble/), the sister game: a fighter in the
tradition of the ones I lost far too many evenings to, with Richie in the roster
and room for two players on one keyboard.

## Play it, or watch me explain it

[Play it in your browser](https://janvanwassenhove.github.io/PleaseDoNotThrowRichie/)
— on a laptop with the keyboard, on a phone with a big HOP button, and offline
once you have installed it. The brief, the architecture and the whole
development log, failures included, are on
[GitHub](https://github.com/janvanwassenhove/PleaseDoNotThrowRichie). My four
minutes in the Robot Games session start at 29:40.

<button type="button" class="embed-facade" data-embed-src="https://www.youtube-nocookie.com/embed/NT0wyPM58G8?start=1779" data-embed-h="360" data-embed-provider="youtube"><span class="ef-glyph">▶</span><span class="ef-title">The Devoxx Robot Games</span><span class="ef-note">Loads youtube.com — nothing is requested until you click.</span></button>

No robots were harmed in the making of this game. Richie disagrees.
