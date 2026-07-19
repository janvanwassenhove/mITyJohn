---
name: "Scrum Programming Language"
code: "SPL"
tag: "lab"
cat: "lab"
blurb: "An intentional programming language: you write ceremonies, it compiles to Java."
repo: "scrum"
order: 15
wpId: 100
wpSlug: "scrum-programming"
---

## Becoming a Programming Scrum Master

This is the home of the **SCRUM** programming language.  
It is an attempt to make a new custom programming language which is understandable for business as well as for developers and loosely inspired by the Scrum (software development) framework. SCRUM allows developers to express not only instructions, but also intent, which is compiled into deterministic Java code. SCRUM explores programming by intent — using AI at compile time, not at runtime.

## Why

So you can become an actual **SCRUM programmer**, instead of being just a “Scrum Master” (without even coding).

![](/wp-content/uploads/2023/01/banner-768x120.webp)

Inspired by being a Rockstar developer (the programming language developed by _Dylan Beattie_) and wanting to really comprehend the creation and work of an actual programming language I decided to develop my own.

As originally being a Java Developer and because Java is widely available I used Java as base for the new language.

## Want to try it out?

The full implementation and docmentation can be found on [Github](https://github.com/janvanwassenhove/scrum).  
SCRUM is experimental by design and evolves as a playground for new ideas in programming.

To install it locally, download the development kit:

[SCRUM-v2.0.0](https://github.com/janvanwassenhove/scrum/releases/download/v2.0.0/scrum-language-2.0.0-sdk.zip)[Download](https://github.com/janvanwassenhove/scrum/releases/download/v2.0.0/scrum-language-2.0.0-sdk.zip)

[SCRUM-v1.3.0](/wp-content/uploads/2025/12/SCRUM-v1.3.0.zip)[Download](/wp-content/uploads/2025/12/SCRUM-v1.3.0.zip)

[SCRUM v1.2.0](/wp-content/uploads/2024/12/SCRUM-v1.2.0.zip)[Download](/wp-content/uploads/2024/12/SCRUM-v1.2.0.zip)

[SCRUM v1.1.0](/wp-content/uploads/2023/04/development.zip)[Download](/wp-content/uploads/2023/04/development.zip)

  
Version Details Listing  
v2.0.0 (Java 25 LTS compatible - intent-aware compilation, CLI support)  
v1.3.0 (Java 21 LTS compatible - introducing API's)  
v1.2.0 (Java 21 LTS compatible)  
v1.1.0 (Java 17 LTS compatible)  
  
A glance of the scrum programming language using the 'Hello World' example:

<div class="spl-sample"><div class="sample-head"><span class="dots"><i></i><i></i><i></i></span><span class="file">hello-world.scrum</span></div><pre><code><span class="c-dir">#SPRINTGOAL</span> Deliver our first Scrum program
&#32;
<span class="c-kw">EPIC</span> <span class="c-str">"SampleStories"</span>
&#32;
    <span class="c-kw">USER STORY</span> <span class="c-str">"HelloWorld"</span>
&#32;
        <span class="c-dir">#REVIEW</span> Our first Scrum Program
        <span class="c-kw">SAY</span> <span class="c-str">"Hello world!"</span>
&#32;
    <span class="c-kw">END OF STORY</span>
&#32;
<span class="c-kw">END OF EPIC</span></code></pre><div class="sample-foot">the ceremonies are the syntax</div></div>

SCRUM also allows expressing intent directly:

<div class="spl-sample"><div class="sample-head"><span class="dots"><i></i><i></i><i></i></span><span class="file">intent.scrum</span></div><pre><code><span class="c-kw">USER STORY</span> <span class="c-str">"Greeting"</span>
    <span class="c-dir">#INTENT</span>
    Display a friendly greeting to the user.
    <span class="c-dir">#END INTENT</span>
<span class="c-kw">END OF STORY</span></code></pre><div class="sample-foot">When SCRUM encounters an <span class="c-dir">#INTENT</span> block, the compiler interprets it during compilation. AI may assist in translating intent into explicit logic, but the result is plain Java. There is no AI dependency at runtime — execution remains deterministic and JVM-based.</div></div>

So if you want to become a Master SCRUM programmer, make sure you check it out 😉

Also, being an actual SCRUM programmer looks good on you curriculum!

Feel free to use the badge on your socials:

![](/wp-content/uploads/2023/01/logo_scrum-768x768.webp)

> ## Meet Scrummy!
> 
> **Scrummy** is the official mascot of the SCRUM programming language! This friendly companion represents the approachable and collaborative spirit of SCRUM. With those big eyes and a cheerful smile, Scrummy is here to guide you through your journey of becoming a true SCRUM MASTER PROGRAMMER!

![](/wp-content/uploads/2025/12/ChatGPT-Image-10-dec-2025-23_32_46-768x768.webp)

![](/wp-content/uploads/2025/12/scrummy_christmas-1024x683.webp)

> Since SCRUM is built on top of Java, **Scrummy** and **Duke** (Java’s mascot) are best friends! This friendship symbolizes how SCRUM leverages the power and stability of the Java platform while bringing its own unique, business-friendly syntax to the world of programming. Together, they represent SCRUM’s goal: combining human-friendly intent with a rock-solid execution platform.

![](/wp-content/uploads/2025/12/scrummy_duke-1-768x768.webp)

---

## Additional References

-   [Scrum esolangs](https://esolangs.org/wiki/Scrum)
-   [Meet Scrummy: Because Even a Programming Language Needs a Hug](/blog/meet-scrummy-because-even-a-programming-language-needs-a-hug/)
-   [SCRUM Becomes 2!](/blog/scrum-becomes-2/)
-   [SCRUM Programming Language — Release v1.3.0](/blog/scrum-programming-language-release-v1-3-0/)
-   [SCRUM 2.0.0 — Programming by Intent (and a Little Faith)](/blog/scrum-2-0-0-programming-by-intent-and-a-little-faith/)
