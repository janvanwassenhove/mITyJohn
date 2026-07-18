---
title: "Code, Chaos & Copilots: The Tech Magic Behind Hockey Madness"
date: 2025-11-30T22:42:16
tags: ["generative-ai", "hockey", "vuejs", "ai", "development"]
cover: "/wp-content/uploads/2025/11/5373fbbb-de96-4aef-9ec6-1b1fc999f67f-768x768.webp"
cardTag: "GenAI · Hockey"
wpId: 603
wpSlug: "code-chaos-copilots-the-tech-magic-behind-hockey-madness"
---

At first glance Hockey Madness looked like a playful festival, but behind the confetti there was an awful lot of code. Turning a multi‑match tournament into an interactive experience required live scorekeeping, authentication, rule management and mobile controls for coaches.

![](/wp-content/uploads/2025/11/startscherm-1-980x1024.webp)

Think of it as building a game engine and a broadcast studio in your browser. In this post we peek behind the curtain — spreadsheets and all — to see how the system was architected and how modern tools like Supabase and GitHub Copilot helped us ship quickly without losing our sanity (or our sense of humour).

## From idea to architecture

The first decision was to use a **Vue 3** frontend with Vite and Tailwind CSS. Vue’s composition API allowed us to organise complex state (scores, timers, boosters) into reusable functions, while Tailwind made it easy to match HC Lokeren’s colours and adapt the layout for laptops, tablets and phones.

For the backend we chose **Supabase**, an open‑source Firebase alternative that offers Postgres storage, authentication, auto‑generated REST/GraphQL APIs and **real‑time subscriptions out of the box**. This meant we could build a live scoreboard without managing WebSocket servers or custom authentication flows.

![](/wp-content/uploads/2025/11/match_control-920x1024.webp)

### Real‑time scores and boosters

At the heart of the app lies a **match‑control dashboard** for officials. When an official adds a goal, penalty corner or card, the change is sent to Supabase via a simple `INSERT` or `UPDATE` and then propagated to all connected clients through the real‑time channel. Similarly, when a booster is activated, a record is created in a `boosters` table with its team, effect and expiration time. Subscribed clients update their UI instantly, which is how the public scoreboard displays active boosters and countdown timers. The use of Postgres triggers ensures that effects expire automatically — once a `boosters` row’s `expires_at` is in the past, a cron function cleans it up and broadcasts a “booster removed” event.

![](/wp-content/uploads/2025/11/scoreboard_2-1-1024x656.webp)

The match controller also supports **Maddies**, which modify multiple aspects at once. A single “Maddie started” event notifies the crew to place extra goals or swap balls on the pitch. After the effect ends, the system resets the rules and normal play resumes. This reactive design kept our codebase cohesive: all time‑based effects relied on the same subscription mechanism, whether they lasted fifteen seconds or two minutes.

![](/wp-content/uploads/2025/11/booster_countdown-768x711.webp)

### Draft automation and rules engine

The pre‑tournament **draft** was automated using a small service that keeps track of which coach goes first in each round and handles bidding. Each bid event validates the coach’s credit balance, compares bids and adjusts credits accordingly. Coaches can view their remaining credits on a live dashboard while making decisions; once a bid is accepted, the player’s team assignment updates for everyone to see.

## Managing rules with data

Instead of hardcoding regulations, we built a **rule editor** where admins can define and reorder cards for game rules, boosters and Maddies. Each rule includes a description, a category and a position in the list.

The public “game guide” reads from this dataset, so when we tweak a rule, it updates everywhere instantly. We also store metadata like whether a booster has a countdown and who may activate it. This flexible approach means we can add new Maddies (like **Sniper** or **Golden Oldies**) without redeploying the client.

![](/wp-content/uploads/2025/11/rules_control-948x1024.webp)

![](/wp-content/uploads/2025/11/gameguide-1018x1024.webp)

Coding with AI: Copilot as pair programmer

Writing a full tournament system from scratch could have been a slog, but **GitHub Copilot** acted as our silent partner. Copilot uses OpenAI Codex to **suggest code and entire functions in real time**.

In practice, this meant we could stub out a Vue component and Copilot would propose the reactive variables, API calls and event handlers we needed. When building the Supabase queries, Copilot often generated the SQL and TypeScript definitions, saving us a lot of typing. Of course, we still reviewed and refined the output, but it accelerated development and freed us to focus on game design.

### Building tournaments like Lego

Hockey Madness isn’t a one‑size‑fits‑all event; some evenings call for a simple round‑robin, others need a group stage followed by knock‑out rounds. To accommodate this, we built a **tournament builder**. Each phase (poule, bracket or single match) is stored with attributes like number of groups, teams per group and advancement criteria.

![](/wp-content/uploads/2025/11/tournament_builder-924x1024.webp)

![](/wp-content/uploads/2025/11/tournament_creation-1.webp)

Phases are ordered, and the bracket generator uses that sequence to create match schedules. Admins can drag and drop phases and configure them through a form.

### Lessons learned

-   **Real‑time is a game‑changer** – Using Supabase’s subscriptions allowed us to build responsive interfaces without deep WebSocket expertise. Even coaches on mobile devices could trigger boosters and see their effects instantly.
-   **State management matters** – Keeping the app’s state in sync across multiple components and devices was challenging. We used Vue’s built‑in `provide/inject` and a few helper composables to centralise timers, scores and boosters.
-   **AI helps but doesn’t replace us** – GitHub Copilot wrote a surprising amount of boilerplate code, but human oversight remained essential, especially when integrating with Supabase or handling edge cases (like simultaneous booster activations).
-   **Configurable rules are powerful** – By storing rules in the database, we could adjust the game on the fly and reuse the same app for different events. Want to run a “penalty corners count triple” night? Just add a new rule card.

## Final whistle

Hockey Madness was an experiment in **rapidly infusing fun and gamification into a traditional sport** — and it worked. The combination of a well‑structured Vue/Supabase stack, an AI pair programmer and a community of enthusiastic coaches and players produced a seamless experience.

Instead of replacing the sport, we layered surprises and power‑ups on top of it. Whether you’re running a friendly league or dreaming up the next big sporting spectacle, the lessons from Hockey Madness show that with the right tools and a bit of creative chaos, adding extra fun is completely within reach.

---

**Links**

App [https://janvanwassenhove.github.io/sportsmadness](https://janvanwassenhove.github.io/sportsmadness)

Github Source Code [https://github.com/janvanwassenhove/sportsmadness](https://github.com/janvanwassenhove/sportsmadness)

> [Hockey Madness: Celebrating Ten Years with Chaos and Charm](/blog/hockey-madness-celebrating-ten-years-with-chaos-and-charm/)
