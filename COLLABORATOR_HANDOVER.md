# BLAZE ESCROW-LINK — COLLABORATOR & DEVELOPER HANDOVER GUIDE

Welcome to the **Blaze Escrow-Link** repository! This document serves as a complete technical handover for collaborators, detailing everything built, the architecture, state engine, user flows, database schema, and testing setup.

---

## 📋 Table of Contents
1. [Project Overview & Executive Summary](#1-project-overview--executive-summary)
2. [Tech Stack & Architecture](#2-tech-stack--architecture)
3. [Everything Built So Far](#3-everything-built-so-far)
4. [State Machine & Escrow Lifecycle](#4-state-machine--escrow-lifecycle)
5. [Trust Engine & Ecobank Credit Line Model](#5-trust-engine--ecobank-credit-line-model)
6. [Database Schema & Persistence Strategy](#6-database-schema--persistence-strategy)
7. [Authentication & Credentials (pswd.txt)](#7-authentication--credentials-pswdtxt)
8. [File Structure & Key Directories](#8-file-structure--key-directories)
9. [Getting Started & Local Development](#9-getting-started--local-development)

---

## 1. Executive Summary & Core Objective

**Blaze Escrow-Link** is an industrial-grade micro-escrow trust engine built natively around the **Ecobank Blaze account**. It addresses social commerce payment fraud in Nigeria across platforms like Instagram DMs, WhatsApp business chats, and university buying/selling channels (Unilag, OAU, UI).

Instead of direct bank transfers to unverified accounts, sellers generate an instant escrow link with an embedded **0.75% fee** (capped at ₦500). Buyer funds are locked in an **Ecobank 256-bit simulated vault** until delivery is verified via courier tracking or offline USSD handshake (`*329*PIN#`).

---

## 2. Tech Stack & Architecture

- **Framework:** Next.js 16 (App Router with Turbopack)
- **Language:** TypeScript 5
- **Database:** Supabase PostgreSQL + Row Level Security (RLS) + Triggers
- **State Management:** Dual-Layer System (Supabase API + `localStorage` `LocalStore` fallback)
- **Styling:** Tailwind CSS v4 + Lucide React Icons
- **Effects:** `canvas-confetti` (for delivery confirmation celebration)
- **Design Aesthetic:** `#0A0A0A` dark mode / clean light cards, Ecobank Green (`#006B3F`), JetBrains Mono for financial figures, zero emojis, high visual precision.

---

## 3. Everything Built So Far

### 📱 Pages & Features Built

1. **Landing Page (`/app/page.tsx`)**:
   - Hero section with live interactive fee calculator (calculates 0.75% fee capped at ₦500).
   - Core value proposition cards & problem statement.
   - 4-step escrow visual workflow diagram.
   - Trust score tier showcase (Bronze to Platinum).
   - Direct launch buttons into seller/buyer/admin flows.

2. **Merchant Dashboard (`/app/dashboard/page.tsx`)**:
   - Ecobank Blaze linked account status banner (`Account: 30987654321 • Credit Line: ₦150,000`).
   - Wallet balance display & **Bank Payout Modal** (allows instant withdrawal to linked bank accounts).
   - Trust Score circular indicator & tier progress bar.
   - **Instant Link Generation Form**: Title, category, description, amount, logistics selection (Campus Direct, Kwik, GIG, Sendbox).
   - Real-time 0.75% fee breakdown preview.
   - **Active Escrow Contracts Table**: Lists active transactions with state badges (`CREATED`, `PAID`, `DISPATCHED`, `CONFIRMED`, `DISPUTED`, `RELEASED`). Includes 1-click link copying and status action triggers.

3. **Public Contract Payment Link (`/app/pay/[code]/page.tsx`)**:
   - Dynamic route fetching transaction details by code (e.g., `#escrow-vintage-denim-99a2`).
   - **Seller Verification Card**: Displays seller trust score, completed trade count, dispute count, and trust tier badge.
   - **Multi-Method Payment Modal**:
     - *Option A (Blaze Wallet)*: Direct wallet payment.
     - *Option B (Virtual Bank Transfer)*: Generates unique 10-digit Ecobank account number (`992-xxx-xxxx`) with a 1-click **"Simulate Bank Transfer Payment"** trigger.
     - *Option C (Debit Card)*: Simulated card input authorization.
   - Dynamic vault status indicator when funds are locked.

4. **Buyer Orders & Tracking Hub (`/app/orders/page.tsx`)**:
   - Comprehensive history of buyer purchases.
   - **Delivery Confirmation Button**: Confirms delivery, releases vault funds to seller, awards **+3 Trust Points**, and triggers confetti animation.
   - **Dispute Filing Form**: Modal enabling buyers to report issues (Defective Item, Non-Delivery, Wrong Item) with photo/description evidence.
   - **Offline USSD Handshake PIN Display**: Generates `*329*PIN#` for physical campus trade verifications.
   - **48-Hour Protection Timer**: Visual timer for auto-release countdown.

5. **Ecobank Compliance Admin Dispute Hub (`/app/admin/page.tsx`)**:
   - Dispute management dashboard for Ecobank compliance officers.
   - Detailed dispute inspection card: Buyer evidence photos, transaction metadata, seller profile history.
   - **AI Evidence Recommendation Engine**: Outputs confidence rating (e.g., *88% confidence resolve in favor of buyer*) and rationale based on evidence analysis.
   - **Binding Resolution Buttons**:
     - *Resolve in Favor of Buyer (Refund)*: Returns funds to buyer, flags seller account.
     - *Resolve in Favor of Seller (Release)*: Credits seller's wallet and releases escrow.

6. **Interactive Demo Launcher (`/app/demo/page.tsx`)**:
   - Guided step-by-step sandbox for testing the full lifecycle without manual URL manipulation.

7. **Auth Modal & Authentication Engine (`/components/auth/AuthModal.tsx` & `/lib/auth/AuthContext.tsx`)**:
   - Phone SMS OTP authentication.
   - **OTP Bypass**: Pre-configured code `000000` for instant login and sign-up testing.
   - Sign up form with optional Ecobank Account linking for trust score boost (+15 points).

8. **Judge Switcher Header Bar (`/components/layout/JudgeHeader.tsx` & Navbar)**:
   - Persistent top bar enabling 1-click persona switching:
     - 🟢 **Seller (Amina Bello)** — Thrift merchant (Silver/Gold tier)
     - 🔵 **Buyer (Tunde Bakare)** — Student buyer with ₦211,000 balance
     - 🟣 **Admin (Compliance Officer)** — Ecobank dispute auditor

---

## 4. State Machine & Escrow Lifecycle

```
┌───────────┐      Buyer Pays      ┌──────────┐     Seller Ships     ┌────────────┐
│  CREATED  │ ───────────────────> │   PAID   │ ───────────────────> │ DISPATCHED │
└───────────┘                      └──────────┘                      └─────┬──────┘
                                                                           │
                                              ┌────────────────────────────┴────────────────────────────┐
                                              │                                                         │
                                    Buyer Confirms                                                Buyer Disputes
                                              │                                                         │
                                              ▼                                                         ▼
                                       ┌───────────┐                                             ┌───────────┐
                                       │ CONFIRMED │                                             │ DISPUTED  │
                                       └─────┬─────┘                                             └─────┬─────┘
                                             │                                                         │
                                       Funds Release                                            Admin Arbitration
                                             │                                                         │
                                             ▼                                           ┌─────────────┴─────────────┐
                                       ┌───────────┐                                     │                           │
                                       │ RELEASED  │                                     ▼                           ▼
                                       └───────────┘                               ┌───────────┐               ┌───────────┐
                                       (Seller Paid                                │ REFUNDED  │               │ RELEASED  │
                                       + Trust Boost)                              └───────────┘               └───────────┘
```

---

## 5. Trust Engine & Ecobank Credit Line Model

Trust Scores dictate seller reputation and unlock micro-credit lines funded by Ecobank Blaze:

| Trust Tier | Score Range | Ecobank Blaze Credit Line | Required Triggers |
|---|---|---|---|
| **Bronze** | 0 – 39 | ₦0 | Default unverified account / disputes |
| **Silver** | 40 – 59 | ₦50,000 | Signup + Phone SMS verification |
| **Gold** | 60 – 79 | ₦150,000 | Linked Ecobank account + 5 completed trades |
| **Platinum** | 80 – 100 | ₦350,000 | 15+ dispute-free trades + high volume |

**Trust Score Modifiers:**
- Completed Escrow Trade: **+3 Points**
- Linked Ecobank Account: **+15 Points**
- Dispute Resolved Against Seller: **-15 Points**

---

## 6. Database Schema & Persistence Strategy

The application uses a **hybrid dual-layer storage system**:

1. **Supabase PostgreSQL (`supabase/schema.sql`)**:
   - `profiles`: User accounts, roles, trust scores, credit limits, balances.
   - `escrow_transactions`: Title, category, amount, fee, state, logistics, USSD PINs, tracking numbers.
   - `disputes`: Dispute records, evidence URLs, AI recommendation scores.
   - `notifications`: User alert notifications.
   - `withdrawals`: Bank payout audit log.

2. **Client-Side Fallback (`lib/mock/store.ts`)**:
   - If Supabase environment variables are missing or API calls fail, `mockStore` maintains full reactive state in `localStorage`.

---

## 7. Authentication & Credentials (pswd.txt)

All login, signup, OTP bypass codes, demo credentials, and database secrets are documented in [`pswd.txt`](file:///c:/Users/Rokan/.gemini/antigravity/scratch/blaze-escrow/pswd.txt).

**Summary of Demo Accounts (OTP: `000000`):**
- **Seller**: `+2348000000001` (Amina Bello)
- **Buyer**: `+2348000000002` (Tunde Bakare)
- **Admin**: `+2348000000003` (Ecobank Compliance Admin)

---

## 8. File Structure & Key Directories

```
blaze-escrow/
├── app/
│   ├── (auth)/             # Login & OTP verification routes
│   ├── admin/              # Compliance dispute resolution hub
│   ├── api/                # Supabase API proxy endpoints (/profile, /escrow, /dispute)
│   ├── dashboard/          # Merchant dashboard & link creator
│   ├── demo/               # Interactive end-to-end demo sandbox
│   ├── orders/             # Buyer order tracking & dispute filing
│   ├── pay/[code]/         # Public escrow payment link page
│   ├── layout.tsx          # Root layout with Auth & Persona Providers
│   └── page.tsx            # High-conversion landing page
├── components/
│   ├── auth/               # Auth modal & phone login forms
│   ├── escrow/             # Escrow card components & status badges
│   ├── layout/             # Header, navbar & persona switcher
│   └── trust/              # Trust score ring & credit line displays
├── lib/
│   ├── auth/               # AuthContext & user state provider
│   ├── formatters.ts       # Currency (NGN/kobo), fee calculator & link generator
│   ├── mock/               # LocalStore fallback & mock datasets
│   ├── supabase/           # Supabase client initializer
│   └── trust/              # Trust score calculation algorithms
├── supabase/
│   ├── schema.sql          # PostgreSQL DDL table definitions & RLS
│   └── seed.sql            # Seed data for initial demo accounts
├── pswd.txt                # Credentials & login instructions
└── COLLABORATOR_HANDOVER.md # This guide
```

---

## 9. Getting Started & Local Development

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration (`.env.local`):**
   Ensure `.env.local` contains valid Supabase keys (see `pswd.txt`).

3. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Testing User Flows:**
   - Use the **Top Switcher Bar** to jump between **Seller**, **Buyer**, and **Admin**.
   - Create a link in `/dashboard`, open the link in `/pay/[code]`, simulate payment, dispatch in seller view, and confirm or dispute in `/orders`.

---

*Handover document compiled for team collaboration. For questions on authentication or database setups, consult [`pswd.txt`](file:///c:/Users/Rokan/.gemini/antigravity/scratch/blaze-escrow/pswd.txt).*
