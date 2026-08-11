---
title: "AURA 14 · Encryption, and the key I left beside it"
date: 2026-10-01
tags: ["security", "privacy", "development"]
cover: "/blog/encryption-and-the-key-i-left-beside-it/cover.webp"
cardTag: "Security · Privacy"
draft: false
---

Picture a safe. A proper one: steel, riveted, a lock you would not pick with a
week and a diagram.

Now picture a small brass hook, screwed to the outside of that safe, with the
key hanging on it.

That was my encryption. This post is how I built the safe, and how I failed to
notice the hook for months.

## What "encrypted at rest" should actually buy you

The phrase appears on a lot of landing pages and means remarkably little on its
own. Encrypted with what? Held by whom? And when someone asks you to delete
their data, can you *prove* it is gone, or are you running a `DELETE` and
hoping?

This assistant holds the kind of data where those questions have teeth: who
lives in the house, how they like to be spoken to, and mathematical
representations of their faces. So the design is three layers, which is what
"envelope encryption" means:

A passphrase derives an **owner key**. The owner key wraps a **separate key per
person**. Each person's key encrypts only that person's records.

The owner key is never stored. Each person's key is stored, but only in
encrypted form, wrapped by the owner key.

<figure class="diagram">
  <div class="diagram-scroll">
    <img src="/blog/encryption-and-the-key-i-left-beside-it/envelope.svg"
         alt="Diagram of envelope encryption. A passphrase held in the OS keyring derives an owner key, which is never stored. The owner key wraps one key per person. Each person's key encrypts only that person's records: facts, signals and embeddings. A third person's key is drawn destroyed, and their records remain on disk as ciphertext nobody can read. A note records that rotating the owner key re-wraps the small keys and never touches the records."
         width="1000" height="800" loading="lazy" />
  </div>
  <figcaption>Three layers. The consequence worth staring at is the right-hand
  column: deletion that is a statement about physics rather than a promise about
  behaviour.</figcaption>
</figure>

## Why a key each, rather than one for everything

You could encrypt everything under a single key. It would be simpler and worse,
for three reasons.

**Deletion becomes provable.** Destroy someone's key and their records are
unrecoverable ciphertext. Not "removed from the index", not "flagged deleted",
not "gone from the primary and present in three backups". Unreadable, by
everyone, permanently.

This is the only implementation of the right to be forgotten I actually trust.
A `DELETE` statement is a promise about behaviour. A destroyed key is a
statement about physics.

**Rotating the owner key is cheap.** Because it only ever wraps small keys,
changing it means re-wrapping a handful of tiny values. The bulk of the data is
never touched. That turns "we should increase our key-derivation work factor"
from a terrifying full re-encryption into a contained operation — which mattered
enormously about four paragraphs from now.

**One bad record is one person.** There is an entry in this project's ledger
where a stray test wrote a record encrypted with a different key into the live
file. With one key, the load would have failed and *everyone* would have
vanished. As it was, one record was unreadable, and the code now skips what it
cannot decrypt with a warning rather than crashing — because one corrupt record
must never hide everybody else.

There is a fourth property that falls out of this and I did not anticipate it:
each record is bound to its owner, so a blob cannot be moved from one person to
another. Without that, someone holding the file could file one person's private
notes under a different name. The data would remain encrypted throughout, and
the result would still be wrong.

## Then I ran an audit and found the hook

I went looking for typos. I ran a full review of the project — interface,
accessibility, performance, security — expecting a tidy list of small things.

**The passphrase lived in a plain settings file, in the application's data
folder. The encrypted records lived in a directory immediately below it.**
Siblings. Same permissions. Anything that could read one could read the other.

So what threat did all of the above actually defend against?

Not a copied folder — the copy carries its own key. Not a stolen laptop, for the
same reason. Not a synced backup, a stray zip, or any of the realistic ways
personal data leaves a machine. Realistically, it protected me against an
attacker who reads one file, notices a second file sitting beside it with an
obvious name, and declines to open it out of politeness.

