# How I Built Bloomie

## The Idea

I was tired of health apps that make me feel bad. Every dashboard with red numbers and missed goals felt like a report card. I thought, what if tracking wellness felt like tending a garden? Not stressful. Not clinical. Just... alive.

That was the core thought. Your health data should grow something beautiful instead of screaming at you with notifications.

## Starting Point

I had an older hackathon project called Canopy that did some health monitoring with 3D scenes. It had the bones of what I needed. A Next.js frontend, a FastAPI backend, Supabase for the database, and some Three.js 3D stuff. I decided to take that foundation and reimagine it completely as something softer. Something that feels like opening Animal Crossing, not opening a hospital portal.

## Why a Garden?

I kept asking myself, how do you show someone their sleep is off without making them anxious? The answer I landed on was metaphor. Rain in a garden is not punishment. Its just weather. Clouds mean something changed. Flowers bloom when you do good things. Butterflies come when you move. The garden never dies. It just changes seasons.

That felt right. No shame. Just reflection.

## Choosing the Tech

For the frontend I stuck with Next.js because I know it well and it handles routing nicely. React 19 gave me server components but honestly I used client components for everything because of all the animations and 3D stuff.

Three.js was the obvious choice for the garden. I thought about React Three Fiber but decided raw Three.js gave me more control over exactly how things look. I wanted the island to feel handcrafted, not procedural.

Framer Motion handles all the page transitions and micro interactions. Its the difference between the app feeling dead and feeling alive.

Tailwind because I can move fast and keep things consistent. I built a whole custom color palette I call the "bloom" palette. Soft pastels. Sage greens. Lavender. Peach. Nothing harsh.

## The Backend

FastAPI because Python is where my AI pipeline lives. I use LangGraph to build a proper state machine for wellness analysis. Its not just calling an LLM and hoping for the best. The pipeline has real steps.

First it normalizes your data. Then it computes personal baselines from your own history using statistics. Then it detects deviations with z-scores. Then it assesses risk with deterministic rules. Only then does it generate a narrative with the LLM.

The important thing is the LLM only handles summarization and conversation. It never makes medical decisions. Thats all rule-based.

## OpenRouter for AI

I went with OpenRouter because it gives me access to lots of models through one API. I default to Gemini 2.5 Flash because its fast, cheap, and good enough for structured extraction and conversation. If I need something stronger I can switch models without changing code.

## The Personal Baseline Engine

This is the part I am most proud of technically. Most health apps compare you to population averages. Bloomie learns YOUR normal. If your resting heart rate is usually 65 and today its 78, thats meaningful. Even if 78 is "normal" for most people.

I compute rolling 7-day baselines for every metric. Mean, standard deviation, min, max. Then I use z-scores to flag when something is more than 1.5 standard deviations from your personal normal. Thats when Bloomie says "something looks different today."

## The Garden Mapping

This took a lot of thought. I had to decide what each visual element means.

Sleep controls the sky because sleep is foundational. Good sleep gives you clear skies. Bad sleep brings clouds.

Steps bring butterflies because movement should feel light and playful.

Hydration fills the pond because water is literal.

Social connection brings birds because they carry messages.

Mindfulness creates fireflies because it only shows up when you slow down enough to notice.

The main tree grows with consistency. Not perfection. Just showing up.

## Safety and Guardrails

The hackathon description specifically said chatbots should not be vulnerable to negative talk. I took this seriously. I built three layers of protection.

First, regex-based crisis detection. If someone says anything related to self-harm, the system immediately responds with helpline numbers. 988, Crisis Text Line. No LLM involved. Just instant resources.

Second, negative self-talk detection. If someone says "I am worthless" or "nobody loves me," Bloomie responds with empathetic reframing. It validates the feeling but redirects gently.

Third, the system prompt explicitly tells the LLM to never validate harm, never diagnose, never agree with self-criticism, and always suggest professional help for serious concerns.

## The Voice Check-in

This was inspired by how people actually talk about their health. Nobody says "my mood is 7 out of 10." They say "I slept okay but I am feeling kinda stressed and had too much coffee." So I built an endpoint that takes natural language and uses the LLM to extract structured metrics from it. Sleep hours, mood score, stress level, caffeine intake. All pulled from casual speech.

The frontend uses the Web Speech API so you can literally tap the mic and just talk. It feels natural.

## The Wellness Score

I researched how composite health scores work in the literature. Allostatic load uses biomarkers with equal weighting, but I thought a weighted approach makes more sense for daily wellness. Sleep gets 25% because research shows its foundational. Activity gets 20%. Hydration 15%. Mood 15%. Recovery 10%. Consistency 15%.

The result is a single number 0 to 100 that actually means something and updates as you log data.

## Chronotype Detection

I learned about the Lion, Wolf, Bear, Dolphin chronotype model. Your sleep timing reveals whether you are an early bird, night owl, or somewhere in between. Bloomie detects this from your sleep patterns and then suggests optimal times for exercise, focus work, and winding down.

## Social Jet Lag

This is from real research by Wittmann and colleagues. The difference between your weekday and weekend sleep schedule creates a kind of internal jet lag. More than 1 hour difference is associated with higher BMI and worse wellbeing. Bloomie calculates this automatically and shows you the impact.

## The Gamification

I did not want boring streaks. I wanted quests. Little daily challenges that feel like a game. Drink water is a Pond Quest. Walk is a Butterfly Quest. Each completed log plants something specific in your garden. A Water Lily for hydration. A Monarch butterfly for steps. A Night Star for sleep.

The 8-level progression system means your garden literally expands over time. You start with a seedling and eventually unlock a full enchanted night garden with northern lights.

## Design Decisions

I chose soft rounded fonts. Nunito for body text and Outfit for headings. Both friendly. Nothing clinical.

The color palette avoids pure whites and harsh colors. Everything is slightly warm. Cream backgrounds. Sage greens. Gentle lavenders. The vibe is cozy and inviting.

Glassmorphism for the overlay cards because it lets the 3D scene show through and creates depth without heaviness.

Every interaction has a subtle animation. Buttons scale on tap. Cards float on hover. Pages transition smoothly. It makes the whole thing feel responsive and alive.

## The 3D Garden

The floating island has a main tree, flowers, a pond with lily pads, a cottage with glowing windows at night, a campfire, rabbits, a stone path, and rocks on the edges. At night, stars appear, the moon rises, and fireflies glow. At sunset, everything turns warm orange.

The camera slowly orbits the island. Butterflies flutter with random movement. Birds circle overhead. Clouds drift. The island itself gently floats up and down.

Its not photorealistic. Its not trying to be. Its cel-shaded and cozy. Like a little world you want to visit.

## Deployment

Supabase for the database because its free, instant, and gives me Postgres with zero config. Railway for the backend because it deploys from GitHub automatically. Vercel for the frontend because Next.js just works there.

The whole thing deploys in under 3 minutes when I push to main.

## What I Learned

The hardest part was not the code. It was deciding what NOT to build. I could add a million features but the garden metaphor only works if its simple enough that people actually understand it without reading a manual.

The second hardest part was making the AI feel warm without being fake. Bloomie has to sound caring but never condescending. Encouraging but never dismissive of real problems. Thats a hard tone to nail in a system prompt.

The third thing I learned is that safety features are not optional for wellness apps. Someone will type something dark into any chatbot. You have to be ready for that moment.

## The Result

Bloomie is a wellness companion that turns your real health data into a living garden. It tracks you without judging you. It notices changes without diagnosing them. It grows with you. And it never ever makes you feel bad about a rough day.

Thats what I wanted to build. And I think I got pretty close.
