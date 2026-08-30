---
name: "Bully Off"
code: "BULLY"
tag: "game"
cat: "games"
blurb: "A field hockey game that actually knows hockey: the circle rule, penalty corners, rolling substitutions, cards, wet versus dry turf. Coach a club through a season you can replay to the tick."
repo: "BullyOff"
demoUrl: "https://janvanwassenhove.github.io/BullyOff/"
order: 1
isNew: true
---

**A field hockey game for the web** — a deterministic match simulation engine driving a coach/manager campaign. Fully fictional world, installable as an offline PWA, in Dutch, English and French.

The point is **hockey-accurate simulation**. The circle rule, penalty corners, rolling substitutions, cards, four quarters, wet versus dry turf — in a sport that every existing game models as "football with different rules". It is not.

## The engine is the product

The simulation is headless and deterministic: `tick(state, inputs)` returns the next state and the events it produced. Same seed and same inputs, byte-identical event log. Always.

That constraint is enforced rather than hoped for. The engine has zero runtime dependencies and no access to `Math.random`, `Date.now`, the DOM or timers — ESLint fails the build if any of them appear. The renderer never touches the simulation; it reads the event log and nothing else.

## Coach a club

Generate a world and it invents twenty seasons of history before you arrive: clubs with their own towns, identities and kit palettes, nationality-weighted squads, champions and promotions already on the record. Pick a club, then coach today's match from the bench or simulate the day. Play-offs, promotion and relegation, saves.

Nothing in it is real. No real people, no real clubs, ever — there is a blocklist to keep it that way.

## Calibrated, not guessed

The batch simulator plays thousands of matches and compares the aggregates against real-world Belgian League figures. When the numbers drift, the model is wrong, and that shows up as a failing calibration rather than a vibe.

## Status

A v1.0 candidate: all nine phases are built, and the phone pass and the last human reviews are what stand between it and a tag. It is playable now.

[Play it in the browser](https://janvanwassenhove.github.io/BullyOff/) · [source, brief and thirteen architecture decision records](https://github.com/janvanwassenhove/BullyOff)
