---
title: "The Workflow Is the New Unit of Software Delivery"
date: 2026-06-28T19:56:17
tags: ["ai", "architecture", "delivery", "development", "engineering", "leadership", "sdlc", "software-delivery"]
cover: "/wp-content/uploads/2026/06/ChatGPT-Image-28-jun-2026-21_55_54.png"
cardTag: "AI · Architecture"
wpId: 891
wpSlug: "the-workflow-is-the-new-unit-of-software-delivery"
---

**I thought AI would help us write software faster.**  
**Instead, it forced me to rethink what software delivery actually is.**

For years, software delivery had a very simple center of gravity.

The developer.

We planned around developers.  
We estimated developer effort.  
We staffed teams with developers.  
We tracked tickets assigned to developers.  
We celebrated velocity as if software was mostly a matter of moving tasks from left to right while everyone pretended the board was telling the full truth.

And honestly, that model made sense.

Because for a long time, the scarce thing was the person who could turn intent into code.

Then AI entered the room.

At first, I saw it as another tool. A powerful one, yes. But still a tool. Something next to the developer. Something that could help with boilerplate, explain old code, generate tests, create a prototype, or rescue you from a framework you had not touched since a previous architectural life.

Useful. Fast. Sometimes impressive. Occasionally weird in a way that makes you question both the model and your own instructions.

But still: a tool.

Over the last year, that feeling changed.

Not because AI became magically perfect. It did not.

It changed because I started to see that AI was not only helping inside the software delivery process. It was pushing on the shape of the process itself.

And once that happens, the old unit of work starts to crack.

![](/wp-content/uploads/2026/06/ChatGPT-Image-28-jun-2026-21_48_12-1-1024x576.png)

Looking at software delivery from a higher point of view.

---

## The first illusion was speed

The first story everyone wants to believe is the speed story.

AI writes code faster.  
So teams deliver faster.

It is a beautiful sentence. Clean. Simple. Wrong enough to be dangerous.

Because software delivery is not typing.

Software delivery is understanding what matters, making decisions, shaping trade-offs, building something that fits, validating that it works, integrating it into a larger system, securing it, operating it, and keeping it maintainable after the initial excitement has left the building.

Code is part of that.  
But code is not the whole machine.

When AI started accelerating code production, the first visible result was not always faster delivery.

Often, it was more output.

More screens. More components. More tests. More documentation. More pull requests. More “almost there”.

The system looked busy. Very busy. The kind of busy that makes dashboards smile.

But the bottleneck simply moved.

Review became heavier. Testing became heavier. Validation became more important. Integration exposed assumptions. Business feedback became the limiting factor. Architecture decisions that were previously hidden under the slow rhythm of manual work suddenly became urgent.

That was the first real lesson for me.

AI does not automatically remove bottlenecks.

It reveals them.

And sometimes it reveals that the bottleneck was never coding in the first place.

## Output became cheap, validation became precious

AI makes output cheap.

That is its superpower.

But cheap output changes the economics of attention.

If creating more artefacts becomes easy, then the valuable work moves to deciding what should exist, what should be trusted, what should be rejected, and what actually creates value.

That sounds obvious, but in daily delivery it changes a lot.

A generated screen is not value until someone confirms it supports the right flow.  
Generated code is not value until it fits the architecture.  
Generated tests are not value until they validate something meaningful.  
Generated documentation is not value if it only describes confusion with better grammar.

The goal is not more output.

The goal is more validated value.

That word — validated — is where the future of software delivery is moving.

Because AI can produce quickly, but delivery still needs confidence.

Confidence that the intent was understood.  
Confidence that the implementation fits.  
Confidence that the system remains secure.  
Confidence that humans still know what is happening.  
Confidence that speed did not quietly become debt.

This is why the conversation cannot stop at productivity.

Productivity without validation is just faster noise.

And faster noise is still noise, only now with release notes.

## The prompt was only the beginning

At first, it was natural to focus on prompts.

Better prompt, better result.

And yes, prompting matters. A vague prompt can produce a result that looks good until you realize it solved a slightly different problem with the confidence of someone who joined the meeting five minutes late and immediately started drawing boxes.

But prompts do not scale delivery.

Prompts help individuals.

Workflows help teams.

That distinction became central in my thinking.

A prompt is a request.

A workflow is a delivery path.

