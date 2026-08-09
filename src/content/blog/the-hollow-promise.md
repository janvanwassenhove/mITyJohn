---
title: "The hollow promise: encryption whose key sat next to the ciphertext"
date: 2026-11-01
tags: ["security", "privacy", "development"]
cover: "/blog/the-hollow-promise/cover.webp"
cardTag: "Security · Privacy"
draft: true
---

The entire point of encrypting the profiles is that a copy of the folder is
worthless. Somebody grabs the data directory — a stolen laptop, a synced backup,
a stray zip — and they have ciphertext.

I had built that. AES-256-GCM, per-person keys, cryptographic erasure, the works.
I had written a post's worth of design about it.

The passphrase was in a file next to that folder. Same parent directory. Same
permissions.

## What an audit is for

I ran a full audit of this project — interface, accessibility, performance,
security — mostly expecting to tidy up. Two findings in the security section
were about the encryption I was proudest of.

**The key sat beside the data.** `KNOWLEDGE_PASSPHRASE` lived in a `.env` file
in `%APPDATA%/aura-desktop`. The ciphertext lived in
`%APPDATA%/aura-desktop/data`. A sibling directory. Anything that could read one
could read the other.

So what threat did the encryption actually defend against? Not a copied folder —
the copy carries its own key. Not a stolen laptop, for the same reason. Really
only against someone who reads the data file and, for no reason, declines to
read the file next to it.

A security property is only real against a specific threat. Mine was real
against essentially nothing it would plausibly meet.

**The work factor was three doublings low.** scrypt at `n=2¹⁴`, when current
guidance is `2¹⁷`. Plus, if the setup wizard had never run, the salt fell back
to a hardcoded string — meaning every installation that skipped the wizard
shared a salt, which is the exact condition salts exist to prevent.

## Why you cannot just fix the constants

This is the part that makes it interesting rather than embarrassing.

The derived key wraps the per-person data keys. Change the parameters and you
derive a *different* key, which no longer unwraps anything. Edit two constants
and every existing installation's data becomes permanently unreadable.

So this was not a code change. It was a data migration, on encrypted data, that
had to work on the first attempt on a machine holding profiles and biometric
data that exist nowhere else.

## The design that made it safe

**Put the parameters in the stored state.** The salt and work factor now live in
a `key-params.json` file sitting next to the ciphertext. Data and the
description of how to open it travel together. This is the whole trick: a store
that carries its own parameters can be migrated, because you can always read how
it was written before deciding how to rewrite it.

**Only rewrite the small keys.** Because of the envelope design, rotating the
master key means unwrapping and re-wrapping each person's data key. The bundles
are not re-encrypted. The face embeddings, which are encrypted directly, do get
rewritten — but that is a small file.

**Record the old parameters before changing a byte.** The new parameters file is
written *first*, containing both the new values and the previous ones, before
anything is rewritten. If the process dies halfway, both keys remain derivable.

**Probe each store independently.** Every file is checked on its own: can the
current key open it? If not, can the previous one? A crash between two files
leaves each readable under one of the two recorded parameter sets, and the next
start finishes the job.

**Never rewrite before proving.** Nothing is written until the old key has
demonstrably decrypted the current contents. If neither key opens the knowledge
store, the migration aborts having touched nothing, and says the passphrase is
probably wrong.

## Three mistakes I caught before they touched real data

I wrote tests before running any of this, and they earned their keep.

**I discarded the recovery parameters too early.** My first version deleted the
previous parameters once migration "finished". But if a store had not been
passed in that run — behind a feature flag, or restored from a backup later —
it could never be recovered. Those are public parameters, not a key. Keeping
them costs nothing and is the difference between a recoverable file and a dead
one. They stay, permanently.

**One unreadable record blocked everything, forever.** Records encrypted with a
different key already existed in the wild (a stray test, years of a project).
My first implementation aborted on the first one it could not open, which meant
one bad record made the upgrade permanently impossible. Now unreadable records
are carried across untouched and reported.

**One foreign file took the whole system down.** A `recognition.enc.json` left
over from a different installation caused the entire brain to refuse to start.
Fixed by deciding which failures are fatal: the *knowledge* store failing to
open is fatal, because carrying on would show an empty profile list and invite
someone to start typing over data that is perfectly intact. Face embeddings are
rebuildable. A stale file must never be the reason nothing starts.

## Doing it on the real machine

Order of operations, because this is the part people skip:

1. **Back up** the encrypted stores and the environment file to a timestamped
   directory, then verify the copies by comparing hashes. Not "copy and assume".
2. **Rehearse on a copy.** I ran the entire migration against a duplicate of the
   real data first. It worked. That is when I found that my verification was too
   weak — see below.
3. **Refuse to run while the application is live.** The migration checks whether
   the brain is listening and stops if it is. Migrating a file something else is
   writing to is how you get a corrupted store.
4. **Run it.** Profiles and face embeddings rotated to `n=2¹⁷` with a fresh
   random salt.
5. **Move the passphrase to the OS keyring** — Windows Credential Manager here —
   and *read it back* to confirm before removing the old copy.
6. **Verify from a cold start.** Boot the application with no passphrase in the
   environment at all, and confirm it reads from the keyring, unlocks, and lists
   every profile.

## The mistake that got through

Step 2 caught this, and it is the one I would most like you to steal.

My migration reported *"14 face embeddings migrated"* and I believed it. Then I
looked at how it counted: it had counted the encrypted blobs. It had not
decrypted a single one.

Every embedding could have been corrupted into noise and the number would have
been identical. The verification proved the loop ran. It proved nothing about
whether the data survived.

The fix was a few lines — decrypt each one and count only what actually opens.
The real work was noticing, and what made me notice was asking the deliberately
naive question: *what would this number look like if everything were broken?*

If the answer is "the same", it is not a verification.

The corrected check confirmed all 14 embeddings decrypt to valid 512-dimension
vectors. Now it means something.

## The cost, and why it is a feature

Key derivation went from about 55 ms to about 422 ms on this laptop.

That is eight times slower, once per start and once per unlock attempt. Nobody
notices. And an eight-fold increase in the cost of every guess is precisely the
point — it is a tax on anyone trying passphrases offline against a copy of the
file, on top of the lockout that already exists for online attempts.

Deliberate slowness in exactly one place.

---

*Next: the scanner that sits in my pre-commit hook and refuses to let personal
data reach git — and why the hook alone is not enough.*
