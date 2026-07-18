---
title: "Typix: Personality Assessments Meet Vibe Coding"
date: 2025-05-30T14:25:36
updated: 2025-05-30T15:27:36
tags: ["development", "generative-ai", "personality", "programming", "vuejs", "ai", "fun"]
cover: "/wp-content/uploads/2025/05/ChatGPT-Image-30-mei-2025-16_21_40-768x768.webp"
cardTag: "Development · GenAI"
wpId: 483
wpSlug: "typix-personality-assessments-meet-vibe-coding"
---

> “It was a public holiday (Ascension Day), and instead of doing absolutely nothing, I decided to build something… just for the fun of it.”

Meet **[Typix](http://typix.mityjohn.com)** — a playful yet functional experiment in building a free personality assessment tool, powered by AI-driven development, curiosity, and a healthy disregard for overpriced quiz platforms.

![](/wp-content/uploads/2025/05/image-9-1007x1024.webp)

I’ve always been fascinated by personality assessments. They’re part psychology, part storytelling — and always a good catalyst for conversation. I wanted to do one with the family, but every option I found felt… wrong. Too commercial, too scattered, or just way too expensive.

_So I built my own._

Typix was born in a few hours thanks to the latest wave of AI tooling. Think of it as “vibe coding”: a mix of exploration, iteration, and interaction with AI agents.

## Bolt.DIY: Your AI Pair (and Sometimes Solo) Programmer

To bring Typix to life, I used **Bolt.DIY**, an experimental AI coding companion powered by **Claude Sonnet 4**. Think of it as a supercharged project starter that builds full applications from natural language prompts.

![](/wp-content/uploads/2025/05/image-4-1024x434.webp)

You tell Bolt what you want — the stack, the features, maybe even the aesthetic — and it scaffolds the whole project for you. Not just a single file or function, but actual working apps with components, routes, state management, and deployment support.

Some key things Bolt.DIY handled in Typix:

-   Vue 3 + Vite project setup with routing
-   Internationalization scaffolding
-   Dynamic question forms and data flow
-   Integration of Tailwind for styling
-   GitHub Pages deployment support

It’s not always perfect. Sometimes you wait. Sometimes you need to nudge it back on track. But when you batch requests and define your stack clearly upfront, it flies.

Pro tip: ask for things like “add mobile responsiveness, enable Vue I18n, set up routing with nested views, and make the layout playful and responsive” — in one go.

## Typix: Under the Hood

While Bolt handled scaffolding, I brought in **GPT-4o** (using chatGPT) to generate high-quality questions for each of the assessments. These questions are lightweight, intuitive, and designed to provide insight without needing a PhD in psychometrics.

Typix currently supports three models:

### 1\. **DISC**

The classic 4-quadrant model that categorizes people into:

-   **Dominance**: results-driven, assertive
-   **Influence**: persuasive, social
-   **Steadiness**: calm, supportive
-   **Conscientiousness**: analytical, precise

![](/wp-content/uploads/2025/05/image-8-768x890.webp)

### 2\. **Typix Discovery**

Based on the **personality theory of Carl Gustav Jung**, a Swiss psychiatrist and psychologist. Jung introduced the concept of **psychological preferences**, describing how individuals perceive the world and make decisions. He identified four primary functions:

-   **Thinking**
-   **Feeling**
-   **Sensing**
-   **Intuition**

Combined with the attitudes **introversion** and **extraversion**, these lead to **eight psychological types**.  
Typix Discovery visualizes this on a circular chart, showing the dynamic balance of cognitive preferences in color-coded energy levels. It’s inspired by Jung’s framework, not affiliated with any commercial system.

![](/wp-content/uploads/2025/05/image-6-667x1024.webp)

### 3\. **Enneagram**

A model that describes nine distinct personality types, each with its own set of motivations, fears, and growth paths. The Enneagram is particularly useful for understanding internal drivers and emotional patterns.  
The types include:

-   The Reformer
-   The Helper
-   The Achiever
-   The Individualist
-   The Investigator
-   The Loyalist
-   The Enthusiast
-   The Challenger
-   The Peacemaker

Typix provides a simplified questionnaire and results breakdown to help users recognize their dominant type and core traits.

![](/wp-content/uploads/2025/05/image-10.webp)

## Vibe Coding in Practice

The process was fluid and creative. I bounced between Copilot’s **agent mode** and **edit mode**, depending on whether I needed help structuring a Vue component or just nudging some styles. Meanwhile, GPT-4.1 (while using Copilot within Visual Studio code) helped me write dynamic SVG-based visualizations — the Typix Discovery circle and the Enneagram spider chart were both AI-assisted, handcrafted renderings.

And yes, during slower agent moments in Bolt, I flipped back to VS Code to tweak logic, add transitions, or just learn more about Jungian archetypes.

---

## Reflections: The Future of Development

Typix isn’t just a side project. It’s a sign of a new era in how we build software.

We’re not just writing code anymore. We’re designing ideas and shaping interactions with the help of intelligent collaborators. As developers and designers, our roles are becoming more expressive, more conceptual — and strangely, more human.

### What This Means for Developers and Designers

-   **Developers become orchestrators**: You still need to understand architecture and flow — but the hands-on keyboard work is increasingly done through conversations with tools.
-   **Designers become builders**: With the right language, visual thinkers can bring layouts, animations, and interaction flows directly to life.
-   **It’s not about coding faster — it’s about imagining better**: The real value lies in what you ask the system to build, and how you adapt and refine the result.

---

Typix was built on a quiet Thursday in May. No deadline. No pressure. Just the joy of building something that didn’t exist that morning. With the tools we now have, coding can feel like jamming — fluid, imperfect, and unexpectedly beautiful.

Check it out, remix it, or better yet: build your own.  
[Typix on GitHub Pages (typix.mityjohn.com)](https://janvanwassenhove.github.io/Typix/#/)

---

**References**

-   Bolt.DIY [https://github.com/stackblitz-labs/bolt.diy](https://github.com/stackblitz-labs/bolt.diy)
-   Github repo [https://github.com/janvanwassenhove/typix](https://github.com/janvanwassenhove/typix)
