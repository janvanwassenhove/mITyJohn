---
title: "Rise of the GPT music agent"
date: 2023-12-29T12:00:00
updated: 2025-01-29T21:50:12
tags: ["ai", "development", "generative-ai", "music", "python"]
cover: "/wp-content/uploads/2023/12/DALL·E-2023-12-28-16.33.40-Create-a-retro-style-image-for-a-blog-post-about-a-musicians-journey.-The-image-should-have-a-vintage-aesthetic-using-a-color-palette-of-dark-green-1.png"
cardTag: "AI · Development"
wpId: 207
wpSlug: "rise-of-the-gpt-music-agent"
---

It’s only been a year… during Christmas holidays I developed my new programming language Scrum ([Scrum Launch](https://www.linkedin.com/posts/jan-van-wassenhove-9b49893_github-sprintgoal-review-activity-7015726279660347392-rx_Q?utm_source=share&utm_medium=member_desktop)).

But a year has gone by, time to try out something new and challenging.

Inspired by last years immense evolutions in the domain of generative AI I wanted to try out something new… to verify what yet is possible…

Being passioned by music, I tought, why not creating my own musics agent?

An agent that could compose, write, arrange, remaster and even publish my songs. Based on my inspiration and input he could then generate my new song. I’m not a singer nor a very good musical artist. I know myself how to play a song or two on my guitar or mandolin but it quickly ends. But I get so quickly inspired in new and innovative stuff…

What if could create an agent that would help me out on all the aspects in song creation that I kinda lack today?

![](/wp-content/uploads/2023/12/img-1024x585.png)

One other thing I’m quirte good at… coding (preferrably by default Java of course, but hey, in this case Python’s fine as well for getting the job done).

So let’s combine both passions, music and coding, while creating my very own music agent.

Sonic PI

If I want to create songs and music, I might as well do it in a way I know best. That’s where Sonic Pi comes up.

Sonic Pi is an innovative coding-based music creation and performance tool. It allows users to write code in a simple programming language, which is then converted into music. This software is designed to be accessible for both beginners and experienced programmers, making it a unique bridge between the worlds of coding and music.

![](/wp-content/uploads/2023/12/image-13-1024x730.png)

One of the key features of Sonic Pi is its use of the Ruby programming language, known for its readability and simplicity. Users write scripts that control synthesizers, samples, and effects, effectively composing music through code. This approach to music creation opens up a wide range of possibilities, allowing for precise control over every aspect of the sound, from melody and harmony to rhythm and timbre.

Sonic Pi also emphasizes live coding, meaning that changes to the code are reflected in real-time in the music output. This makes it a powerful tool for live performances, where coders can manipulate and improvise music on the fly, creating a dynamic and interactive experience.

So if I can script my way in into creating new songs, Sonic Pi might be my best candidate to do so. There are limitations in sounds, samples and synths but let’s give it a try.

[https://sonic-pi.net/](https://sonic-pi.net/)

The complexity process of composing a song

Okay, we can start coding music… but, should’nt we know how to compose a song? Let put the pieces together!

#### The Birth of a Melody – The Songwriter/Composer’s Tale

Imagine a spark of inspiration, a melody that hums in the mind of the Songwriter or Composer. This is where our musical journey begins. The Songwriter sits under the night sky, guitar in hand, translating feelings and thoughts into a tapestry of lyrics and tunes. It’s a magical process, where a simple idea blossoms into a song with the power to touch hearts.

#### The Sculptor of Sounds – The Arranger’s Craft

As the melody takes shape, the Arranger steps in. Picture them as a sculptor, molding the raw melody into a refined structure. They decide the flow of verses and chorus, breathing life into the composition with an array of instruments. Each decision, from a gentle piano accompaniment to the swell of strings, is made to elevate the song’s emotional impact.

#### The Voices and Virtuosos – Musicians/Artists in Action

Now enters the ensemble of Musicians and Artists, the performers who infuse the composition with color and energy. Each artist, whether a soulful vocalist or a dynamic drummer, adds a unique layer to the song. Their performances are not just about technical skill but about pouring their soul into every note.

#### Capturing the Magic – The Recording Engineer’s Realm

In the studio, amidst a jungle of cables and microphones, the Recording Engineer works their magic. Their domain is one of dials and screens, where they capture the essence of the performance. Every adjustment, from microphone placement to sound levels, is crucial in ensuring that the soul of the music is preserved in its recorded form.

#### The Visionary – The Producer’s Perspective

Amidst the bustle of the studio, the Producer oversees the vision. They are the guiding star, aligning the creative talents with the technical aspects. The Producer tweaks, suggests, and sometimes challenges, always with the aim of bringing out the best in the song and the artists.

#### The Alchemist of Sound – The Mix Engineer’s Mix

After the recording, the Mix Engineer takes over, an alchemist turning raw audio into gold. In their studio, surrounded by sliders and knobs, they blend the tracks. Their touch can turn a good song into a masterpiece, ensuring every element from the bass line to the backing vocals is heard in harmony.

#### The Final Brushstroke – The Mastering Engineer’s Finishing Touch

As the song nears completion, the Mastering Engineer adds the final brushstrokes. Their studio is a place of precision, where even the slightest adjustment can make a world of difference. They ensure the song shines, no matter where it’s played, from giant speakers at a concert to the earbuds of a smartphone.

Putting it all toghter, composing time!

Now we have aligned all the different aspects of composing a song, it might be time to prepare our own music agent for the task. An agent to make sure the complex task is plit up in multiple subtask to find an answer for the complex task of writing a song.

Creating our music agent(s)

MusicAgent is a multi-agent system that programs songs in Sonic Pi. It uses generative AI to generate song structures based on user preferences. This manual provides instructions on installation, configuration, and song generation. It does not yet generate singing voices, only instrumental versions.

I defined different assistants, all having a different role throughout the phases of composing and writing a song. They will handle the different steps, starting from the user’s initial input.

The different assistant roles: Different roles are defined in [ArtistConfig.json](file:///C:/Development/Workspaces/SongAgent/AgentConfig/mITyJohn/ArtistConfig.json)

-   Artist
-   Composer
-   Songwriter
-   Arranger
-   Sonic PI coder
-   Sonic PI reviewer
-   Sonic PI Mix Engineer
-   Master Engineer
-   Music Publisher

All roles take there part in different phases of composing a song.

-   Configuration of sequences in the chaing can be found in [MusicCreationChainConfig.json](file:///C:/Development/Workspaces/SongAgent/AgentConfig/mITyJohn/MusicCreationChainConfig.json).
-   Configuration and description of each phase is configured in [MusicCreationPhaseConfig.json](file:///C:/Development/Workspaces/SongAgent/AgentConfig/mITyJohn/MusicCreationPhaseConfig.json).

And when we put everything together, we produce following composer chain:

![](/wp-content/uploads/2024/01/Flow-Creation-917x1024.jpg)

The eventual output is a booklet with an album cover, and of course the coded song track in a **“\*.rb”** file.

Song generation

To generate and create your song, you only needed to run the script:

```
python run.py
```

Once launched you’ll be able to pass multiple criteria:

-   Choose an AI model when prompted: “gpt-3.5-turbo”, “gpt-4”, etc.
-   Provide song details: name, duration & style
-   Optionally add specific requests like chord progressions or musical influences.

Bare in mind, an LLM will only try to give a and answer statistically most apropriate. It does not by default mean you code compiles and works. If syntax is correct, it still can occur the code doesn’t produce anything. Same applies for the \*.rb file produces by the agent. Might as well be correct Sonic Pi coding, but no certainty that it will run correctly.

Most of the time what happens is that or agent produced incorrect synths or non existing samples that appear at first sight quite justified, nevertheless unsupported by Sonic Pi.

There remains a human (developer) touch to it, doesn’t it, to help our agent out on this. In the future it would be a good ddition adding sonic pi compilation to the creation phases.

MusicAgent ends by generating a complete set of files in a seperate songs folder in a subdirectory called by it’s new trackname:

-   Track File: the \*.rb file can be found in the Songs directory. To play your track, simply load the file in SONIC PI (where you can also record it).
-   A booklet containing cover image (which resides in same subdirectory), lyrics & additional technical info on setup of the track.
-   A Music Agent logging file. If Track code got lost or is incomplete, you can verify the logs. In some of the phases, the output might not be correctly parsed due to the inpredictivity of LLM’s.

Now you’re all set to go and publish your music!

![](/wp-content/uploads/2024/01/WAV-recording-1024x234.jpg)

You can either use **Sonic Pi** to play your tracks, or you might as well directly record them and publish your music on any streaming platform (e.g. [SoundCloud](https://soundcloud.com/mityjohn))

What’s could be next?

For now we used openai’s chat API. We could also use the openAI assistant API.

In this case we should create assistants as we did for our agents, but keep track of the different threads. OpenAI will keep track of context within each thread. On the other hand we kinda loose or independence towards using the openai api.

Altough we communicate via the api, the given models allows to continue our agent with other models, keeping it independent in usage (and on the long terms enables you to include other models in an easier way).

But for now, enjoy the the music and enjoy!

---

Important links

[https://github.com/janvanwassenhove/MusicAgent](https://github.com/janvanwassenhove/MusicAgent)

[https://sonic-pi.net/](https://sonic-pi.net/)

---

Results on SoundCloud

<iframe loading="lazy" title="mITy.John" width="500" height="450" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?visual=true&amp;url=https%3A%2F%2Fapi.soundcloud.com%2Fusers%2F1339132032&amp;show_artwork=true&amp;maxheight=750&amp;maxwidth=500"></iframe>
