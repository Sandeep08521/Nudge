# Nudge 🌍
> **Take Back Recurring Spend** — The universal subscription awareness, AI cost-per-use audit, and direct payment cancellation assistant.

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-100%25_Free_Beta-amber.svg)]()

---

## 📌 Table of Contents
- [The Problem: The Hidden Bleed of Subscriptions](#-the-problem-the-hidden-bleed-of-subscriptions)
- [Why Nudge? Radical Simplicity & Privacy](#-why-nudge-radical-simplicity--privacy)
- [How Nudge Compares](#-how-nudge-compares)
- [Key Features](#-key-features)
  - [1. AI Cost-Per-Use (CPU) Audit & Health Score](#1-ai-cost-per-use-cpu-audit--health-score)
  - [2. Multi-Currency Support ($, €, £, C$, A$, ₹)](#2-multi-currency-support------c-a-)
  - [3. Universal Cancellation Hub](#3-universal-cancellation-hub)
  - [4. Client-Side Statement & Alert Parser](#4-client-side-statement--alert-parser)
  - [5. 1-Click Phone Calendar Sync (.ics) for Pre-Debit Alarms](#5-1-click-phone-calendar-sync-ics-for-pre-debit-alarms)
  - [6. Consumer Refund & Cancellation Notice Generator](#6-consumer-refund--cancellation-notice-generator)
  - [7. Flexible Billing Cycles & Shared Plan Splitter](#7-flexible-billing-cycles--shared-plan-splitter)
  - [8. Sign In with Google or Email (Dual Engine)](#8-sign-in-with-google-or-email-dual-engine)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [Getting Started Locally](#-getting-started-locally)
- [Connecting Supabase Cloud (Optional)](#-connecting-supabase-cloud-optional)
- [Deploying to GitHub & Vercel](#-deploying-to-github--vercel)

---

## 💥 The Problem: The Hidden Bleed of Subscriptions

Recurring subscriptions have proliferated globally — streaming services, cloud storage, productivity suites, fitness apps, AI copilots, and trial memberships.

While starting a subscription takes a single tap, managing and cancelling them is engineered with deliberate friction:
1. **Dark Pattern Cancellations:** Companies intentionally bury cancellation buttons behind multi-step surveys, phone queues, and misleading retention prompts.
2. **Silent Renewals:** Free trials and annual plans convert without timely alarms, leaving consumers with unwanted charges that have already posted to their cards.
3. **The "Silent Waste" Trap:** You might pay $15.49/month for a streaming service or $20.00/month for an AI tool, but only use it once every few weeks. Without tracking your **Cost-Per-Use (CPU)**, recurring micro-charges invisibly erode your monthly budget.

---

## 🛡️ Why Nudge? Radical Simplicity & Privacy

Commercial subscription apps (like Rocket Money) come with critical compromises:
- ❌ **Invasive Account Linking:** They require your banking login credentials via Plaid, read your private email inbox, or track device activity.
- ❌ **Extractive Business Models:** They charge subscription fees and take 35%–60% of any "negotiated savings".
- ❌ **Fragile Browser Automation:** They attempt to cancel on your behalf using fragile automation bots that frequently break.

### The Nudge Philosophy:
- 🔒 **Zero Bank Logins:** We never ask for bank account credentials or financial aggregators.
- 📬 **Zero Inbox Scraping:** No Gmail reading, no OAuth mailbox permissions.
- 🌐 **Global & Multi-Currency:** Built with first-class support for USD ($), EUR (€), GBP (£), CAD (C$), AUD (A$), and INR (₹).
- ⚡ **Direct Platform Cancellation:** Guides you to terminate recurring mandates at the source — Apple App Store, Google Play, PayPal, Card Portals, and Bank Direct Debits.
- 💸 **100% Free & Transparent:** No paywalls, no commission cuts. All AI audits, statement parsers, calendar alerts, and cancellation tools are completely unlocked.

---

## 📊 How Nudge Compares

| Feature | Nudge (Global) | Commercial US Apps (Rocket Money) | Spreadsheets / Notes App |
| :--- | :---: | :---: | :---: |
| **Requires Bank / Financial Login** | ❌ **Never** (Zero Access) | ⚠️ Mandatory (Plaid) | ❌ None |
| **Scrapes Personal Email Inbox** | ❌ **Never** | ⚠️ Often requested | ❌ None |
| **Direct Platform Revocation Guides** | ✅ **Apple, GPlay, PayPal, Cards, Banks** | ⚠️ Limited or third-party bots | ❌ No |
| **AI Cost-Per-Use (CPU) Audit** | ✅ **Included Free** | ❌ No | ⚠️ Manual formulas |
| **Client-Side Statement Parser** | ✅ **100% Browser-Side** | ❌ Backend storage & parsing | ❌ No |
| **Phone Calendar (.ics) Alerts** | ✅ **3-day & 24h alarms** | ❌ Push notifications only | ❌ Manual setup |
| **Multi-Currency Switching** | ✅ **$, €, £, C$, A$, ₹** | ❌ Single currency | ⚠️ Manual |
| **Cost / Monetization** | 🟢 **100% Free Beta** | 🔴 Monthly fee + 35–60% cut | 🟢 Free |

---

## 🚀 Key Features

### 1. AI Cost-Per-Use (CPU) Audit & Health Score
Log how often you actually use each subscription (`Daily`, `Weekly`, `Monthly`, `Rarely`, `Never`).
* Computes your **actual cost per session** (e.g. $15.49/mo used twice = $7.75 per session).
* Categorizes services into **Money Leaks**, **Fair Value**, and **Great Value**.
* Delivers an overall **Portfolio Health Score (0–100)** with actionable optimization steps.
* Analyzes international cross-border FX markups and recurring tax overhead.

### 2. Multi-Currency Support ($, €, £, C$, A$, ₹)
* Seamlessly select your default currency in Settings or during entry.
* Formats all metrics, cards, advisor tips, and import templates dynamically across your chosen currency.

### 3. Universal Cancellation Hub
Stop recurring charges at the payment platform level before your card is debited:
* **Apple Subscriptions (iOS):** Settings ➔ Apple ID ➔ Subscriptions ➔ Cancel.
* **Google Play (Android):** Play Store ➔ Payments & Subscriptions ➔ Subscriptions ➔ Cancel.
* **PayPal Automatic Payments:** Settings ➔ Payments ➔ Automatic Payments ➔ Cancel Authorization.
* **Credit & Debit Cards:** Step-by-step guidance to revoke recurring merchant tokens directly through your bank's app.
* **Direct Guides:** One-click links and cancellation paths for 30+ major global platforms (Netflix, Spotify, Amazon Prime, YouTube Premium, Disney+, ChatGPT Plus, Adobe Creative Cloud, iCloud, etc.).

### 4. Client-Side Statement & Alert Parser
Have dozens of recurring charges and don't want to type them one by one?
* Paste credit card transactions, bank statement exports, or payment notification messages.
* The multi-currency parser runs **100% locally in your browser** to extract merchant names, amounts, and dates.
* Review, tweak, and approve parsed items in an interactive staging ledger before adding them to your workspace.

### 5. 1-Click Phone Calendar Sync (.ics) for Pre-Debit Alarms
Export your renewal schedule to Apple Calendar, Google Calendar, or Microsoft Outlook in one click:
* Automated alarms are configured for **3 days before** and **24 hours before** renewal dates, ensuring you never miss a cancellation cutoff.

### 6. Consumer Refund & Cancellation Notice Generator
Billed accidentally by a forgotten trial or unwanted renewal?
* Instantly generate legally structured, polite refund requests and cancellation notices.
* One-click copy or launch directly in your default email client (`mailto:`).

### 7. Flexible Billing Cycles & Shared Plan Splitter
* Supports **Monthly**, **Quarterly (3 months)**, **Semi-Annual (6 months)**, and **Yearly** billing cycles.
* Built-in cost splitter for family plans and team workspaces — enter the total bill and your share, and Nudge tracks only what you pay.

### 8. Sign In with Google or Email (Dual Engine)
* **Continue with Google:** Quick one-click authentication.
* **Instant Offline / Local Mode:** Private accounts stored securely in browser storage — zero external configuration required to get started immediately.
* **Supabase Cloud Sync:** Optional multi-device synchronization backed by PostgreSQL and database-level Row Level Security (RLS).

---

## 🛠️ Tech Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript | Strict type safety, clean component architecture |
| **Build Tool** | Vite 8.3 | Lightning-fast HMR and optimized production bundles |
| **Styling** | Tailwind CSS 3.4 | Clean editorial financial ledger design system |
| **Routing** | React Router DOM v7 | Single-page application with catch-all routing for Vercel |
| **Icons** | Lucide React | Modern, clean iconography |
| **UI Components** | Radix UI Primitives | Accessible dialogs, labels, tabs, and modals |
| **Backend / DB** | Supabase (PostgreSQL) | Optional authentication + Row Level Security (RLS) |

---

## 📁 Project Architecture

```
nudge-webapp/
├── public/                 # Static assets & icons
├── src/
│   ├── components/         # Modals, forms & UI primitives
│   │   ├── ui/             # Radix UI building blocks (Button, Dialog, Input, etc.)
│   │   ├── AddEditSubscriptionModal.tsx
│   │   ├── AIAdvisorSection.tsx
│   │   ├── CancellationModal.tsx
│   │   ├── RemindersModal.tsx
│   │   └── SubscriptionRow.tsx
│   ├── context/
│   │   └── SubscriptionContext.tsx  # Global reactive ledger state & currency switching
│   ├── layouts/
│   │   └── AppLayout.tsx   # Authenticated workspace header, sidebar & navigation
│   ├── lib/
│   │   ├── aiAdvisor.ts    # Cost-per-use computation & portfolio health scoring
│   │   ├── authService.ts  # Dual-mode auth (Supabase OAuth + local accounts)
│   │   ├── cancellationGuides.ts # Direct platform guides & refund email templates
│   │   ├── statementParser.ts    # Multi-currency client-side regex parser
│   │   ├── subscriptions.ts# Storage engine, CRUD & financial calculations
│   │   └── supabase.ts     # Supabase client & dynamic key management
│   ├── pages/
│   │   ├── LandingPage.tsx # Public homepage & interactive demo audit
│   │   ├── OverviewPage.tsx# High-level financial KPIs & renewal timelines
│   │   ├── SubscriptionsPage.tsx # Ledger with search, filters & quick-add
│   │   ├── AdvisorPage.tsx # AI Cost-Per-Use audit & actionable tips
│   │   ├── GuidesPage.tsx  # Universal cancellation hub & notice generator
│   │   ├── ImportPage.tsx  # Multi-currency statement & alert parser
│   │   └── SettingsPage.tsx# Currency preference, JSON/CSV exports & Cloud Sync
│   ├── auth.tsx            # Login, registration & Google account picker
│   ├── App.tsx             # Route definitions & authentication gates
│   ├── main.tsx            # Application entry point
│   └── styles.css          # Tailwind base & custom ledger styling
├── supabase/
│   └── schema.sql          # PostgreSQL table DDL & Row Level Security policies
├── vercel.json             # SPA routing rewrite rules for Vercel deployment
├── vite.config.ts          # Vite configuration & path aliases
└── package.json            # Project dependencies & scripts
```

---

## 💻 Getting Started Locally

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [npm](https://www.npmjs.com/)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser:
* The public **Landing Page** introduces the platform.
* Click **"Get Started Free"** or **"Sign In"** to test with Google or email.
* Local encrypted storage allows you to test immediately without configuring cloud keys!

### 3. Build for Production
```bash
npm run build
```

---

## ☁️ Connecting Supabase Cloud (Optional)

If you wish to enable multi-device synchronization:

1. Create a free account at [supabase.com](https://supabase.com) and create a project.
2. In the Supabase dashboard, navigate to **SQL Editor** ➔ **New Query**.
3. Paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**. This configures the `subscriptions` table and strict Row Level Security (RLS) rules so users can only ever access their own data.
4. Copy your project's **API URL** and **Anon Key**:
   * Either add a `.env` file in the root directory:
     ```env
     VITE_SUPABASE_URL=https://your-project-id.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key-here
     ```
   * Or simply open the app, navigate to **Settings**, and paste your keys into the **Cloud Sync** panel!

---

## 🚀 Deploying to GitHub & Vercel

### Step 1: Push Code to GitHub

Open your terminal in the project directory (`nudge-webapp`) and run:

```bash
# 1. Initialize git repository
git init

# 2. Stage all files
git add .

# 3. Create the initial commit
git commit -m "feat: complete global Nudge subscription tracker"

# 4. Set default branch to main
git branch -M main

# 5. Link your GitHub repository (replace with your repo URL)
git remote add origin https://github.com/<YOUR-USERNAME>/nudge-webapp.git

# 6. Push to GitHub
git push -u origin main
```

### Step 2: Deploy on Vercel

1. Log in to [vercel.com](https://vercel.com) using your GitHub account.
2. Click **"Add New..."** ➔ **"Project"** and import your `nudge-webapp` repository.
3. Vercel automatically detects Vite:
   * **Framework Preset:** `Vite`
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
4. *(Optional)* Under **Environment Variables**, add:
   * `VITE_SUPABASE_URL`
   * `VITE_SUPABASE_ANON_KEY`
5. Click **"Deploy"**.

Your application will be live globally in under a minute! All client routes (`/dashboard`, `/subscriptions`, `/auth`, etc.) will route seamlessly thanks to the configured [`vercel.json`](vercel.json) rewrites.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.
