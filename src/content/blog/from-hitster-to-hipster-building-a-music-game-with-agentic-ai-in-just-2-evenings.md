---
title: "From Hitster to Hipster: Building a Music Game with Agentic AI in Just 2 Evenings"
date: 2025-07-18T21:43:21
updated: 2025-07-19T12:46:16
tags: ["development"]
cover: "/wp-content/uploads/2025/07/ChatGPT-Image-18-jul-2025-23_42_39-768x768.webp"
cardTag: "Development"
wpId: 520
wpSlug: "from-hitster-to-hipster-building-a-music-game-with-agentic-ai-in-just-2-evenings"
---

At some point, we all hit that wall with a board game we love. For me, that was **Hitster**—a brilliant concept of guessing and ordering songs by release year. But after a few rounds, we ran out of cards… and noticed the playlist leaned heavily towards **Dutch (from the Netherlands)** songs.

As a Belgian (and Flemish), I just didn’t know many of them—and neither did my wife and kids. So I did what any slightly frustrated developer with a toolbox full of AI would do:

**I built my own.**

Welcome to **Hipster** – a fast-paced, web-based version of Hitster, lovingly crafted with **TypeScript**, **Vue.js**, and some serious AI help.

![](/wp-content/uploads/2025/07/image-5.webp)

**Play it now**: [hipster.mityjohn.com](http://hipster.mityjohn.com/)  
**Fork it here**: [GitHub: janvanwassenhove/Hipster](https://github.com/janvanwassenhove/Hipster)

## The Stack (and the Magic Behind It)

I kicked off the prototype using **[bolt.diy](https://bolt.diy)** – my go-to low-code prototyping tool for rapidly building logic flows and triggering actions.

From there, I co-developed the app with **Claude Sonnet 4**, which proved to be a powerful agentic AI partner. With clear instructions and task-oriented prompting, Claude generated reliable TypeScript and Vue 3 code with an uncanny sense of structure. Like having a junior dev who works at lightspeed and never goes on coffee break.

To streamline and autocomplete repetitive coding bits, I used **GitHub Copilot**. Especially handy in Vue components and managing state across the game.

Total dev time? Just **6 hours**, split across **two evenings**.

![](/wp-content/uploads/2025/07/image-2-606x1024.webp)

## How the Game Works

-   Each player takes turns guessing when a song was released, and placing it correctly on a growing **timeline**.
-   Songs are played using the **Spotify Web Playback SDK** or Web API.
-   A correct guess earns you **tokens** and **bonus points**.
-   The more songs added to the timeline, the harder it gets.

All state is stored locally in the browser, which makes it quick and simple to play with friends—no login or database needed (except for Spotify access).

## The Real MVP Struggle: Mobile Playback

While the AI side of this project felt like smooth sailing—rapid prototyping, fast iterations, and solid TypeScript generation—the real test wasn’t with Claude or Copilot.

**It was getting Spotify playback to work reliably on mobile.**

![](/wp-content/uploads/2025/07/image-3.webp)

That’s where years of **developer grit** and **architectural experience** kicked in.

-   The **Spotify Web Playback SDK** only works on **desktop browsers**.
-   On mobile, you’re forced to fall back to the **Spotify Web API**, which can only control external devices—so playback has to happen in the **native Spotify app**.
-   Add to that: autoplay restrictions, token handling, device activation quirks, and iOS’s delightful habit of blocking anything that looks remotely fun.

AI didn’t magically solve that. I had to **design around limitations**, handle edge cases, and build in fallback flows that keep the game experience snappy—even if the user is being bounced between browser and app.

In short: **AI accelerated the build**, but **human experience made it playable**.

## Deployed via GitHub Pages

To keep the project lean and serverless, I deployed Hipster using **GitHub Pages**. Everything runs client-side:

-   Vue.js frontend
-   Spotify authentication and playback
-   Local storage for game state

No backend, no hosting fees, and just a few seconds to load up the game.

You can play it now at:  
[http://hipster.mityjohn.com](http://hipster.mityjohn.com)

## Why I Built This

-   Because **Hitster** ran out of cards too quickly.
-   Because I wanted a playlist that included more **Flemish** songs I actually knew.
-   Because building playful, personal tools with AI is too fun not to do.

What started as a mid-week hack quickly became a working game—and a great demo of how accessible solo software projects can become with the help of AI copilots and agents.

## Bonus Round: Remix It

Want to fork it? Add your own playlist logic? Translate it to your language (other thand Dutch, German, English or French) or apply your own style?

It’s open source and ready to remix:  
[https://github.com/janvanwassenhove/Hipster](https://github.com/janvanwassenhove/Hipster)

Let’s make the next wave of casual games—AI-built, fast, fun, and tailored to the players!
