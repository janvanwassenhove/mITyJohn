---
title: "SCRUM 2.0.0 — Programming by Intent (and a Little Faith)"
date: 2025-12-29T22:03:32
updated: 2025-12-29T22:24:39
tags: ["ai", "generative-ai", "llm", "programming", "scrum", "development"]
cover: "/wp-content/uploads/2025/12/ChatGPT-Image-29-dec-2025-22_48_04-768x768.webp"
cardTag: "AI · GenAI"
wpId: 688
wpSlug: "scrum-2-0-0-programming-by-intent-and-a-little-faith"
---

There’s a moment in every side project when it stops being fun and starts becoming serious.  
For SCRUM, that moment is version **2.0.0**.

Not because the syntax suddenly got stricter, or because someone wrote a 40-page spec. But because intent itself became a **first-class citizen** in the language. SCRUM 2.0.0 isn’t about writing less code for the sake of cleverness—it’s about reducing cognitive overhead, lowering accidental complexity, and letting developers express _what they want to happen_, not just _how_ to make it happen.

This release marks the point where SCRUM moves from “interesting experiment” to something you can genuinely reason about, build with, and trust.

![](/wp-content/uploads/2025/12/ChatGPT-Image-29-dec-2025-22_48_04-2-768x768.webp)

And yes, this involves **Large Language Models at compile time**.  
No, this is not a runtime magic trick.  
And yes, this will feel slightly uncomfortable at first. That’s normal.

---

## The Traditional Way: Java, Boilerplate, and Determination

Let’s start with the familiar and (occasionally) love: **traditional Java**.

In Java, even the simplest business rule requires a fair amount of ceremony. You describe intent indirectly, through classes, methods, conditionals, and defensive code. The compiler doesn’t care _why_ you’re doing something—only that the syntax is valid and the types line up.

```
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello world!");
    }
}
```

That’s the _simple_ version. The moment you add input, logic, validation, or state, Java politely reminds you that:

-   Types matter
-   Structure matters
-   And yes, you _will_ write all of it yourself

Java is explicit, powerful, and unforgiving — which is exactly why it scales.  
But it also means the _intent_ (“say hello”) gets buried under _implementation_.

That precision has value. It’s explicit, predictable, and leaves very little room for interpretation. But it also comes at a cost: verbosity, boilerplate, and a growing gap between business intent and implementation. The more complex the domain, the more effort is spent translating _meaning_ into mechanics.

## Classic SCRUM: Still Explicit, Much More Human

SCRUM already made a big step forward by expressing logic in **business-readable terms**.

SCRUM already tried to close that gap.

Instead of low-level constructs, you describe behavior using structured concepts like actors, conditions, and outcomes. You’re no longer writing “code that happens to implement a rule”; you’re writing the rule itself.

Still, classic SCRUM remains explicit. Every condition, every edge case, every branch must be spelled out. It’s readable, but it’s still exhaustive. You describe intent—yet you do so in full detail, step by step.

Here’s _Hello World_ in classic SCRUM:

```
#SPRINTGOAL Deliver our first Scrum program

EPIC "SampleStories"

    USER STORY "HelloWorld"

        #REVIEW Our first Scrum Program
        SAY "Hello world!"

    END OF STORY

END OF EPIC
```

Compared to Java:

-   Less syntax noise
-   Clear structure
-   Still 100% explicit
-   Still fully deterministic

You write the logic.  
The compiler executes exactly that logic.  
No guessing involved.

This style remains fully valid in SCRUM 2.0.0., but SCRUM 2.0.0 asks a dangerous question:

> What if we didn’t have to spell out everything?

## Now Add `#INTENT`: Same Language, New Dimension

SCRUM 2.0.0 introduces a new option — **not a replacement** — called `#INTENT`.

The same _Hello World_, expressed as intent:

```
EPIC "HelloWorldApp"
    USER STORY "Greeting"
        #INTENT
        I want to create a simple greeting that displays "Hello from SCRUM!" to the user.
        #END INTENT
    END OF STORY
END OF EPIC

app IS NEW HelloWorldApp
app::Greeting USING []
```

This is where things feel… different.

There’s no `SAY`.  
No explicit output statement.  
No visible implementation.

And yet — the program runs exactly as expected.

This is not pseudo-code. It’s not documentation. It’s not a comment.

It’s **executable intent**.

At first glance, this feels like cheating. Where are the conditions? The checks? The branching logic? The answer is simple—and slightly uncomfortable: they’re inferred.

But importantly, they’re not inferred at runtime.

---

## What Actually Happens (Without Hand-Waving)

HHere’s the important part, stripped of buzzwords and wishful thinking.

Everything **starts as SCRUM**.

When the compiler encounters a `#INTENT` block, this is what really happens:

![](/wp-content/uploads/2025/12/image-4-683x1024.webp)

Once compilation finishes, the AI is gone.

### What This Explicitly Means

-   No AI dependency at runtime
-   No network calls in production
-   No “creative interpretation” after deployment

\-> Deterministic Java execution  
\-> Predictable JVM behavior  
\-> Full compatibility with CI/CD, debugging, and observability

Think of it as **AI-assisted SCRUM authoring**, followed by **classic Java execution**.

Or more simply:

> The AI helps _write_ SCRUM.  
> SCRUM becomes Java.  
> Java does what Java always does.

That separation is not an implementation detail —  
it’s the entire point.

