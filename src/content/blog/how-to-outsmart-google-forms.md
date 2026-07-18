---
title: "How to Outsmart Google Forms"
date: 2023-05-20T22:52:00
updated: 2023-12-20T23:04:14
tags: ["programming", "python", "development"]
cover: "/wp-content/uploads/2023/12/DALL·E-2023-12-21-00.03.19-Create-a-retro-style-image-for-a-blog-post-about-a-whimsical-and-technical-journey-of-creating-a-script-to-bypass-a-Google-form.-The-image-should-have.png"
cardTag: "Programming · Python"
wpId: 180
wpSlug: "how-to-outsmart-google-forms"
---

In the ever-expanding universe of coding, where the seriousness of programming meets the absurdity of repetitive tasks, I wanted to provided myself with a small challenge. So on jolly but cloudy morning, with some free time to spare I wrote this magical script to magically bypass a google form.

Let’s embark on a slightly whimsical, yet predominantly technical journey through its functionalities.

### Chapter 1: The Genesis of Automation

Our tale begins with the noble purpose of the “AutoFill-GoogleForm-Proxy” script: to test Google Forms multiple times with different email addresses, while skilfully dodging IP-based detection by changing proxies. It’s like sending a horde of digital ninjas, each with a unique disguise, to test the fortitude of your digital fortress.

### Chapter 2: The Art of Preparation

Before unleashing this army of form-fillers, one must perform two sacred rites:

1.  **The Form’s URL Alteration**: This is where we turn a mundane Google Form URL into a portal for automated responses by replacing ‘/viewform’ with ‘formResponse’. It’s like telling your GPS to take the scenic route, but for data.
2.  **Unearthing Form Variables**: A quest akin to finding hidden treasure, this involves delving into the Chrome developer tools to record and inspect network traffic during form submission. It’s like eavesdropping on data, but legally.

### Chapter 3: The Proxy Masquerade

In certain quests, a hero must don a cloak of invisibility. In our script’s case, this cloak is made of proxies. By configuring proxy usage, the script can mimic submissions from various locations, much like a chameleon changing colors to blend in at a disco.

### Chapter 4: The Grand Performance

With a flourish and a command (`python GoogleForms.py`), our script springs into action. But it’s no one-trick pony; it can modify its tactics with options such as **`viaProxy`** (to switch on the invisibility cloak), `numberOfRequests` (how many times it will bravely sally forth), and `scrambled` (choosing between a dignified name or an alias straight out of a spy novel).

Running the script

```
python GoogleForms.py
```

| Variable name | Type | Default value | Description |
| --- | --- | --- | --- |
| viaProxy | Boolean | False | If not activated, form will be filled using the current IP.  
If True, the request will go via Proxy |
| numberOfRequests | Integer | 2 | The amount of times you want the request te be excuted. |
| scrambled | Boolean | False | If False, more ‘human’ names for generating the username will be used. If True, scrambled characters will be used. |

Available variables

### Chapter 5: The Proxy Waltz

By casting the spell `python GoogleForms.py --viaProxy=True`, the script calls upon a conga line of proxies from the mystical API realm of [https://api.proxyscrape.com/v2/](https://api.proxyscrape.com/v2/). It then proceeds to sashay through the digital landscape, submitting forms with the grace of a ballroom dancer.

### Chapter 6: The Enchantment of Email Generation

Drawing inspiration from the secret grimoire ([https://github.com/janvanwassenhove/EmailGeneration](https://github.com/janvanwassenhove/EmailGeneration)), our script becomes an alchemist of emails, creating addresses that could either pass for royal titles or sound like something a cat walked over on a keyboard.

### Epilogue: The Legacy

As our journey reaches its end, we salute the AutoFill-GoogleForm-Proxy. It’s more than just a tool; it’s a beacon of hope for those who dread the monotony of form filling, a reminder that even in the most tedious tasks, there’s room for a little fun.

For those intrepid souls eager to delve into this adventure, the repository awaits on GitHub: [AutoFill-GoogleForm-Proxy](https://github.com/janvanwassenhove/AutoFill-GoogleForm-Proxy). May your coding ventures be as fruitful and amusing as this whimsical yet technically insightful journey!

I had my fun playing around with it and the cloudy morning quickly past away!
