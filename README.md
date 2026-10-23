# Retirement Compass

A mobile + desktop web app (installable PWA) for retirement planning:

- **Track income and expenses** manually, by category, with search and filters.
- **Scan receipts** with your phone camera. Text is read on-device (Tesseract.js); amount, date, merchant and a suggested category are filled in for you to confirm.
- **Dashboard**: spending by category, monthly income vs. expense, key numbers, top risks.
- **Retirement plan & report**: savings by account type, income vs. expense, income sources, contributions, a "How much can I afford?" table, and plain-language risks (longevity, withdrawal rate, early market drop, inflation, early-withdrawal penalty, Social Security claiming, healthcare gap).
- **Private by default**: data lives in your browser (localStorage). Export/import JSON backups to move between phone and desktop; export CSV.

## Run

No build step. Serve the folder over HTTP (camera and install need HTTPS or localhost):

    python3 -m http.server 8000   # then open http://localhost:8000

Open it on your phone via a deployed HTTPS host (e.g. GitHub Pages) and use "Add to Home Screen".

## Layout

- `js/engine.js`: projection, Social Security factor, sensitivity and risk logic (pure, testable in node)
- `js/receipt.js`: OCR text parsing and category suggestion
- `js/charts.js`: dependency-free SVG charts
- `js/app.js`: UI and storage

Projections are simplified estimates, not financial, tax or investment advice.
