---
title: "Inside HockeyEleven: A Match Is a Function"
date: 2026-11-04T09:00:00
tags: ["games", "hockey", "architecture", "development"]
cover: "/blog/inside-hockeyeleven/cover.webp"
cardTag: "Games · Architecture"
draft: false
---

A match of [HockeyEleven](https://hockeyeleven.com/) is a function. Give it a seed
and a list of button presses and it returns the same match, down to the last bit,
in any browser, on any machine, as often as you like.

That sounds like the kind of thing an architect says to avoid discussing the
goalkeeper. It is, however, the one decision that nearly everything else in this
game leans on. [Rolled Into Hockey](/blog/rolled-into-hockey/) is why the thing
exists. This is how it is built, from the tick up to the stands.

<figure class="diagram">
  <div class="diagram-scroll"><img src="/blog/inside-hockeyeleven/engine-map.svg" alt="Architecture of HockeyEleven. You, the opening reel, Learn to play, online play and the tests all drive one match: a fixed step of one sixtieth of a second, seeded, with bit-identical maths and no pixels. Its state goes read-only to the rig, people, scene and picture. The Academy shares the rig and people with its own renderer and no running match; a workshop of offline tools delivers the numbers." width="1000" height="830" loading="lazy" /></div>
  <figcaption>The whole game on one page. Five very different things drive the same
  match, and none of them knows about the others.</figcaption>
</figure>

Look at what is on the top row. *You* are the obvious one. But the opening reel,
the match that plays behind the menu, is the same engine with nobody at the
controls: nothing is recorded, so it is different every time and adds nothing to
the download. Learn to play is the real simulation with a script holding a virtual
gamepad, so a lesson cannot drift away from how the game behaves. Online is two
copies of it, and the tests play full matches in every format.

None of that needed building. It was free the moment the match stopped caring who
was asking.

## One tick

The rule is short: the simulation moves in fixed steps of a sixtieth of a second,
whatever the screen is doing. The browser's frame time goes into an accumulator,
and `match.step()` runs as often as fits, which on a fast screen may be not at all
and on a slow one several times. Then the view draws once. It reads the state, and
nothing flows back.

<figure class="diagram">
  <div class="diagram-scroll"><img src="/blog/inside-hockeyeleven/one-tick.svg" alt="One tick. Every browser frame, elapsed time goes into an accumulator; while a step fits, match.step runs; then the view draws once and reads the state. Inside one step the fixed order is calls, stoppages, human actions, everybody moves, contact, the ball in 240 hertz substeps, strokes, and a snapshot into the replay buffer." width="1000" height="560" loading="lazy" /></div>
  <figcaption>The order inside a step is a contract. Swap two lines and the same
  seed and inputs give you a different match.</figcaption>
</figure>

Two details pay the rent here.

The ball runs in its own substeps at 240 Hz. A hard shot covers a lot of ground in
a sixtieth of a second, and without them it would simply appear on the far side of
the keeper, which goalkeepers have complained about since long before computers.

<figure>
  <video data-loop muted loop playsinline preload="none" width="960" height="540"
         poster="/blog/inside-hockeyeleven/corner-poster.webp"
         aria-label="A penalty corner in the game: attackers in red at the top of the circle, the ball played in and shot at goal, with defenders and the keeper waiting on the goal line.">
    <source src="/blog/inside-hockeyeleven/corner.mp4" type="video/mp4" />
  </video>
  <figcaption>A penalty corner: the moment a sixtieth of a second stops being
  enough.</figcaption>
</figure>

And the maths is not the browser's. IEEE 754 makes plus, minus, times, divide and
square root bit-identical on every engine, but `sin`, `cos`, `atan2`, `exp` and
`hypot` are library calls whose last bits differ between browsers. Nobody will ever
see those bits, until two machines run the same match and quietly stop agreeing
twenty minutes in. So the simulation has its own polynomial versions built only
from the exact operations. The renderer keeps `Math.*`, because a pixel is allowed
to have an opinion.

The simulation stores no sentences either. Its messages travel as keys, because the
game speaks six languages and a physics engine should not have to pick one. And it
took a while to find out that with this kind of random generator consecutive seeds
open alike, so a match started right after another began suspiciously like it.
Determinism is very good at being consistently wrong.

## Eleven players, one shape

Both teams play a shape rather than eleven individuals: a build-up model, a block
that stretches and squeezes, a press with a trigger, and a third-man run off the
ball.

The nice part is how you judge it, because a function can be run unattended. Sixty
full matches of AI against AI, overnight if need be, and you get actual numbers: a
possession of about five seconds and four passes, about four goals a match. The
rule I now hold myself to is that goals need at least those sixty matches before I
believe a change did anything. Below twenty or so it is pure noise, and I have
celebrated plenty of noise.

## From a dot to a person

To the simulation a player is a position, a speed, a heading and an action. There
is no body at all. Everything you see of a person is built on top of that, in a
fixed order, once per frame.

<figure class="diagram">
  <div class="diagram-scroll"><img src="/blog/inside-hockeyeleven/pose-stack.svg" alt="Five stages of a pose: the state, with no body at all; gait, legs and torso from measured curves blended by ground speed; planted feet, which stay put; a clip slerped over the parts it is about; and arms solved last onto the stick." width="1000" height="478" loading="lazy" /></div>
  <figcaption>The pose stack. The stick is the last thing solved, and it gets its
  way.</figcaption>
</figure>

The gait comes from public motion capture: a tool measures strides from the
recordings and boils them down to a handful of harmonics per gait. Only those
numbers ship, and the run blends between them by the speed the player actually has
over the ground. A second tool answers the question that matters, *does it run or
does it skate*, by measuring how far a foot slides while it is supposed to be
planted.

Strokes lie on top as clips, per bone and only on the parts they are about. Then
the arms are solved onto the stick, which runs against every instinct, since you
would think the hands hold the stick. In a game they don't. If the stick is not
where the ball says it must be, nothing else on screen matters.

<figure>
  <video data-loop muted loop playsinline preload="none" width="960" height="710"
         poster="/blog/inside-hockeyeleven/rig-poster.webp"
         aria-label="Two players in a one-against-one on a light blue court: the attacker in a striped shirt carries the ball on the stick while the defender in orange waits, knees bent, stick low.">
    <source src="/blog/inside-hockeyeleven/rig.mp4" type="video/mp4" />
  </video>
  <figcaption>The same rig the match uses, up close. A one-on-one from the
  Academy.</figcaption>
</figure>

## One clip, one movement

Then came the Academy, which needed movements good enough to teach from. Those are
not animated by hand. I fitted them myself, from video: one clip of someone doing the
skill properly goes in, the game's own skeleton is fitted onto it frame by frame, and
one file of plain numbers comes out. Nothing of the video ships.

<figure class="diagram">
  <div class="diagram-scroll"><img src="/blog/inside-hockeyeleven/video-to-motion.svg" alt="Turning a clip into a movement: detect 2D keypoints, the stick and the ball; fit the game's skeleton frame by frame under priors; export plain numbers; overlay the engine on the clip through the solved camera; pass a gate of error limits per body part, or go back to the fit; look at it from other angles; only then switch it on." width="1000" height="620" loading="lazy" /></div>
  <figcaption>A movement goes through a gate before it is allowed to teach
  anybody anything.</figcaption>
</figure>

The gate came from being fooled. The first pilot, a forehand, passed every 2D check
beautifully while the head of the stick floated twenty-two centimetres above the
ball. Filmed front-on you cannot see depth, and neither can a metric that lives in
that same picture. Hence the priors, and hence the last step: look at it from the
angles the camera never had.

The rest of the list reads like a police report. The fit once chose the rounded back
of the stick as the side to hit with, which every number was fine with, and which I
caught only because it looked wrong to someone who coaches. A long-lens
take turned a body ninety degrees in depth. A clip shivered until it got a final
pass for stillness. And a slow-motion factor has to be measured, because a label on
a video is merely a rumour about time.

<figure>
  <video data-loop muted loop playsinline preload="none" width="960" height="540"
         poster="/blog/inside-hockeyeleven/film-poster.webp"
         aria-label="An Academy film of a push at half speed: a player in a red kit, side view on a blue pitch, bends low and moves the ball forward without a backswing.">
    <source src="/blog/inside-hockeyeleven/film.mp4" type="video/mp4" />
  </video>
  <figcaption>What comes out the other end: the game's own skeleton, playing plain
  numbers.</figcaption>
</figure>

The Academy itself, by the way, runs no match at all. It shares the rig, the people,
the grounds and the rules data, but it has its own renderer, created when you walk in
and disposed of when you leave. A skill plays a motion file; a drill or a tactics
lesson plays a script. The game's most expensive assets turned out to be a very
cheap film studio.

## A person is a recipe

A player on screen is not a model somebody made. A person is a recipe: a set of
values on a shared base per gender, built from the open MakeHuman data. Faces and
features are baked once, when the person gets dressed, so afterwards they cost
nothing to draw. Hair and skirts have small simulations of their own, and there is a
layer for emotion, for the moments when it is justified.

That makes a full pitch of different people affordable, on condition that the far
ones are cheaper. A tool cuts lower-detail versions, which took a broadcast frame
from three million triangles to just over one. While measuring, the single heaviest
mesh turned out not to be a head or a hand, but the stick.

## The stadium, and the real loop

Around the people sits the scene: grounds drawn after real ones, nets that shake, a
hall floor that reflects, and a crowd that is one instanced figure with a small atlas
of shirts, moved entirely in the vertex shader. A quality ladder steps things down
when the machine is struggling.

<figure>
  <video data-loop muted loop playsinline preload="none" width="960" height="636"
         poster="/blog/inside-hockeyeleven/ground-poster.webp"
         aria-label="Aerial views of two hockey grounds in the game, each with a blue pitch, sprinklers running, stands full of people and the buildings and landscape around them.">
    <source src="/blog/inside-hockeyeleven/ground.mp4" type="video/mp4" />
  </video>
  <figcaption>Two of the grounds, with the sprinklers on. Every spectator is the
  same person in a different shirt. They are very loyal.</figcaption>
</figure>

<figure>
  <video data-loop muted loop playsinline preload="none" width="960" height="586"
         poster="/blog/inside-hockeyeleven/hall-poster.webp"
         aria-label="An indoor match in a hall with an orange wooden floor, white side boards and a full stand behind them, the players moving the ball around the circle.">
    <source src="/blog/inside-hockeyeleven/hall.mp4" type="video/mp4" />
  </video>
  <figcaption>Indoors: same engine, different rules, a floor that reflects.</figcaption>
</figure>

The lesson from this layer has nothing to do with hockey. Kick-off used to take a
second and a half, and now takes less than half of that, by throwing nothing away
until the next match has been drawn, and compiling shaders in the background. But
when a body loaded during a live match, spikes kept coming from its hands, and every
probe I wrote to catch that came back clean. They were measuring something that was
not the game. So now the rule is to verify in the real loop, not beside it. The same
goes for the black flash that turned out to be one single NaN pixel from one mesh:
you do not find that by reading code about it.

## Online: nobody sends the match

Here is where the opening sentence pays for itself. Two people playing online do not
exchange a match. They each run the whole thing, and all that travels is what the
function needs as input.

<figure class="diagram">
  <div class="diagram-scroll"><img src="/blog/inside-hockeyeleven/lockstep.svg" alt="Lockstep: host and guest both run the whole match from the same seed. Between them travel inputs of nine bytes and a checksum every thirty ticks; on a mismatch the host sends a snapshot. The link is direct over WebRTC with a Realtime channel as relay." width="1000" height="390" loading="lazy" /></div>
  <figcaption>Nine bytes of input, and a checksum to check that two browsers still
  believe in the same reality.</figcaption>
</figure>

A tick runs once both inputs for it are known. Your own input is scheduled a few
ticks ahead, so the other one has normally arrived by then. A checksum goes across
regularly, and if the two ever disagree, the guest takes a snapshot from the host and
carries on. It is the same discipline a team needs, except that it works.

## Around the engine

The rest is deliberately dull. The whole game is static files on Cloudflare Pages,
and it installs as an app and plays offline. An account only comes into it for online
play, the career and the Academy. `npm test` covers the rules, the physics, the
determinism and full matches in every format, and the checks run before anything
goes live.

## What I would steal from this

Make the core a pure function of its inputs, early, and be strict about it. It costs
you your own `sin` and some discipline about order. In return you get replays, a
tutorial, an attract mode, online play and overnight statistics, most of them without
writing them twice.

Then trust nothing that only measures itself. Put numbers on a movement, and then go
and look at it from the other side. Probe your frame times, and then check them in
the loop the player actually runs. Two of the nastier bugs here had excellent
metrics.

The stick has the final word in the rig, it has the heaviest mesh on the pitch, and it
was the thing floating twenty-two centimetres above the ball. I would like to say that
I saw that coming. I coach hockey. I should have.
