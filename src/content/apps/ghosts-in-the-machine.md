---
name: "Ghosts in the Machine"
code: "GHOSTS"
tag: "game"
cat: "games"
blurb: "A haunted IT sim built by inviting a ghost in. It went about as well as you’d expect."
repo: "ghosts"
demoUrl: "https://janvanwassenhove.github.io/ghosts"
order: 5
wpId: 951
wpSlug: "ghosts-in-the-machine"
---

**A haunted IT management sim. The tickets are ghosts. They queue, they escalate, and if you ignore them long enough they mutate into something worse.**

![](/wp-content/uploads/2026/07/logo_title-1-768x256.webp)

\[ [**Play free in your browser**](https://janvanwassenhove.github.io/ghostsinthemachine/) \] · \[ [**Download for Windows or macOS**](https://github.com/janvanwassenhove/ghostsinthemachine/releases/latest) \]

Run NetherNet Solutions, a paranormal IT support company operating out of an office built over a decommissioned mainframe graveyard. Build rooms, hire staff of questionable qualification, and route an endless queue of absurd tickets while juggling money, client trust, technical debt and the coffee supply.

![](/wp-content/uploads/2026/07/gitm-01-main-menu-1024x576.webp)

No install, no account, no backend. It runs in a browser tab and saves to your own machine. But still, if you like old school, you can run it as well as desktop application.

## What you actually do

![](/wp-content/uploads/2026/07/gitm-03-gameplay-1024x576.webp)

**Build the office.** Twenty-two rooms, including the Ticket Triage Desk, the Debugging Chapel — where stack traces are read aloud by candlelight until the bug confesses — the Merge Conflict Arena, and the Printer Exorcism Booth, which is soundproofed. The chanting is for the printer. The padding is for the staff.

**Hire the team.** Seventeen roles: Bug Whisperers, Scrum Necromancers who raise dead sprints and walk them to the definition of done, Refactoring Monks who have taken a vow of simplicity, and a Compliance Druid who grows policy documents from acorns. They have skills, energy, morale, quirks, and the occasional dramatic resignation.

**Survive the haunting.** Twenty-four kinds of incident, from YAML Fever and Cache Goblin Infestation to the Standup Time Loop and the Spreadsheet Singularity. They arrive at the gate, queue along the walkway, and file in through the front door. Ignore them and they escalate. Ignore them longer and they turn into a different, worse ticket.

## What will kill you

Six meters, all of them impatient: money, client trust, technical debt, system stability, staff morale and coffee.

Technical debt is the one to watch. It climbs to 100, and at 100 it triggers **The Great Refactoring**, during which everything slows to a crawl, the debt burns slowly down, and the team stops speaking to one another.

Every few days the Bureau of Digital Sanctity arrives to audit you. They bring clipboards. The clipboards audit you back.

## The campaign

Seven contracts, each more haunted than the last:

1.  **Basement Helpdesk of Mild Concern** — learn the ropes. The ropes are ethernet cables. They are also slightly haunted.
2.  **The Office With the Printer** — it knows you are reading this.
3.  **Cloud Migration Gone Sideways** — the lift-and-shift lifted something else.
4.  **The Legacy System That Would Not Die** — declared end-of-life in 1999. It disagreed, in writing.
5.  **Audit Season** — they audit every two days, and the clipboards have opinions.
6.  **The AI Agent Incident** — it only did what it hallucinated it was told.
7.  **Ghosts in the Machine** — everything, everywhere, all at 2 AM.

![](/wp-content/uploads/2026/07/gitm-02-campaign-1024x576.webp)

Each plays on **Cozy**, **Standard** or **Nightmare**, and there is a sandbox mode if you would rather build without a client breathing on you.

Every contract is winnable on every difficulty. I know that because a bot proved it: sixty-three complete playthroughs, in under two seconds, every time the code changes.

## Get it

**Play in your browser** — free, nothing to install, works on any modern desktop browser.  
→ [janvanwassenhove.github.io/ghostsinthemachine](https://janvanwassenhove.github.io/ghostsinthemachine/)

**Desktop app** — Windows and macOS installers on the releases page. The Windows build updates itself in the background; there is nothing to re-download.  
→ [Latest release](https://github.com/janvanwassenhove/ghostsinthemachine/releases/latest)

A note for Mac users: the macOS build is unsigned, so the first launch needs a right-click → _Open_ to convince Gatekeeper you meant it. You did.

## Under the hood

TypeScript, Vite and Phaser. No backend, no database, no account and no tracking — saves live in your browser’s local storage. The sound effects are synthesised at runtime with WebAudio rather than downloaded, and every room, character and joke is original work.

The whole thing is open source. → [github.com/janvanwassenhove/ghostsinthemachine](https://github.com/janvanwassenhove/ghostsinthemachine)

---

## Completely Serious Disclaimer

_Every room, role, incident, disaster and joke in this game is original work, invented for this project. Any resemblance to a hospital management sim you played in 1997 is limited to the genre traits that nobody owns: rooms, queues, staff, and escalating chaos. No copyrighted assets were harmed, downloaded, or quietly borrowed. All ghosts are fictional._ _Any resemblance to your production environment is coincidental and, frankly, your own business._
