---
title: "Ghosts in the Machine: I built a haunted IT sim by inviting a ghost in"
date: 2026-07-18T16:19:48
tags: ["development"]
cover: "/wp-content/uploads/2026/07/ChatGPT-Image-18-jul-2026-18_12_01.png"
cardTag: "Development"
wpId: 941
wpSlug: "ghosts-in-the-machine-i-built-a-haunted-it-sim-by-inviting-a-ghost-in"
---

I spent a chunk of my evenings building a game about getting ghosts out of machines. I did it by putting one in.

![](/wp-content/uploads/2026/07/logo_title.png)

The game is called **Ghosts in the Machine**, and it is a browser-based management sim in which you run _NetherNet Solutions_, a paranormal IT support company. You build rooms in a haunted office building, hire staff of frankly questionable competence, and work an endless queue of support tickets.  
  
Real tickets, from the world we all actually live in, only slightly more honest: “Keyboard speaks only in umlauts.” “Printer produced a contract in blood-red toner.” You triage them in the Ticket Triage Desk, escalate the bad ones to the Debugging Chapel, and when the printer is beyond reason you send it to the Printer Exorcism Booth, which is a sentence I got to write as a feature and not as an incident report, for once.

![](/wp-content/uploads/2026/07/02-campaign-1024x576.png)

Ghosts in the Machine gameplay: an office floor plan with Triage, Patch and Debug rooms, resource counters across the top, and a scrolling incident log. _A quiet Tuesday at NetherNet Solutions: three rooms, one dangerously unstaffed Patch Containment Unit, and a client who hung up mid-wail._  

![](/wp-content/uploads/2026/07/03-gameplay-1024x576.png)

Under the hood it is deeply unglamorous in the way good things usually are: TypeScript, Vite, Phaser, fully static, saves in LocalStorage, no backend to page you at 3 AM. Twenty-two rooms, seventeen staff roles — the Bug Whisperer, the Scrum Necromancer, the Groundskeeper who tends the Oak of Undefined Behaviour — and twenty-four incident types that queue, escalate and mutate, because a single ghost is a bug and a population of ghosts is a distributed system. There is a coffee plantation. There is an audit by the Bureau of Digital Sanctity. My author bio for the project reads “Chief Exorcist of Undefined Behaviour and the only person who reads the logs after 2 AM,” and I stand by every word of it.

None of that is the interesting part. This is the interesting part: I have been building software for a long time, and somewhere in the making of a game about haunted machines, the way I work with the machine changed underneath me.

## The old ghost in the machine

![](/wp-content/uploads/2026/07/ChatGPT-Image-18-jul-2026-18_12_08-1024x576.png)

We have always had ghosts in our machines. You know them. The flaky test that passes on your laptop and fails in CI and passes again if you rerun it while holding your breath. The `@Ignore` someone added in 2019 with a comment that just says `// TODO: figure out why`. The config value that must be exactly `true` and not `"true"`, discovered at 02:14 on a Sunday. The undefined behaviour that isn’t a bug so much as a haunting — reproducible only under the full moon of production load.

Those ghosts are why the job has always had a nocturnal shift. They don’t show up in the demo. They show up later, quietly, and they read _your_ logs.

And for a while, working with AI on a codebase felt like acquiring one more of them. Helpful, occasionally uncanny, but fundamentally something you had to babysit. You wrote the séance line by line: _write me this function. Now this one. No, not like that. Add error handling. You forgot the null case. You invented an API that doesn’t exist._ It was autocomplete with ambitions and a tendency to hallucinate a library into being because it felt one _should_ exist. Useful, genuinely. But it was still you doing the thinking, one imperative instruction at a time, and the machine doing the typing.

## The séance changed shape

Then I built this thing with **Fable 5** — the new Claude model, the one sitting in the tier above Opus — and the ritual quietly rearranged itself.

I stopped writing the séance script line by line. I started describing what I wanted summoned.

Concretely: instead of “write a function that spawns an incident, here are the seventeen parameters,” the conversation became “incidents should queue, escalate if ignored, and occasionally mutate into a worse incident; here’s the tone, here’s the constraint that it stays fully static with no backend; go build it and check it holds together.” And it would go build it. Plan the shape, write across several files, run the thing, notice its own broken edge case, and fix it — before handing it back. Not “here is a snippet, good luck integrating it.” Here is a working slice of the game, tested against the constraints you actually gave.

The shift is not that it types faster. It’s that the unit of work got bigger. The prompt stopped being an instruction and became a **brief**. I moved from dictating steps to stating intent and constraints, and the model did the step-finding — the part that used to be entirely mine. You describe the world you want and the rules it must obey, and something on the other side does the disambiguation, the planning, the boring wiring, and — this is the part that still slightly unnerves me — the checking of its own work.

If the old model was a very fast junior who needed every step spelled out, this is less like giving instructions and more like briefing a competent colleague who occasionally, infuriatingly, has better taste than you do.

## What actually changed for me on this project

Three things, concretely, that you can steal on Monday.

**I write intent, not steps.** My prompts got shorter and my results got bigger. The leverage moved from _how_ to _what and why_. “Make the room-wear system feel like technical debt: cheap to ignore, expensive all at once” produced a better mechanic than any parameter list I would have dictated, because I described the _feeling_ and let it find the numbers.

**I let it run further before I look.** The old reflex was to interrupt after every function, because leaving the junior alone for ten minutes meant coming back to fan-fiction. The new reflex is to give it a whole vertical slice and review the result like a pull request, not like a hostage negotiation. You still review everything. You are still the senior engineer whose name is on it. But you are reviewing outcomes, not babysitting keystrokes.

**I moved my scepticism, I didn’t retire it.** This matters, so no joke here: a more capable model does not mean a less careful engineer. It means your attention relocates. You spend less effort forcing it to produce working code and more effort deciding whether the working code is the _right_ code. The taste, the architecture calls, the “no, we are not adding a backend just because it’s easier” — that is still entirely the job. The ghost is good. It is not accountable. You are.

That is the genuinely-many-steps-further part. Not a feature on a changelog. A change in where the human sits in the loop.

## The joke I couldn’t resist

![](/wp-content/uploads/2026/07/ChatGPT-Image-18-jul-2026-18_11_56-1-1024x576.png)

I did notice, somewhere around the Printer Exorcism Booth, that I was building a game about expelling malevolent, inexplicable presences from computers using an extremely capable, mostly-benevolent presence that lives in a computer. The Debugging Chapel wrote itself, in a manner of speaking.  
  
The difference between the old ghost and the new one is simple: the old one shows up when you least want it and refuses to explain itself. The new one shows up when you ask, does the work, and — crucially — is the one now reading the logs after 2 AM, so I don’t have to.

I’m keeping the title anyway. It was true before it was ironic.  

## Go and play it

Ghosts in the Machine title screen. 

![](/wp-content/uploads/2026/07/01-main-menu-1024x576.png)

_The title screen. It is the calmest this software will ever be._

_Ghosts in the Machine_ is real, it’s finished enough to be dangerous to your evening, and there’s a desktop build. The latest release is **v1.0.5**, with installers for Windows and macOS:

-   Windows: `GhostsInTheMachine-1.0.5-win-x64.exe`
-   macOS (Apple silicon): `GhostsInTheMachine-1.0.5-mac-arm64.dmg`
-   macOS (Intel): `GhostsInTheMachine-1.0.5-mac-x64.dmg`

Get it here:  
**[https://github.com/janvanwassenhove/ghostsinthemachine/releases](https://github.com/janvanwassenhove/ghostsinthemachine/releases)**

Ghosts in the Machine campaign selection screen showing scenario cards. _Seven scenarios, each a fresh way to owe money to a haunted building._

Every graphic is procedural or hand-made, every sound is synthesized at runtime, and no assets were borrowed from the beyond. Any resemblance to your production environment is entirely coincidental and also your own fault.

---

**Completely Serious Disclaimer.** No printers were harmed in the making of this game, though several were spoken to firmly. The Bureau of Digital Sanctity is fictional and any resemblance to your actual audit process is a coincidence you should probably investigate. Fable 5 did not write this disclaimer; it offered to, which is precisely the point.
