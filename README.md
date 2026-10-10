# Rural Road Connectivity & Market Access Index

A data-driven decision-support platform for infrastructure planners and policymakers to identify which rural villages need paved road access most urgently — and quantify the economic and humanitarian return on each investment.

**Live demo:** [rural-road-connectivity.pages.dev](https://rural-road-connectivity.pages.dev/)

---

## What It Does

Thousands of rural villages lack all-weather road connectivity. With limited budgets, planners need to know which villages to prioritise first and what the return on investment would be. This platform answers exactly that.

It ingests village-level data across four critical sectors and computes two composite scores:

| Score | What It Measures |
|-------|-----------------|
| **MAI** (Market Accessibility Index) | Economic ROI from connecting the village — crop loss recovery, income gain, job access |
| **CAS** (Comprehensive Accessibility Score) | Isolation severity across 7 pillars — urban access, road quality, highways, healthcare, education, markets, transit |

---

## Features

### Five Modules

- **Overview** — Hero landing page explaining the platform's mission and four evaluation pillars
- **Priority Leaderboard** — Villages ranked by investment priority (MAI + 10-year ROI multiplier), filterable by district, road condition, and terrain
- **CAS Accessibility Ranking** — Villages ranked by isolation severity; lowest CAS = most cut off; per-village 7-pillar breakdown
- **Village Map Inspector** — Interactive Leaflet GIS map showing radial route diagrams to hospitals, APMC mandis, urban hubs, and KSRTC bus stops with road quality encoding
- **Budget Simulator** — Allocate a state infrastructure budget and see which villages fit, with projected 10-year ROI and custom village evaluator

### Scoring Methodology

**MAI** combines:
- Post-harvest crop loss recovery from reduced spoilage
- Agricultural income gain from APMC mandi access
- Non-farm employment and job access multiplier
- 10-year projected ROI per rupee of road investment

**CAS** scores isolation across 7 weighted dimensions:
1. Urban centre proximity
2. Road surface quality (kutcha / gravel / paved)
3. Highway access
4. Healthcare distance (hospital / PHC)
5. Education access (secondary school)
6. APMC market proximity
7. Public transit (KSRTC bus connectivity)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JS + Vite |
| Maps | Leaflet.js (bundled locally) + OpenStreetMap / Esri / CartoDB tiles |
| Styling | CSS with glassmorphism / brutalist editorial theme |
| Typography | Inter, JetBrains Mono, Bebas Neue (Google Fonts) |
| Deployment | Cloudflare Pages (auto-deploys on push to `main`) |
| Backend | None — fully client-side, zero server cost |

---

## Project Structure

```
rural-road-connectivity/
├── index.html                  # App shell + all tab views
├── src/
│   ├── css/
│   │   ├── style.css           # Design tokens, layout, hero
│   │   ├── components.css      # Cards, tables, forms, modals
│   │   └── map.css             # Map tab and Leaflet overrides
│   ├── js/
│   │   ├── app.js              # Main controller, tab routing, filters
│   │   ├── components/
│   │   │   ├── mapViewer.js    # Leaflet GIS map renderer
│   │   │   ├── villageTable.js # Priority leaderboard table
│   │   │   ├── casRanking.js   # CAS ranking view
│   │   │   ├── simulator.js    # Budget simulator + custom calculator
│   │   │   ├── dashboard.js    # KPI summary cards
│   │   │   └── modal.js        # Village inspection modal
│   │   ├── engine/
│   │   │   ├── indexCalculator.js  # MAI + CAS scoring engine
│   │   │   └── budgetOptimizer.js  # Budget allocation algorithm
│   │   └── data/
│   │       └── villages.js     # Village dataset (Phase 1: synthetic)
│   └── lib/
│       ├── leaflet.js          # Leaflet bundled locally
│       └── leaflet.css
├── vite.config.js
└── package.json
```

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

Requires Node.js 18+.

---

## Data

The current dataset (`villages.js`) is a synthetic illustrative dataset of ~30 villages across multiple districts, designed to validate the scoring model and demonstrate the platform's capabilities.

**Phase 2 integration** would replace `villages.js` with a data pipeline ingesting real government open data:

| Data Field | Source |
|-----------|--------|
| Village list + population | [Census of India](https://censusindia.gov.in) |
| Road type, condition, length | [PMGSY OMMAS](https://omms.nic.in) |
| APMC mandi locations | [Agmarknet](https://agmarknet.gov.in) |
| Hospital / PHC locations | [Health Facility Registry (ABDM)](https://hfr.abdm.gov.in) |
| GPS coordinates | [Bhuvan (ISRO)](https://bhuvan.nrsc.gov.in) |
| Bus routes | KSRTC divisional offices (no public API) |
| Monsoon isolation days | District RDPR / PWD records (formal request) |

The scoring engine (`indexCalculator.js`) requires no changes — only the data source changes.

---

## Target Users

- **RDPR / PWD** — Annual road budget allocation backed by ranked, evidence-based data
- **PMGSY Planners** — Identify villages meeting scheme eligibility while maximising connectivity impact per rupee
- **District Collectors** — Filter by district, simulate local budgets, prepare data-backed recommendations

---

## SDG Alignment

| Goal | Connection |
|------|-----------|
| SDG 1 — No Poverty | Economic uplift through market and employment access |
| SDG 3 — Good Health | Reduced emergency hospital transit times |
| SDG 8 — Decent Work & Economic Growth | Non-farm job access for rural youth |
| SDG 9 — Industry, Infrastructure & Innovation | Last-mile road infrastructure prioritisation |
| SDG 10 — Reduced Inequalities | Closing the urban-rural access gap |

---

## Deployment

Hosted on Cloudflare Pages. Every push to `main` triggers an automatic deploy.

```
Production: https://rural-road-connectivity.pages.dev/
Repository: https://github.com/vinaysharshit23-ctrl/rural-road-connectivity
```

---

## License

MIT
