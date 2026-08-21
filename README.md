# BiteScouts

**F&B discovery platform with an owner visibility dashboard, AI restaurant chatbot, Food Buddy matching, and promotion tools.**

Built as a capstone project (Gamuda AI Academy). Helps diners find restaurants on a map and gives owners analytics from online visibility through to foot traffic.

---

## Features

### For diners (clients)

- **Map discovery** — browse restaurants, filters, restaurant pop-up cards
- **AI chatbot** — natural-language restaurant search (LangChain + Gemini/Ollama)
- **Food Buddy** — match with nearby users, real-time chat, plan a food date
- **Get Directions** — tracks visits for owner analytics

### For restaurant owners

- **Social Visibility Dashboard**
  - **Top Metrics** — rating, conversion, sentiment, weekly visitors, menu & financial trends (Google Sheets)
  - **Traffic & Conversion** — funnel: Impressions → Clicks → Get Directions
  - **Sentiment** — review sentiment and complaint/praise themes
  - **Customer Demographics** — age/gender from direction-click visitors
  - **Foot Traffic** — hourly patterns, this week vs last week
- **Promotion management** — create promos, AI-assisted suggestions

---

## Tech stack

| Layer              | Technologies                                                           |
| ------------------ | ---------------------------------------------------------------------- |
| **Frontend**       | React 19, TypeScript, Vite, Tailwind CSS, Recharts, MapLibre GL, Axios |
| **Backend**        | Python 3.12, FastAPI, SQLAlchemy, WebSockets                           |
| **Database**       | PostgreSQL                                                             |
| **AI / LLM**       | LangChain, Google Gemini (optional Ollama)                             |
| **Analytics data** | PostgreSQL + Google Sheets API (not Power BI)                          |
| **Auth**           | HttpOnly session cookies (JWT)                                         |
| **DevOps**         | Docker Compose                                                         |

---

## Project structure

capstone-project/ ├── front-end/ # React app ├── back-end/ # FastAPI API + LLM + jobs ├── docker-compose.yml # Postgres + frontend + backend ├── docs/ # Optional GitHub Pages guide └── README.md

---

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.12
- **Docker Desktop** (recommended) or local PostgreSQL
- Optional: **Gemini API key**, **Google Sheets credentials** for full analytics

---

## Quick start (Docker — recommended)

### 1. Clone the repo

```bash
git clone https://github.com/IzzahTajul/BiteScouts-capstone.git
cd bitescouts-capstone
```

Live demo link = https://bite-scouts.web.app/
