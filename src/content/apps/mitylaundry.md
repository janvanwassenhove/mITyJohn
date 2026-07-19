---
name: "mITyLaundry"
code: "WASH"
tag: "fun"
cat: "fun"
blurb: "Point your camera at a garment and it sorts the wash for you — AR, entirely in the browser. Sorting socks: still not automated in 2026."
repo: "mITyLaundry"
demoUrl: "https://janvanwassenhove.github.io/mITyLaundry"
order: 12
wpId: 830
wpSlug: "mitylaundry"
---

## Your Smart Laundry Sorting Sidekick

**mITyLaundry** is a smart AR laundry sorting assistant that runs **entirely in your browser**. Point your camera at a garment and it will **segment the item**, draw a **colored contour overlay**, and suggest the right laundry pile — with a confidence score to match.

![](/wp-content/uploads/2026/02/image-9.webp)

Because apparently, _sorting socks is still not fully automated in 2026_.

### What it does

-   **Real-time garment detection** using camera segmentation
-   **Colored contour overlay** (color = suggested pile)
-   **Confidence score** per suggestion
-   **Quick corrections** when you disagree
-   **Learns your preferences over time**
-   **Custom pile categories** (beyond the classic whites/darks chaos)
-   **Washing recommendations** based on your machine settings
-   Works **offline after first load** (nice try, Wi-Fi)

### Default piles (customizable)

-   Whites
-   Lights
-   Darks
-   Colors
-   Reds (bleed risk)
-   Delicates
-   Towels & bedding

### Privacy-first by design

All processing happens **locally in your browser**.  
**No photos, no uploads, no server-side “AI saw your underwear” moments.**

### Tech stack (for the curious)

Built with:

-   **Vue 3 + TypeScript + Vite**
-   **MediaPipe Tasks Vision (ImageSegmenter)**
-   **IndexedDB (Dexie)**
-   **WebWorker for ML inference**
-   **PWA support**

---

## Try it & source code

-   **Live app:** `[https://janvanwassenhove.github.io/mITyLaundry/](https://janvanwassenhove.github.io/mITyLaundry/)`
-   **Code:** `[https://github.com/janvanwassenhove/mITyLaundry](https://github.com/janvanwassenhove/mITyLaundry)`
