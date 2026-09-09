# ⚡ Blaze Escrow-Link — Trust-First Escrow Protocol for Social Commerce

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss)](https://tailwindcss.com/)
[![Ecobank](https://img.shields.io/badge/Bank-Ecobank_Nigeria-006B3F)](https://ecobank.com)

> **Blaze Escrow-Link** empowers West African social commerce vendors (Instagram, WhatsApp, TikTok, X merchants) to generate instant, secure escrow links for their sales. Buyers pay into a locked vault, funds are safely held during delivery, and automatically released upon buyer confirmation.

---

## 🌟 Key Features

### 🛒 Instant Escrow Payment Links
- **Merchant Link Generator**: Create shareable payment links in under 30 seconds with custom pricing, product photos, category tagging, and logistics provider selection (Kwik, GIG, Sendbox, Campus Direct).
- **Share Cards**: Download and share visually engaging social media share cards for Instagram Stories and WhatsApp Status.

### 👥 Dual Seller / Buyer Role Architecture
- **Unified Accounts**: Every user can seamlessly act as both a **Seller** (creating listings, tracking sales, withdrawing payouts) and a **Buyer** (paying for items, tracking orders, confirming delivery).
- **Self-Dealing Protection**: Built-in safeguards block sellers from attempting self-payments (`403 Forbidden`).

### 🛡️ Ecobank Escrow Vault & USSD Verification
- **Locked Escrow Vault**: Buyer funds are securely held until delivery is confirmed.
- **USSD Verification PINs**: Package collection PINs (e.g. `*329*910283#`) enable secure campus & physical handshakes.

### 💎 Dynamic Trust Score & Credit Engine
- **Trust Tiers**: Automatic tier progression based on successful transaction history (Bronze, Silver, Gold, Platinum).
- **Overdraft Credit Limit**: High-trust merchants unlock Ecobank Blaze credit limits up to ₦350,000.

### ⚖️ Dispute Resolution & Compliance Admin Hub
- **AI-Assisted Dispute Engine**: Evidence filing, defect verification, and automated recommendation confidence scoring.
- **Compliance Admin Hub**: Secure admin portal for dispute resolution, buyer refund processing, or seller fund releases.

---

## 🏗️ Tech Stack & Architecture

- **Framework**: Next.js 16 (App Router) + React 19
- **Database**: Supabase Postgres (Persistent multi-user tables)
- **Styling**: Tailwind CSS v4 + Lucide Icons
- **Type Safety**: TypeScript strict mode
- **Auth & Sessioning**: Phone OTP Demo Guard + Supabase Server Client

```mermaid
flowchart TD
    Vendor[Social Merchant] -->|Creates Link| ServerAPI[/api/transactions]
    ServerAPI -->|Upserts Contract| SupabaseDB[(Supabase Postgres)]
    Buyer[Social Buyer] -->|Pays Link| EscrowVault[Locked Escrow Vault]
    EscrowVault -->|State: PAID| Dispatch[Logistics Dispatch]
    Dispatch -->|State: DISPATCHED| BuyerConfirm[Buyer Delivery Confirmation]
    BuyerConfirm -->|State: RELEASED| Wallet[Seller Wallet Credit]
    Wallet -->|Bank Payout| BankAcc[Ecobank / Nigerian Bank Account]
```

---

## ⚙️ Environment Variables Setup

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://dzmymzbmoeyuaxfgwqdm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

NEXT_PUBLIC_APP_URL=http://localhost:3000
DEMO_PHONE_SELLER=+2348000000001
DEMO_PHONE_BUYER=+2348000000002
DEMO_PHONE_ADMIN=+2348000000003
DEMO_OTP_BYPASS=000000
```

---

## 🚀 Getting Started Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Rokan0-0/Blaze-Escrow-Link.git
   cd Blaze-Escrow-Link
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Database Migration**:
   Run the schema and seed scripts in your Supabase SQL Editor using the files located in:
   - [`supabase/schema.sql`](./supabase/schema.sql)
   - [`supabase/seed.sql`](./supabase/seed.sql)

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. **Access application**:
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploying on Vercel

1. Push your code to GitHub repository `Rokan0-0/Blaze-Escrow-Link`.
2. Import the repository in **[Vercel Dashboard](https://vercel.com/new)**.
3. Configure the **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Click **Deploy**.

---

## 📜 License

Distributed under the MIT License. Built for Ecobank Fintech Innovation.
