# MarketMind

**Play an economy. Discover your decision personality.**

A deploy-ready behavioral-economics simulation built without generative AI. Players make nine connected economic decisions using continuous controls rather than quiz-style MCQs. The deterministic inference engine produces an Economic Decision Profile, explains the economics behind every choice, and generates a shareable PNG report card.

## What is included

- Beautiful responsive dark/light UI
- 9 connected simulation rounds
- Continuous sliders / budget-style choices, not an MCQ test
- Fictional world state: cash, investments, business value, reputation, wellbeing, social impact
- Explainable behavioral inference across 8 traits
- 8 personality archetypes selected by nearest trait-vector distance
- Confidence score per trait based on quantity and consistency of evidence
- End-of-game concept explanations for every choice
- Shareable 1080×1350 PNG report card
- Native Web Share support where available
- Session recovery with localStorage
- Optional Supabase server-side tracking for player names and usage
- Private `/admin.html` analytics dashboard
- No Gemini / OpenAI / LLM API
- No build step and no database required for the game itself

## UI polish update

This release improves the public simulation experience without changing the Supabase schema or tracking API:

- clearer assumptions and decision context in all nine rounds
- compact “known information” cards before each decision
- stronger visual differentiation between scenarios
- responsive layouts that avoid text/control overlap
- improved mobile spacing and slider readability
- cleaner result/profile layout and progress indicator

Existing Supabase tables and Vercel environment variables continue to work unchanged.

## Simulation concepts

1. Expected utility and risk-return trade-off
2. Anchoring, reference prices and willingness to pay
3. Demand elasticity, oligopoly and strategic interdependence
4. Sunk costs, marginal analysis and opportunity cost
5. Time preference and discounting
6. Herd behavior, social proof and information cascades
7. Public goods, free riders and collective action
8. Negative externalities, social cost and Pigouvian incentives
9. Loss aversion, prospect theory, ambiguity and rebalancing

## Easiest deployment: Vercel Drop

1. Zip the `marketmind` folder (or use the provided deploy-ready ZIP).
2. Open **Vercel Drop** in your browser and drag the ZIP onto the page.
3. Deploy it as-is. There is **no build command**, package install, or framework setting required.
4. The public game works immediately. If Supabase is not configured, tracking silently disables itself while local gameplay still works.

GitHub is optional and only becomes useful later if you want automatic deployments whenever you edit the code.

## Enable player tracking (recommended)

Create a free Supabase project, open **SQL Editor**, and run `supabase.sql`.

Then add these Vercel environment variables:

```text
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SECRET_KEY=sb_secret_YOUR_SECRET_KEY
ADMIN_KEY=choose-a-long-random-private-password
```

Redeploy. New game starts and progress will now appear in the `sessions` table.

### Important security note

Use the **Supabase secret key only as a Vercel server environment variable**. Never paste it into `app.js`, HTML, browser code, or any public/client environment variable. The code also supports the legacy `SUPABASE_SERVICE_ROLE_KEY` during Supabase's migration period, but `SUPABASE_SECRET_KEY` is preferred for new deployments.

## Admin analytics

Visit:

```text
https://YOUR_DOMAIN/admin.html
```

Enter the `ADMIN_KEY` you configured in Vercel. The dashboard shows:

- total starts
- total completions
- completion rate
- recent player names/status
- personality-type distribution (latest 1,000 completed sessions)

## Privacy before a public launch

The included privacy page is a strong MVP template, but before a broad public launch you should:

- add an operator contact/deletion email
- define a retention period
- decide whether names are actually necessary long-term
- consider pseudonymous names for public experiments
- add any legally required notices for your jurisdiction
- avoid using MarketMind results for employment, credit, investing or high-stakes profiling

## Personality engine

MarketMind does **not** ask users to self-rate traits. Each scenario contributes evidence to one or more latent traits:

- Risk appetite
- Loss sensitivity
- Patience
- Independent thinking
- Competitive drive
- Social orientation
- Value discipline
- Sunk-cost resistance

Trait scores are weighted averages of multiple behavioral signals. Confidence increases when a trait has more evidence and decreases when the signals conflict.

The personality archetype is selected by Euclidean distance between the final 8-dimensional trait vector and eight pre-defined archetype vectors. This prevents hard threshold discontinuities where a one-point change could create an unrelated type.

## Files

- `index.html` — main experience
- `styles.css` — full visual system
- `app.js` — simulation + scoring + report-card engine
- `api/session.js` — optional Supabase persistence
- `api/admin.js` — protected analytics endpoint
- `admin.html` — private analytics dashboard
- `privacy.html` — MVP privacy/disclaimer page
- `supabase.sql` — database schema
- `vercel.json` — deploy/security headers
- `favicon.svg` / `manifest.webmanifest` — branding/PWA metadata

## Local preview

Because the API functions are Vercel serverless functions, the easiest full local environment is Vercel CLI. For UI-only testing, any static server is enough:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

The UI works without the API; `/api/session` will simply fail silently during a static-only preview.

## Creator credit

The public footer currently credits **Jeetaksh Gandhi — MDI Gurgaon 2026–28 · LNMIIT CSE 2021–25** and links to `https://www.linkedin.com/in/jeetaksh/`.
