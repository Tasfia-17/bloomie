# 🌸 Bloomie

**Your little world for a healthier life.**

Bloomie is a living wellness companion that connects your real-world health data, daily habits, environment, schedule, and social life into a personalized 3D world. Instead of showing endless charts and notifications, Bloomie turns your wellness into a living garden.

- Your sleep affects the sky
- Your activity brings butterflies
- Your hydration fills the pond
- Your recovery grows the trees
- Your social connection brings birds
- And when something meaningfully changes in your health, Bloomie notices

> The garden is delightful. The intelligence underneath is serious.

## 🎯 Track: Wellness

Bloomie is built for the **Wellness track**. It's a technically solid project with real health data processing, mood journaling, hydration tracking, breathing exercises, AI-powered insights, and proper safety guardrails.

## ✨ Key Features

### 🌳 3D Living Garden
A floating island rendered in Three.js that reflects your wellness state in real-time. Clear skies mean good sleep. Butterflies mean activity. Fireflies appear from mindfulness. The garden never dies or punishes you. It just changes.

### 🧠 Personal Baseline Engine
Bloomie doesn't use population averages. It learns YOUR patterns over a 7-day rolling window, computes personal baselines per metric, and detects meaningful deviations using z-scores. When your resting heart rate is 77 but your normal is 62-68, Bloomie notices.

### 🐰 AI Companion (with Guardrails)
Talk to Bloomie anytime. Voice or text. Bloomie uses OpenRouter LLMs for natural, warm conversation with:
- **Crisis detection**: Immediate helpline routing (988, Crisis Text Line)
- **Negative self-talk detection**: Empathetic positive reframing
- **Safety system prompt**: Never validates harm, never diagnoses, always redirects to professionals

### 🧘 Breathing Exercise
Guided breathing with animated expanding/contracting circle. Choose from 4-7-8 Calm, Box Breathing, Quick Calm, or Energy Boost patterns. Completion grows fireflies in your garden.

### 📊 "Why?" Button
Every observation has a "Why?" button. Bloomie explains what data changed, by how much, and always states what it cannot determine (medical causes). Full transparency over black-box magic.

### 🏆 Wellness Quests
Daily micro-challenges (drink water, take a walk, message someone) that unlock garden items. Progressive ecosystem with 8 levels from Seedling to Enchanted garden.

### ☕ Caffeine Intelligence
Tracks caffeine intake and correlates with sleep patterns. Discovers personalized insights like "You sleep 40 minutes less on days with afternoon caffeine."

### 🌤️ Weather Integration
Weather affects your garden (hot days evaporate the pond) and drives personalized recommendations (extra hydration reminders on warm days).

### 📅 Calendar Awareness
Bloomie reads your calendar and finds tiny wellness breaks between meetings. Instead of "Exercise 30 minutes today," it says "I found three tiny spaces for you."

### 🪺 Social Wellness (Nest)
Add people you care about. Bloomie suggests check-ins when it's been too long. Birds appear in your garden when you connect.

### 👨‍👩‍👧 Family Dashboard
Family sees green/yellow/red status without needing every detail. Only serious situations become alerts. No notification fatigue.

### 🏥 Clinical Dashboard
For healthcare professionals. Patient timeline, anomaly detection against baselines, and AI-generated clinical summaries.

### 🔐 Privacy Controls
Granular permissions matrix. Users control exactly what each audience (family, clinician) can see. Audit log. GDPR deletion support.

### 🎵 Spotify Integration
Context-aware playlist suggestions based on mood, weather, and time of day. "Rainy day? Want some cozy music while we sit here?"

### 🔥 Streak System
Visual fire animation that scales with streak length. Milestone celebrations at 3/7/14/21/30/60/100 days with garden rewards.

## 🏗️ Architecture

```
Frontend (Next.js 15 + React 19 + Three.js + Framer Motion + Tailwind)
  |
  | REST API
  v
Backend (FastAPI + LangGraph + OpenRouter + Supabase)
  |
  | AI Pipeline (LangGraph State Machine)
  v
normalize_data -> compute_baselines -> detect_deviations -> assess_risk -> generate_narrative
```

### Frontend Pages (17 routes)

| Route | Purpose |
|-------|---------|
| `/` | Immersive 3D landing with navigation cards |
| `/login` | Auth with demo accounts |
| `/signup` | Registration with garden metaphor |
| `/onboarding` | 4-step animated tutorial for new users |
| `/garden` | Full 3D floating island scene |
| `/today` | Daily dashboard (weather, calendar, caffeine, quests) |
| `/checkin` | Mood + Energy + Stress + Journal flow |
| `/breathe` | Guided breathing with animated circle |
| `/insights` | Weekly trends, AI patterns, Why? explanations |
| `/nest` | Social wellness contacts and family view |
| `/ecosystem` | Unlockable progression (8 levels) |
| `/streak` | Streak gamification with fire animations |
| `/clinical` | Professional dashboard |
| `/privacy` | Granular sharing permissions |

### Backend Routers (14 endpoints)

| Router | Purpose |
|--------|---------|
| `wellness` | Normalized health data ingestion + AI pipeline |
| `today` | Daily summary with Bloomie's thought |
| `insights` | Weekly trends, AI patterns, Why? explanations |
| `chat` | AI companion with safety guardrails |
| `nest` | Social contacts and family dashboard |
| `quests` | Gamification with garden unlock rewards |
| `weather` | OpenWeather API with garden effects |
| `calendar` | Finds wellness breaks between meetings |
| `nutrition` | Food logging focused on balance (not calories) |
| `caffeine` | Sleep correlation analysis |
| `spotify` | Context-aware playlist recommendations |
| `ecosystem` | 8-level progression system |
| `clinical` | Patient timeline and AI clinical summary |
| `privacy` | Permissions matrix and audit log |