## Java vs SCRUM vs SCRUM + Intent

Let’s put all three side by side:

| Aspect | Java | Classic SCRUM | SCRUM with `#INTENT` |
| --- | --- | --- | --- |
| **Expressiveness** | Low | Medium-High | Very High |
| **Boilerplate** | High | Medium | Minimal |
| **Cognitive Load** | High | HiMediumh | Low |
| **Runtime Predictability** | Very High | Very High | Very High |
| **Compile-time Trust** | Compiler only | Compiler only | Compiler + Model |
| **Faith required** | None | None | Just a a little 🙂 |

That last row is honest. Yes, intent requires trust. But it’s **bounded trust**, applied once, under inspection, with the ability to reject or override the result.

Java asks:

> “How exactly do you want this done?”

Classic SCRUM asks:

> “What is the structure and logic of this story?”

SCRUM with `#INTENT` asks:

“Can you explain what you want to happen?”

## Why Compile-Time AI Changes Everything

Many modern tools sprinkle AI _at runtime_.  
SCRUM deliberately does not.

By keeping AI **out of runtime**, SCRUM preserves:

-   Deterministic execution
-   Debuggable behavior
-   CI/CD safety
-   Production sanity

The AI helps _write_ the code — then steps aside.

If Java is a strict professor  
and classic SCRUM is a pragmatic architect,  
then `#INTENT` is the whiteboard session where you explain the idea first.

## When Should You Use Each Style?

Use **Java** when:

-   You need raw control and performance
-   You enjoy explicitness
-   You’re building large ecosystems with strict contracts

Use **classic SCRUM** when:

-   You want clarity without ceremony
-   You value readable structure
-   You want zero magic

Use **`#INTENT`** when:

-   Boilerplate outweighs meaning
-   You want to express business behavior directly
-   You’re prototyping or exploring logic
-   You’d rather explain than implement

And yes — you can mix all of this freely.

---

## Java 25 Compatibility: Standing on Very Solid Shoulders

While `#INTENT` gets most of the spotlight (and rightly so), **SCRUM 2.0.0 quietly does something equally important**:  
it moves the entire language and SDK to **Java 25 (LTS)**.

This matters more than it sounds.

SCRUM may _look_ playful on the surface, but under the hood it is still very much a **serious compiler and runtime** — and Java 25 provides exactly the kind of stability that makes experimental ideas safe to use.

### Why Java 25?

By targeting Java 25, SCRUM gains:

-   Long-term stability (LTS means boring — in the best possible way)
-   Modern JVM performance and GC improvements
-   Strong tooling support across IDEs and CI pipelines
-   Predictable behavior across platforms

In other words:  
even if your SCRUM code feels a bit… expressive…  
the runtime underneath is rock solid.

### A Familiar Runtime for Java Developers

For anyone coming from Java, this should feel reassuring.

-   SCRUM programs compile down to well-structured Java execution paths
-   Errors surface with JVM-level precision (wrapped in SCRUM storytelling)
-   Debugging still happens in a world of stack traces, types, and line numbers

The **intent-driven magic happens before Java ever runs**.

Once compiled:

-   There is no AI involved
-   There is no interpretation layer
-   There is only validated logic running on a modern JVM

Think of it this way:

> SCRUM may speak in stories,  
> but Java 25 makes sure those stories always end the same way.

### Why This Combination Works

Putting it all together:

![](/wp-content/uploads/2025/12/ChatGPT-Image-29-dec-2025-23_03_05-768x768.webp)

-   **Java** provides predictability, performance, and maturity
-   **Classic SCRUM** provides structure and human readability
-   **`#INTENT`** provides expressive power and reduced boilerplate

SCRUM 2.0.0 doesn’t try to replace Java.  
It builds _on top of it_ — carefully.

And that’s what makes the whole “programming by intent” idea believable:  
because beneath the optimism and natural language  
there’s a JVM that does not care about feelings.

Which is exactly what you want in production.

---

## Faith, Carefully Applied

Programming by intent feels unfamiliar at first.

You hesitate.  
You reread your sentences.  
You realise that vague language produces vague software — just like vague requirements always did.

That discomfort is intentional.

SCRUM 2.0.0 doesn’t remove responsibility.  
It **moves it upstream**.

From:

> “Did I write the correct syntax?”

To:

> “Did I clearly explain what I actually want?”

The compiler still enforces structure.  
Java 25 still enforces reality.  
The runtime is still deterministic and boring — exactly as it should be.

The only thing that changed is _when_ intelligence enters the process.

Not at runtime.  
Not in production.  
But early — when design decisions still belong to humans.

Programming by intent isn’t about trusting AI blindly.  
It’s about trusting **clear thinking**, backed by a compiler that verifies everything before execution.

And yes — that does require a little faith.

But it’s the same faith we’ve always had in:

-   compilers
-   type systems
-   runtimes
-   and well-written code reviews

SCRUM 2.0.0 just asks you to express that faith in full sentences.

Now if you’ll excuse me, I need to explain my next feature to a compiler —  
clearly, precisely, and with cautious optimism.

---

-   SCRUM 2.0.0 release
    -   [https://github.com/janvanwassenhove/scrum/releases/tag/v2.0.0](https://github.com/janvanwassenhove/scrum/releases/tag/v2.0.0)

-   SCRUM Source @ Github
    -   [https://github.com/janvanwassenhove/scrum](https://github.com/janvanwassenhove/scrum)
