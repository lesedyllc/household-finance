# Household Finance

A static bill payment tracker for LESEDY LLC / household finance workflows.

## What it does

- Tracks recurring bills and due dates
- Flags bills due within 7 days
- Flags overdue bills
- Tracks autopay, account, priority, and business/personal/mixed classification
- Logs payments when you mark a bill as paid
- Exports bills and payment logs to CSV
- Backs up and restores data as JSON
- Stores changes in browser local storage

## Security

Do not commit bank usernames, passwords, full account numbers, Social Security numbers, private bank statements, or sensitive records to GitHub.

This starter uses account labels only, such as:

- Consumer/Personal Checking 1123996-S08
- Business Checking 861-S01
- Business Savings 861-S00
- Business Credit Card 861-L90
- Consumer Mastercard 996-L91

## Deploy on GitHub Pages

1. Create a new GitHub repository named `household-finance`.
2. Upload these files to the root of the repo:
   - `index.html`
   - `style.css`
   - `script.js`
   - `data.js`
   - `README.md`
3. In GitHub, go to **Settings > Pages**.
4. Under **Build and deployment**, select:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
5. Save.
6. Your site should publish at:
   `https://lesedyllc.github.io/household-finance/`

## Data notes

The seeded bill list is based on known recurring transaction patterns from the user's uploaded OFX history. It is a starter dataset only. Confirm exact due dates, minimum payments, autopay settings, and business vs personal classification before relying on it.
