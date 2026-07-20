---
name: "SpriteLab"
code: "SPRITE"
tag: "lab"
cat: "lab"
blurb: "A browser-based pixel-art editor with an AI generator bolted on. Describe a character, get an editable sprite pack — frames, hitboxes and all."
repo: "SpriteLab"
order: 15
isNew: true
---

**A pixel-art sprite editor that turns a description into a game-ready character — and then lets you fix every pixel by hand.**

Building a 2D fighter means idle animations, walk cycles, attack sequences and jump arcs, every frame consistent in style and annotated with collision data. Traditionally that is weeks of sprite work before you can test a single punch.

SpriteLab is what I built to skip that part. It runs in a browser tab: no install, no asset store, no hunting for a pack that almost fits.

## Draw

A proper multi-layer editor, not a preview toy. Pencil, eraser, flood fill, line, rectangle, ellipse and eyedropper. Blend modes, zoom, pan, grid overlay and mirror mode for symmetrical characters. Sprites from 16×16 up to 256×256, with built-in palettes and a full colour picker.

## Animate

Frame-by-frame timeline, each frame with its own layer stack. Play/pause preview with per-frame delay, loop and ping-pong playback, and onion skin so you can see the neighbouring frames while you draw.

## Hit

Hitboxes drawn straight onto the canvas in three flavours: hitbox for the attack area, hurtbox for the vulnerable area, pushbox for body collision. Propagate them to the next frame or all frames at once instead of redrawing them by hand.

## Generate

Describe what you want in plain language and SpriteLab generates it through OpenAI or Google Gemini, with low/medium/high quality tiers and a live cost estimate before you spend anything. Hand it a reference image to guide the style. Everything it produces lands on the canvas fully editable — the generator gives you a starting point, not a finished asset you have to accept.

## Where the sprites in mITyFighter came from

This one. [mITyFighter](/apps/mityfighter/) is a retro 2D arcade fighter prototyped in half a day, and the character sprites in it were made here. That was the point: the game was the excuse to find out whether the tool actually worked.

## Get it

Source and setup instructions on [GitHub](https://github.com/janvanwassenhove/SpriteLab). It runs locally or in Docker, and you bring your own API key for the generation features — nothing is billed through me.
