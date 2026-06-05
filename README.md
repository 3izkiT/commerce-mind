# คิดคำขาย.com

AI-powered short-form video script generator for Thai merchants and creators. Generate Hook + Body scripts from product details, view the Hook for free, and unlock the full Body via PromptPay (29 THB).

> Package name remains `commerce-mind` for technical compatibility.

## Tech Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** + Shadcn UI (Silent Luxury style)
- **Google Gemini** (`gemini-1.5-pro-001`) for script generation
- **Money Space API** for PromptPay QR payments
- **Upstash Redis** for rate limiting (no database)

## Getting Started

```bash
npm install
cp .env.local.example .env.local
# Fill in your API keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes (prod) | Google AI Studio API key |
| `MONEYSPACE_API_KEY` | Yes (prod) | MoneySpace secret ID |
| `MONEYSPACE_SECRET` | Yes (prod) | MoneySpace secret key |
| `UPSTASH_REDIS_REST_URL` | No | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash Redis REST token |

Without Money Space credentials, the app runs in **mock mode** (auto-completes payment after 12s). Without Upstash, rate limiting is skipped in dev.

## API Routes

- `POST /api/generate-script` — Generate script (rate limited: 1/IP/24h)
- `POST /api/moneyspace-gate` — Create PromptPay QR payment
- `GET /api/moneyspace-check?tx=...` — Poll payment status

## Pricing

- Single unlock: **29 THB** (MVP)

## Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy
