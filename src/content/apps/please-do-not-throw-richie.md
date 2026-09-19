---
name: "Please Do Not Throw Richie"
code: "RICHIE"
tag: "game"
cat: "games"
blurb: "Richie has a keynote in ten minutes and no legs. Hop him, get Voxxy to throw him and Biggy to hit him, and get him from registration to the stage. A Devoxx physics game for the browser."
repo: "PleaseDoNotThrowRichie"
demoUrl: "https://janvanwassenhove.github.io/PleaseDoNotThrowRichie/"
order: 1
isNew: true
---

**An irresponsible physics game for the Devoxx Belgium Robot Games.** Richie is due on the keynote stage upstairs, at the far end of Kinepolis Antwerp. Richie is down at registration. Richie has no legs, no wheels and no arms — two expressive antennae, an unfortunate relationship with gravity, and one move:

**Hop.**

So you hop. Then the floor runs out and Voxxy offers to *throw* him. Then a wall turns up and Biggy offers to *hit* him. Then a cinema seat reclines, twice politely, and ejects him across the room. By the end you are flinging a research robot into a crowd of developers and hoping they catch.

The title was never a warning. It was a suggestion.

## The expedition

| Robot | What it does to Richie |
| --- | --- |
| **Richie** | Hops. Tumbles. Faceplants. Gets up. |
| **Voxxy** | Picks him up, aims, and launches him across the gap. |
| **Biggy** | Reverses, builds momentum, and hits him into the next floor. |
| **Droid** | Reclines a cinema seat. Then **eject mode**. |

Richie is the real [Reachy Mini](https://github.com/pollen-robotics/reachy_mini) geometry — the same robot that sits on my desk running [AURA](/apps/aura/), under the same name. Voxxy, Droid and Biggy are built from the official [Robot Games model sheets](https://game.devoxx.be/references.html).

## The route

Registration, the exhibition floor, Voxxy's gap, the grand staircase, Biggy's launch, the cinema corridor, the auditorium, the crowd, the stage — with checkpoints along the way, so a mistake costs seconds rather than the run. The escalators beside the staircase actually run, which leaves you a choice at the bottom: ride up slowly and safely, or hop the steps and find out exactly how far down they go.

And security gives chase: four guards with real vision cones and real line of sight, who throw back.

## Play it

One build, two editions: on a laptop it is keyboard and mouse with the full lighting pass; on a phone the controls rebuild themselves around a stick and a big **HOP** button. *Add to Home Screen* installs it, and after one visit it plays with no signal at all.

No account, no backend, no app store. **[Play it in your browser](https://janvanwassenhove.github.io/PleaseDoNotThrowRichie/)** — and the brief, the architecture and an honest log of how it was built with AI, failures included, are all in the [repository](https://github.com/janvanwassenhove/PleaseDoNotThrowRichie).