A security property is only real against a *specific* threat. Mine was real
against essentially nothing it would plausibly meet.

While I was there, I also found that the key-derivation work factor sat three
doublings below current guidance, and that an installation which skipped the
setup wizard would fall back to a hardcoded salt — meaning every such
installation shared one, which is the exact condition salts exist to prevent.

## Fixing it was a data migration, not a code change

This is the part that makes it interesting rather than merely embarrassing.

The owner key wraps the per-person keys. Change how it is derived and you get a
*different* key, which unwraps nothing. Edit two constants and every existing
installation's data becomes permanently unreadable.

So the fix had to run once, correctly, on the first attempt, on a machine
holding profiles and biometric data that exist nowhere else.

The design that made that survivable is the same trick as before: **store the
parameters next to the data they describe**, so the file carries its own
instructions for opening it. Record the old parameters *before* changing a
single byte, so both keys stay derivable if the process dies halfway. Check each
file individually. And never rewrite anything until the old key has demonstrably
opened the current contents.

I wrote the tests before running any of it, and they caught three things that
would each have been permanent: recovery parameters discarded too early, a
single unreadable record blocking the upgrade forever, and one foreign file
taking the whole system down.

Then I backed everything up, verified the backup by comparing hashes, rehearsed
the entire migration on a duplicate, and only then ran it for real.

## The mistake that got through anyway

The rehearsal is where this post earns its place.

The migration finished and reported the number of face embeddings it had
migrated. I believed it, because it was a plausible number and it matched what I
expected.

Then I looked at how it counted.

It had counted the *encrypted blobs*. It had not decrypted a single one.

Every embedding could have been shredded into noise and that number would have
been identical. The check proved the loop had run. It proved nothing whatsoever
about whether the data had survived.

The fix was a few lines: decrypt each one, count only what actually opens. The
work was noticing — and what made me notice was asking a deliberately naive
question that I now ask about every verification I write:

> **What would this number look like if everything were broken?**

If the answer is "exactly the same", it is not a verification. It is a
formality with a progress bar.

## Two things I would carry anywhere

**Name the threat, out loud, in one sentence.** Not "we encrypt data at rest" —
*"a copy of this folder is useless without a passphrase that is not in it."*
Write it down, then go and check whether it is true. Mine collapsed the moment I
said it plainly, and it had been false for months while sounding excellent.

**A verification that cannot fail is not a verification.** Most of the checks I
have written in my career would have reported success on catastrophically broken
data, because they counted attempts rather than outcomes. That is a very easy
mistake to make and a very cheap one to test for.

The passphrase now lives in the operating system's credential store, written
only after being read back to confirm it is retrievable, and removed from the
old location only after that. Which means there is now exactly one copy of it,
and if it is lost the data is genuinely gone.

That is the correct behaviour. It is also something the interface has to say out
loud, at the moment it matters, because every promise in this post is only worth
anything if the person relying on it understands the trade they have made.

---

That is a reasonable place to pause, and it pauses here deliberately.

The first post argued that when you delegate work to an agent, the hard part
stops being production and becomes verification. Everything since has been a
variation on that: a cache that was correct and useless, a diagnosis delivered
with confidence and built on the wrong question, a security property I was proud
of that protected nothing at all.

None of those were caught by the loop that produced them. They were caught by
measuring on the real device, by asking what a number would look like if
everything were broken, and by writing down what was actually observed instead
of what was intended.

That is the whole method. It is not sophisticated. It just has to be done.

AURA is still running on my desk and still changing, which means there will be
more of these — the acoustic echo problem I have not solved, whatever the next
release breaks, and the parts that are still more idea than software. This
particular arc is finished. The project is not.

---

*Everything in this series — the numbers, the failures, the code — is in the
[public repository](https://github.com/janvanwassenhove/aura), along with the
build ledger that is still recording as this continues. There are
[installers](https://github.com/janvanwassenhove/aura/releases/latest) for
Windows, macOS and Linux, and the whole stack runs without a robot if you just
want to poke at it.*
