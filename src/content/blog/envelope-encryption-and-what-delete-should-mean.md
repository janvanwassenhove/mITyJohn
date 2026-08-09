---
title: "Envelope encryption, and what \"delete\" should mean"
date: 2026-10-25
tags: ["security", "privacy", "development", "python"]
cover: "/blog/envelope-encryption-and-what-delete-should-mean/cover.webp"
cardTag: "Security · Privacy"
draft: true
---

"Encrypted at rest" is a sentence that appears on a lot of landing pages and
means remarkably little on its own. Encrypted with what? Held by whom? And what
happens when someone asks you to delete their data — do you run a `DELETE` and
hope, or can you actually prove it is gone?

This assistant holds the kind of data where those questions have real answers:
who lives in the house, how they like to be spoken to, and mathematical
representations of their faces. Here is the design, and what it buys.

## The layout

Three layers, which is what "envelope" means:

```
passphrase
    │  scrypt
    ▼
Owner Master Key  ──wraps──►  per-person Data Encryption Key
                                        │
                                        ▼  AES-256-GCM
                                  that person's records
```

The owner master key is derived from a passphrase and never stored. Each person
has their own randomly generated data key. That data key encrypts only that
person's bundle, and is itself stored encrypted under the master key.

No hand-rolled cryptography anywhere: AES-256-GCM and scrypt, both from a vetted
library. The interesting part is not the primitives — everyone has the same
primitives — it is what the structure lets you do.

## Why per-person keys

You could encrypt everything under one key. It would be simpler and it would be
worse, for three reasons.

**Deletion becomes provable.** Destroy someone's data key and their bundle is
unrecoverable ciphertext. Not "removed from the index", not "flagged deleted",
not "gone from the primary but present in three backups". Unreadable, by
everyone, permanently.

This is cryptographic erasure, and it is the only implementation of the right to
be forgotten I actually trust. A `DELETE` statement is a promise about
behaviour. A destroyed key is a statement about physics.

**Rotating the master key is cheap.** Because the master key only ever wraps
small keys, changing it means re-wrapping a handful of 32-byte values. The
bundles — the bulk of the data — are never touched. This turns "we should
increase our key-derivation work factor" from a terrifying full re-encryption
into a small, contained operation. That mattered enormously later, and it is the
subject of the next post.

**Blast radius is bounded.** One corrupted bundle is one person, not the whole
store. There is a real entry in this project's ledger where a stray test wrote a
record encrypted with a different key into the live file. With one key, the load
would have failed and everyone would have vanished. As it was, one record was
unreadable and the code now skips undecryptable entries with a warning instead
of crashing — because one bad record must never hide everybody else.

## Binding a record to its owner

Each bundle is encrypted with the person's identifier as additional
authenticated data. That means the identifier is not encrypted, but it *is*
authenticated: change which person a ciphertext is filed under and decryption
fails outright.

Without this, someone holding the file could move a blob from one person to
another — attaching one person's private notes to a different name. The data
would still be encrypted the whole time, and the result would still be wrong.

It costs one parameter. It is the cheapest correctness property in the design
and the easiest to forget.

## What the design says about the robot

The corollary is a deployment rule: **the robot holds nothing**.

No keys, no tokens, no profiles, no embeddings. It moves motors, plays audio and
serves camera frames. Everything sensitive lives on the laptop, and the robot is
a peripheral that happens to be on the network.

This falls out of the crypto design rather than being bolted on. If the master
key is derived from a passphrase entered on the laptop, then the laptop is the
only place data can be decrypted, so the robot cannot hold anything meaningful
even if you wanted it to.

Steal the robot, get motors.

## The uncomfortable part

If you lose the passphrase, the data is gone.

There is no recovery, no support channel, no master override. That is not a
missing feature — it is the property that makes every claim above true. A vendor
who can recover your data can also read it, and can be compelled to.

But it does impose an obligation, and this is where a lot of privacy-focused
software quietly fails: **the interface must say so, in words, at the moment it
matters.** Not in a FAQ. At the point where someone sets a passphrase, and again
before anything irreversible.

My own project taught me this the hard way. The migration in the next post moved
the passphrase into the operating system's credential store, which is
substantially safer than where it had been — and which also means that, right
now, there is exactly one copy of it. If that credential store is lost with a
machine, so is everything it protects. That is the correct behaviour. It is also
something the owner has to *know*, and it is now written down in the places
someone would look.

## What I would keep

If I built this again:

**Keep the envelope.** The ability to rotate a master key without touching the
data is worth the extra layer on its own, and cryptographic erasure is worth it
twice over.

**Keep the per-record binding.** One parameter, one whole class of bug removed.

**Keep the policy in the structure, not in the checks.** Biometric data may only
exist encrypted, so the capability that produces it is gated on the crypto being
live. Not a validation somebody remembers to write — a wire that is not
connected until the condition holds.

**Be honest in the UI about what cannot be undone.** Everything above is only
trustworthy if the person relying on it understands the trade they have made.

---

*Next: the same system's encryption, and the afternoon I discovered it was
protecting nothing at all — because the key was sitting in a file next to the
ciphertext, with the same permissions.*
