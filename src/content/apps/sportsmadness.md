---
name: "Sports Madness"
code: "SPORT"
tag: "fun"
cat: "fun"
blurb: "Gamification, creativity & real-time control for literally any sport."
repo: "SportsMadness"
demoUrl: "https://janvanwassenhove.github.io/SportsMadness"
order: 9
wpId: 640
wpSlug: "sportsmadness"
---

## Bringing Gamification, Creativity & Real-Time Control to Any Sport

**Sports Madness** (initially **Hockey Madness**) is a modular game format that adds chaos, creativity and strategic fun to traditional sports.  
Instead of rewriting the sport itself, Sports Madness introduces **short-lived game modifiers** — “boosters” and “maddies” — that temporarily change the rules and transform matches into energetic, unpredictable experiences.

![](/wp-content/uploads/2025/11/51781271-e481-4a68-83ed-36a438f791fd-1-1024x768.webp)

Originally designed for indoor field hockey, the concept has proven flexible enough to adapt to:

-   football/futsal
-   korfball
-   handball
-   basketball
-   volleyball
-   racket sports
-   and youth training formats

This page explains the general concept and how the **SportsMadness App** brings the game mode to life.

---

### What _is_ Sports Madness?

Sports Madness is built around one core idea:

> **A traditional match stays fully recognizable… until a short-lived modifier is triggered.**

These modifiers come in two categories:

**Maddies**

**Game-wide rule changes** imposed for a short period — usually 30 to 120 seconds.

Examples across different sports:

-   **Double Trouble** – two balls in play
-   **Power Play** – 1 opposing player must leave the field
-   **Golden Time** – all goals/points count double
-   **Supersize / Minisize** – larger or smaller goals, nets or zones
-   **Trick Mode** – players must perform the action (pass/shot/dribble) using a predefined variation
-   **Specialist Duel** – 1v1 showdown between selected players
-   **Chaos Mode** – rotating rule changes every 10 seconds

Maddies shift the rhythm of the game and create strategic decision moments.

**Boosters**

**Team-specific advantages**, triggered at key tactical moments.

Examples:

-   **Lucky Shot** – next goal/point counts extra
-   **Wingman** – an extra player joins
-   **Silent Mode** – opponent may not communicate
-   **Precision Play** – bonus points for hitting a small target
-   **Timeout Override** – immediate team timeout

Boosters give coaches agency and timing-based strategy.

### Activation Flow

Every modifier (maddie or booster) follows a clear flow:

1.  **10/15s countdown**
2.  **Audio + visual cues**
3.  **Start signal**
4.  **Effect duration**
5.  **End signal**
6.  **Automatic cleanup**

This keeps players, coaches and referees aligned at all times and ensures the match remains safe and structured.

### The SportsMadness App

A real-time web application built to control the full game experience.

**Live App:** [https://janvanwassenhove.github.io/sportsmadness](https://janvanwassenhove.github.io/sportsmadness)  
**Source Code:** [https://github.com/janvanwassenhove/sportsmadness](https://github.com/janvanwassenhove/sportsmadness)

The SportsMadness app provides:

#### **Match Control Dashboard**

Used by organizers/referees to:

-   add goals/points
-   track penalties or fouls
-   trigger maddies
-   track booster activation
-   show all countdowns
-   control game time
-   manage on-court events

Everything updates in real time to every connected screen.

![](/wp-content/uploads/2025/11/match_control-1-920x1024.webp)

#### **Professional-Looking Scoreboard**

Ideal for:

-   projectors
-   TV screens
-   LED walls

Shows:

-   score
-   timers
-   active effects
-   icons
-   warnings
-   booster/maddie countdowns

Designed for fast readability from a distance.

![](/wp-content/uploads/2025/11/scoreboard_2-2-1024x656.webp)

#### **Coach Mobile Booster Control**

Coaches get a mobile interface that lets them:

-   activate boosters at strategic moments
-   see cooldowns
-   monitor game state
-   avoid conflicts with active maddies

The app prevents “illegal” activations and ensures safe timing.

#### **Tournament Builder & Scheduling**

The platform includes:

-   team creation
-   player lists
-   match schedules
-   automated results
-   multicourt support

Everything runs browser-only — no installation, no servers.

#### Technical Overview (General)

-   **Frontend:** Vue 3
-   **Backend:** Supabase (authentication + realtime channels)
-   **Architecture:** event-driven game engine
-   **Data flow:** reactive UI + real-time sync for all clients
-   **Mobile controls:** optimized for touch
-   **Deployment:** GitHub Pages + Supabase

Flexible enough to support **multiple sports**, **different rule packs**, and **custom game modes**.

![](/wp-content/uploads/2025/11/tournament_builder-1-924x1024.webp)

---

## Why Sports Madness?

Because adding gamified moments doesn’t replace the sport —  
it **amplifies** it.

Sports Madness lets organizers:

-   boost player engagement
-   add humor and unpredictability
-   create memorable moments
-   make youth tournaments more fun
-   create festival-style “show matches”
-   test new formats safely

And for developers or architects, it’s a showcase of how **sport + real-time tech + gamification** can come together in one seamless experience.

---

App [https://janvanwassenhove.github.io/sportsmadness](https://janvanwassenhove.github.io/sportsmadness)

Github Source Code [https://github.com/janvanwassenhove/sportsmadness](https://github.com/janvanwassenhove/sportsmadness)

> [Hockey Madness: Celebrating Ten Years with Chaos and Charm](/blog/hockey-madness-celebrating-ten-years-with-chaos-and-charm/)

> [Code, Chaos & Copilots: The Tech Magic Behind Hockey Madness](/blog/code-chaos-copilots-the-tech-magic-behind-hockey-madness/)