A workflow defines the input, the context, the role of the agent, the expected output, the validation steps, the escalation points, the quality gates, the cost boundaries, and the evidence that needs to be kept.

That is very different from “ask the AI to build it”.

And this is where the bigger shift becomes visible.

The scalable unit is not the prompt.

It is the workflow.

![](/wp-content/uploads/2026/06/ChatGPT-Image-28-jun-2026-21_48_12-2-1024x576.png)

From individual execution to reusable delivery workflows.

---

## The workflow becomes the thing we design

In the old model, a lot of delivery design happened around people.

Who picks up the ticket?  
Who writes the code?  
Who reviews it?  
Who knows that part of the system?  
Who has time this sprint?  
Who remembers why we made that decision six months ago?

In an AI-first model, those questions do not disappear, but another question becomes more important:

What is the workflow?

That question changes the conversation.

A workflow can be reused.  
A workflow can be improved.  
A workflow can include validation by design.  
A workflow can capture decisions.  
A workflow can define where humans must stay in control.  
A workflow can make cost visible.  
A workflow can turn lessons learned into a better next delivery.

This is why I believe the workflow is becoming the new unit of software delivery.

Not because people disappear.

But because work is no longer only organized as humans performing tasks. Increasingly, work is organized as humans orchestrating flows where AI agents, tools, checks, context and approvals work together.

The developer is still there.

But the developer is no longer valuable only because they personally type every line.

The developer becomes valuable because they understand the system well enough to steer the workflow.

That is a very different role.

And, if we are honest, a more interesting one.

## The human work moves up

One fear around AI is that it makes human expertise less important.

I see the opposite.

AI makes weak understanding more dangerous.

When the machine can move quickly, the cost of bad direction increases. If the intent is unclear, AI will not always stop and politely ask for better requirements. It may simply continue, filling the gaps with impressive confidence and just enough plausibility to make everyone relax too early.

That is why humans need to move up.

From code to component.  
From component to application.  
From application to ecosystem.  
From task execution to system stewardship.

The human role becomes more about intent, architecture, trade-offs, validation, integration and accountability.

That does not mean humans stop coding. Of course not. Sometimes the most responsible thing is still to open the file, understand the mess, and fix the thing yourself.

But the highest-value work shifts.

Humans define what matters.  
AI accelerates parts of the execution.  
Humans validate whether the execution deserves trust.

Control does not mean typing everything yourself.

Control means knowing where judgment matters.

## The painful part: letting go

This shift is not only technical.

It is emotional.

Especially for experienced people.

When you have spent years building the skill to create software directly, it feels strange to step back and let another system produce part of the work. It can feel unsafe. It can feel lazy. It can feel like giving up control.

And sometimes, frankly, it feels annoying.

Because the AI is fast enough to be useful, but not reliable enough to be left alone. Like an enthusiastic junior developer who read the documentation, skipped the architecture discussion, and is now refactoring half the application because “it felt cleaner”.

So the instinct is to take back the keyboard.

That instinct is understandable.

But AI-first delivery asks for a different kind of discipline.

Not blind trust.  
Not full delegation.  
Not “the machine knows best”.

It asks for structured trust.

You trust the workflow because it has boundaries.  
You trust the output because it is validated.  
You trust the agent because the context is clear.  
You trust the process because evidence is kept.  
You trust yourself because you still know where to intervene.

That trust is not created by a management announcement.

It is earned through practice.

Small wins. Real mistakes. Better guardrails. Repeated use. Enough friction to learn, but not so much that everyone runs back to manual delivery and calls it craftsmanship.

## AI can also accelerate entropy

There is a darker side to this story.

AI can create technical debt very quickly.

Not because it is useless.  
Because it is useful enough to create a lot.

Working code can still be poorly structured.  
A generated frontend can still drift into duplication.  
Patterns can become inconsistent.  
Architecture can become accidental.  
Naming can become folklore.

The system can start to rot much faster than expected.

That was one of the harder lessons for me.

AI-first does not automatically mean better engineering.

Without strong intent and guardrails, it can simply become faster entropy.

The answer is not to avoid AI. That would be like banning electric guitars because someone played a bad solo.

The answer is to move from generation to governed delivery.

Specifications matter.  
Architecture rules matter.  
Automated checks matter.  
Security gates matter.  
Parity validation matters.  
Human approval matters.

Not as bureaucracy.

As acceleration infrastructure.

Because the more autonomy we give to AI, the more important the surrounding system becomes.