### AI Pipeline (LangGraph)

```
Raw Data -> Data Normalizer -> Personal Baseline -> Trend Detection
                                                         |
                                    +--------------------+--------------------+
                                    |                                         |
                              Habit deviation                           Vital deviation
                                    |                                         |
                                    +--------------------+--------------------+
                                                         |
                                                    Risk Engine
                                                         |
                                               Contextual Reasoning
                                                         |
                                    +--------------------+--------------------+
                                    |                    |                    |
                              No action            User prompt           Caregiver
```

## 🎨 Design Language

**Visual direction**: Animal Crossing x Headspace x Apple Health

- **Colors**: Soft pastels (cream, sage, lavender, sky blue, peach, warm yellow)
- **Cards**: Large rounded corners, soft shadows, glassmorphism
- **Typography**: Nunito (body) + Outfit (display), friendly and rounded
- **Animations**: Subtle (flowers sway, water moves, butterflies fly, plants grow)
- **3D**: Cel-shaded floating island with day/sunset/night modes

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript |
| 3D Rendering | Three.js (raw, no R3F) |
| Animations | Framer Motion |
| Styling | Tailwind CSS 3.4 |
| Icons | Lucide React |
| Backend | FastAPI (Python 3.11) |
| AI Pipeline | LangGraph |
| LLM | OpenRouter (Google Gemini 2.0 Flash) |
| Database | Supabase (PostgreSQL) |
| Auth | Cookie-based with Supabase Auth (RLS-ready) |
| Weather | OpenWeatherMap API |

## 🚀 Getting Started

### Prerequisites

- Node.js 22+
- Python 3.11+
- Supabase account (free tier works)
- OpenRouter API key

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase URL
npm run dev
```

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your keys
uvicorn app.main:app --reload
```

### Database Setup

Run the SQL in `seed/setup_db.sql` in your Supabase SQL Editor to create all tables.

### Demo Data

```bash
cd seed
python seed_demo.py
```

This generates 14 days of realistic wellness data for the demo user (`bloom@bloomie.app` / `garden123`).

## 📱 Demo Accounts

| Email | Password | Description |
|-------|----------|-------------|
| `bloom@bloomie.app` | `garden123` | Full garden with 14 days of data |
| `lily@bloomie.app` | `bloom123` | Fresh start garden |

## 🔒 Safety Features

Bloomie is designed for the Wellness track and takes safety seriously:

1. **Crisis Detection**: Regex-based keyword detection for suicidal ideation/self-harm. Immediate routing to 988 Suicide & Crisis Lifeline and Crisis Text Line.

2. **Negative Self-Talk Detection**: Pattern matching for harsh self-criticism. Responds with empathetic reframing that validates feelings while redirecting.

3. **System Prompt Guardrails**: The AI is instructed to never validate harm, never diagnose, never agree with harsh self-criticism, and always suggest professional help for health concerns.

4. **No Shame Design**: The garden never "dies" or punishes. Rain means "something is different," not "you're unhealthy." Bad days show gentle skies, not dead plants.

5. **Privacy by Design**: Granular per-metric sharing controls, audit logs, encryption notes, and GDPR-compliant data deletion.

## 🌱 Garden Mapping

| Wellness Signal | Garden Element |
|----------------|----------------|
| Sleep | Sky clarity (clear/cloudy/stormy) |
| Activity/Steps | Butterflies |
| Hydration | Pond level |
| Recovery | Tree growth |
| Social connection | Birds |
| Nutrition balance | Fruit trees / flowers |
| Mindfulness | Fireflies |
| Consistency | Main tree size |
| Health deviation | Weather changes |

## 📂 Project Structure

```
bloomie/
├── frontend/                  # Next.js 15 application
│   ├── app/                   # App router pages (17 routes)
│   ├── components/            # Shared + feature components
│   │   ├── shared/            # BottomNav, BloomieChat, BlurFade
│   │   ├── garden/            # GardenScene3D (490 lines)
│   │   └── landing/           # LandingScene3D
│   └── lib/                   # API client, types, auth, utils
├── backend/                   # FastAPI application
│   └── app/
│       ├── routers/           # 14 API routers
│       ├── agents/            # LangGraph pipeline (nodes, graph, state, prompts)
│       ├── services/          # OpenRouter client, Supabase client
│       └── models/            # Pydantic schemas
├── seed/                      # Database setup + demo data
│   ├── setup_db.sql           # Full PostgreSQL schema
│   └── seed_demo.py           # 14-day demo data generator
└── README.md
```

## 🏆 What Makes Bloomie Special

1. **Personal baselines over population averages**: Your "normal" is what matters
2. **Garden as dashboard**: Wellness feedback without clinical anxiety
3. **AI transparency**: The "Why?" button shows exactly what changed
4. **Caffeine intelligence**: Personalized behavioral insights, not generic advice
5. **Calendar awareness**: Finds real breaks in your real schedule
6. **Progressive gamification**: The world literally grows with you
7. **Safety-first AI**: Proper guardrails for vulnerable users
8. **No shame, ever**: Even bad days have gentle rain, not punishment

---

Built with 💚 for the Wellness track.
