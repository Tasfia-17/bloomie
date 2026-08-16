# how i built bloomie (my thought process)

okay so. i was sitting there staring at all these health apps on my phone and they all made me feel like garbage. like congrats you only walked 3000 steps today, heres a red bar. thanks i feel worse now. 

and i thought what if instead of charts and numbers and angry notifications, your health data just... grew a garden. like a little floating island that gets prettier when you take care of yourself. no judgment. no red. just life.

thats where bloomie came from.

i had this older project from a hackathon called canopy that did health monitoring stuff. it had supabase and fastapi and some 3d scenes already. so i didnt start from zero. i took the bones and rebuilt everything around this garden idea.

the first thing i figured out was the mapping. like what does each part of the garden mean. and i went back and forth a lot on this. eventually i landed on sleep affecting the sky because sleep is literally the foundation of everything. if you sleep badly the whole world should feel different. not dead. just... cloudy.

then steps bring butterflies because movement should feel light. hydration fills the pond because water is water. social connection brings birds because birds carry messages. mindfulness grows fireflies because you only see them when you slow down.

and the tree. the big tree grows with consistency. not perfection. just you showing up. i liked that.

for the tech i used next.js because its what i know. react 19. tailwind for the styling because i move fast with it. framer motion for animations because without it everything feels dead. and three.js for the 3d garden. i thought about react three fiber but i wanted full control over every vertex so i went raw.

the backend is fastapi with a langgraph pipeline. this is the part i spent the most time thinking about. i didnt want to just throw everything at an llm and pray. so i built a proper state machine. step 1 normalize data. step 2 compute personal baselines from YOUR history not some population average. step 3 detect deviations using z-scores. step 4 assess risk with deterministic rules. step 5 THEN let the ai generate a narrative.

the ai only writes. it never decides. the decisions are all rule-based. this matters.

for the llm i use openrouter with gemini 2.5 flash. fast, cheap, good enough. the structured extraction from voice check-ins works surprisingly well.

speaking of voice. i built this thing where you can just tap the mic and say "i slept 6 hours and had too much coffee and im feeling kinda stressed" and the ai pulls out sleep_hours: 6, caffeine_mg: 190, stress: 7. then stores all of it. then updates your garden. thats the magic moment i think.

the wellness score took me a while. i researched how allostatic load scoring works in the literature and decided on weights. sleep 25% because its foundational. activity 20%. hydration 15%. mood 15%. consistency 15%. recovery 10%. gives you a single number out of 100 that actually correlates with how youre doing.

chronotype detection was fun. lion wolf bear dolphin model. i detect it from your sleep timing patterns. then suggest when you should exercise, when your focus peaks, when to wind down. its personalized to your biology not some generic "exercise in the morning" advice.

social jet lag is a real thing from the research. its the difference between your weekday and weekend sleep. more than 1 hour and it correlates with metabolic issues. i calculate it automatically.

the safety stuff. okay this is important. the hackathon specifically said chatbots should not be vulnerable to negative talk. so i built three layers. first: regex crisis detection. if someone types anything about self harm, instant helpline numbers. no ai involved. instant. second: negative self talk patterns trigger empathetic reframing. validates the feeling, redirects gently. third: the system prompt has explicit rules. never validate harm. never diagnose. never agree with self criticism.

i tested it by typing horrible things to bloomie and making sure it always responded with care. it does.

the gamification. i didnt want boring streaks. i wanted quests. pond quest: drink water. butterfly walk: take steps. firefly breathe: do breathing exercise. every single log plants something specific in your garden. water lily for hydration. monarch butterfly for steps. night star for sleep. you literally see your garden fill up with things you earned.

kindness bingo was a last minute addition but i love it. 5x5 grid of random acts of kindness. it detects when you get a line. its dumb and simple and it makes people smile.

the breathing exercise page is dark themed on purpose. dark background, ambient particles, expanding circle. i wanted it to feel like its own little world separate from the rest of the app. peaceful.

design wise i went full soft. cream backgrounds. sage greens. lavender. peach. rounded everything. no sharp corners anywhere. glassmorphism for the cards so the 3d shows through. large touch targets. no tiny buttons. the whole thing should feel like a hug not a spreadsheet.

the floating island has a cottage with windows that glow at night. it has a campfire with flickering light. rabbits hop gently. a stone path winds through. at night the stars come out and the moon rises. none of this is necessary for function. all of it is necessary for feeling.

i deploy on vercel for frontend and railway for backend and supabase for the database. push to github and everything auto deploys in 2 minutes. the whole stack is free tier.

honestly the hardest part wasnt coding. it was tone. making bloomie sound warm without sounding fake. encouraging without being dismissive. noticing changes without causing anxiety. thats a system prompt problem not a code problem and i rewrote it like 5 times.

the second hardest part was deciding what the garden should NOT do. it should never punish. rain is not punishment its just change. a cloudy sky is not failure its just a signal. even on your worst day the garden has life in it. flowers still exist. the pond still has water. nothing dies.

thats the whole philosophy. your wellness is a living thing. it changes. it grows. sometimes its rainy. but rain helps things grow too.

i think thats what makes bloomie different from every other health app ive seen. it doesnt make you feel bad. it just grows with you.