## Governance has to live inside the workflow

In traditional delivery, governance often sits around the process.

A review. A meeting. A sign-off. A checklist. A document with a name long enough to prove that several departments were involved.

But when AI becomes part of delivery, governance cannot stay outside.

If AI generates, refactors, tests and validates, then quality, security, privacy, traceability, cost and human approval need to move into the workflow itself.

Otherwise governance arrives too late.

By the time someone checks, the system has already produced output, created assumptions, maybe changed architecture, and possibly generated documentation explaining why it was right.

AI-first governance needs to be executable.

It needs to be part of how the work flows.

This is not about slowing things down.

It is about making speed safe.

A probabilistic model can help us move faster.  
But delivery itself cannot become probabilistic.

So we wrap AI with deterministic checks: tests, type checks, linters, security scans, policies, schemas, cost controls, evidence trails and approval points.

The workflow is where trust is built.

![](/wp-content/uploads/2026/06/ChatGPT-Image-28-jun-2026-21_48_12-3-1024x576.png)

Governance is no longer a gate at the end. It becomes part of the delivery machine.  

---

## Cost becomes part of design

Another thing changes when workflows become the unit of delivery: cost becomes architectural.

With AI agents, cost is not only a license conversation.

It depends on model choice, context size, memory, retrieval, tool calls, validation loops and how often the workflow asks the model to try again.

A cheap model used badly can be expensive.

An expensive model used in the right place can be cheap.

The real question is not: how much did the tool cost?

The real question is: what did it cost per useful outcome?

That is a healthier question.

Because AI costs only make sense when connected to delivery value. Did we reduce rework? Did we improve validation? Did we deliver faster? Did we increase quality? Did we avoid risk? Did we create reusable capability for the next flow?

If we cannot answer that, we are not governing AI delivery.

We are just collecting invoices and hoping the story sounds innovative enough.

## The business becomes more important, not less

One of the surprises of AI-first delivery is that business involvement becomes more critical.

At first, people expect the opposite.

If AI helps the team move faster, surely the business has less work?

Not really.

When delivery accelerates, unclear decisions hurt faster. Weak requirements become visible faster. Missing validation blocks progress faster. The need for real domain input increases.

The machine can help build.

It cannot decide what matters for the organization.

So better preparation becomes more valuable, not less.

Clearer intent. Better examples. Stronger acceptance criteria. More deliberate boundaries. A shared understanding of what good looks like.

Small vague tasks do not suddenly become strategic because an AI touches them.

But a well-prepared workflow with enough context can create serious leverage.

This is where delivery starts to feel different.

We are not just feeding tickets into a faster machine.

We are designing flows that turn business intent into validated outcomes.

## Teams become orchestration systems

I do not think AI makes teams disappear.

I think it changes what a good team is.

A good team is no longer only a collection of people executing tasks.

It becomes an orchestration system.

Humans, agents, workflows, tools, validation and governance working together.

That sounds abstract, but in practice it is very concrete.

Someone needs to shape the intent.  
Someone needs to understand the architecture.  
Someone needs to decide where AI can act.  
Someone needs to define validation.  
Someone needs to monitor cost and risk.  
Someone needs to approve the important decisions.  
Someone needs to learn from the result and improve the next workflow.

The team does not become less human.

The human work becomes more visible.

Judgment. Taste. Context. Responsibility. Courage. The ability to say: this is fast, but wrong.

That may become one of the most important skills in software delivery.

![](/wp-content/uploads/2026/06/ChatGPT-Image-28-jun-2026-21_48_12-4-1024x576.png)

The future team is hybrid: humans, agents, workflows and validation.

---

## What I believe now

I started with a simple idea:

AI can help us build software faster.

I still believe that.

But I no longer believe it is the most interesting part.

The real shift is deeper.

AI changes the unit of work.

The future of software delivery will not be built around isolated prompts, individual productivity hacks, or one giant agent that magically does everything while humans drink coffee and pretend not to check the logs.

The future will be built around reusable, governed, human-led workflows.

Workflows that capture intent.  
Workflows that use AI where it helps.  
Workflows that validate before trust is given.  
Workflows that keep humans in control of the decisions that matter.  
Workflows that improve over time.

That is the new center of gravity.

The workflow is the new unit of software delivery.

And the developer?

The developer becomes the person who can design, steer, validate and improve that unit.

Not replaced.

Promoted into the system.
