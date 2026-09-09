# BLAZE ESCROW-LINK — MASTER PRODUCT OVERVIEW & UX FLOW
### P2P Social Commerce Trust Engine for Ecobank Blaze
**Track A — Inclusive Finance (InnovateX 2026)**

---

## 1. Executive Summary & Core Objective

**Blaze Escrow-Link** is an industrial-grade micro-escrow engine built natively around the **Ecobank Blaze account**. It addresses Nigeria's highest-frequency cybercrime category — **social commerce payment fraud** — on platforms like Instagram DMs, WhatsApp business chats, and campus buying/selling groups (e.g., Unilag, OAU, UI).

Instead of sending direct bank transfers into unverified personal accounts, sellers generate an instant payment link with embedded 0.75% escrow logic. Buyer funds are held in an **Ecobank 256-bit vault** until delivery is verified via courier tracking or offline USSD handshake (`*329*PIN#`).

---

## 2. Tech Stack & Design System

- **Framework:** Next.js 14 App Router (Turbopack)
- **Database & Security:** Supabase PostgreSQL + Row Level Security (RLS) + Triggers
- **Styling:** Tailwind CSS (Utility classes only) + Lucide React Icons
- **Typography:** Inter (Sans-serif) + JetBrains Mono (Code/Financial Data)
- **Aesthetic Guidelines:** Strict `#0A0A0A` dark mode palette (`#111111` cards, `#1A1A1A` surfaces, `#2A2A2A` subtle borders). Primary color: `#006B3F` (Ecobank Green). Secondary: `#F59E0B` (Amber). **Zero emojis, zero gradient abuse, zero third-party component libraries.**

---

## 3. System Architecture & State Machine

```
                              ┌────────────────┐
                              │    CREATED     │  (Seller generates #escrow link)
                              └───────┬────────┘
                                      │
                                  [BUYER PAYS]
                                      │
                                      ▼
                              ┌────────────────┐
                              │      PAID      │  (Funds locked in Ecobank Vault)
                              └───────┬────────┘
                                      │
                                [SELLER SHIPS]
                                      │
                                      ▼
                              ┌────────────────┐
                              │   DISPATCHED   │  (Logistics Code / USSD PIN issued)
                              └──────┬──┬──────┘
                                     │  │
                    ┌────────────────┘  └────────────────┐
                    │                                    │
           [BUYER CONFIRMS]                       [BUYER DISPUTES]
                    │                                    │
                    ▼                                    ▼
           ┌────────────────┐                   ┌────────────────┐
           │   CONFIRMED    │                   │    DISPUTED    │
           └───────┬────────┘                   └───────┬────────┘
                   │                                    │
            [FUNDS RELEASE]                   [ECOBANK ADMIN / AI]
                   │                                    │
                   ▼                            ┌───────┴────────┐
           ┌────────────────┐                   │                │
           │    RELEASED    │                   ▼                ▼
           └────────────────┘           ┌──────────────┐ ┌──────────────┐
           (Seller Credited             │   REFUNDED   │ │   RELEASED   │
            + Trust Score)              └──────────────┘ └──────────────┘
```

---

## 4. End-to-End User Experience (UX) Flow

### Phase 1: Merchant Link Generation (Seller Flow)
1. **Dashboard Overview (`/dashboard`)**: Merchant accesses their Ecobank Blaze account status, total sales volume, trust tier (Silver/Gold/Platinum), and available wallet balance.
2. **Linked Account Banner**: Prominent Amber banner displays: `Linked Ecobank Blaze Account: 30987654321 • Credit Line Unlocked: ₦150,000`.
3. **Instant Link Form**: Seller enters Item Title (*e.g., Vintage Levi 90s Denim Jacket*), Category, Description, Amount (*e.g., ₦18,500*), and Logistics Choice (*Campus Direct, GIG, Kwik, Sendbox*).
4. **Automated Fee Engine**: Real-time 0.75% calculation (capped at ₦500 maximum).
5. **Instant Output**: Generates unique contract code (`#escrow-vintage-denim-99a2`), direct payment link, and pre-formatted WhatsApp/Instagram caption text with 1-click copy buttons.

---

### Phase 2: Buyer Payment & Vault Lock (Buyer Flow)
1. **Public Contract Link (`/pay/[code]`)**: Buyer clicks link received on WhatsApp or Instagram.
2. **Seller Trust Inspection**: Buyer views seller verification status (*Amina Bello · Silver Tier · 72 Trust Score · 14 Completed Trades · 0 Disputes*).
3. **Multi-Channel Payment Options**:
   - **Option A: Blaze Wallet**: Direct instant debit from buyer's simulated wallet balance.
   - **Option B: Virtual Bank Transfer**: Generates one-time Ecobank virtual account (`992-xxx-xxxx`). Instant webhook simulation locks funds immediately upon transfer.
   - **Option C: Debit Card**: Card authorization simulation.
4. **Escrow Vault Lock**: Funds are locked in 256-bit vault. Both seller and buyer receive instant notification.

---

### Phase 3: Dispatch & Offline USSD Handshake (Fulfillment Flow)
1. **Seller Dispatch**: Seller updates order with logistics provider and tracking ID (*e.g., KWK-NG-8849102*).
2. **Campus Handshake USSD PIN**: For campus trades without mobile internet, the system generates an offline USSD PIN (`*329*482910#`). Buyer dials this on their phone to complete physical handshake verification.
3. **48-Hour Protection Clock**: System starts a 48-hour auto-release timer.

---

### Phase 4: Confirmation & Payout vs. Dispute Resolution
- **Path A — Successful Delivery**:
  - Buyer clicks **"Confirm Delivery & Release Funds"** (triggers confetti particle effect).
  - Escrow vault instantly credits seller's wallet net of 0.75% fee.
  - Seller's Trust Score increases by **+3 points**, boosting credit limit tier.
  - Seller clicks **"Payout to Bank"** to transfer funds instantly to their linked Ecobank account.

- **Path B — Dispute Arbitration (`/admin`)**:
  - Buyer clicks **"Raise Dispute / Report Issue"** before 48-hour expiry.
  - Selects reason (*Item Defective, Non-Delivery, Wrong Item*) and uploads description/photo evidence.
  - Escrow funds are immediately **FROZEN**.
  - **Ecobank Compliance Admin** views dispute queue with **AI Evidence Recommendation Engine** (*e.g. 88% confidence resolve in favor of buyer*).
  - Admin executes binding resolution: **"Resolve Favor Buyer (Refund)"** or **"Resolve Favor Seller (Release Funds)"**.

---

## 5. Trust Score & Tier Credit Line System

| Trust Tier | Score Range | Ecobank Blaze Credit Line | Required Triggers |
|---|---|---|---|
| **Bronze** | 0 – 39 | ₦0 | Unverified or high dispute rate |
| **Silver** | 40 – 59 | ₦50,000 | Initial signup + Phone SMS verification |
| **Gold** | 60 – 79 | ₦150,000 | Linked Ecobank account + 5 completed trades |
| **Platinum** | 80 – 100 | ₦350,000 | 15+ dispute-free trades + high volume |

---

## 6. Pre-Configured Demo Accounts for Judges

Use the **Judge Mode Top Switcher Bar** on any page to test instantly:

| Role | Name | Phone Number | OTP Code | Account Description |
|---|---|---|---|---|
| **Seller** | Amina Bello | `+2348000000001` | `000000` | ThriftPlug Unilag Merchant (Silver Tier 72) |
| **Buyer** | Tunde Bakare | `+2348000000002` | `000000` | Student Buyer (₦85,000 Wallet Balance) |
| **Admin** | Compliance Officer | `+2348000000003` | `000000` | Ecobank Compliance Auditor |

---

## 7. Direct Application URLs

| View / Page | URL Route |
|---|---|
| **Interactive Demo Launcher** | `http://localhost:3000/demo` |
| **Merchant Dashboard** | `http://localhost:3000/dashboard` |
| **Live Escrow Payment Link** | `http://localhost:3000/pay/escrow-vintage-denim-99a2` |
| **Compliance Admin Dispute Hub** | `http://localhost:3000/admin` |
| **Buyer Orders & Tracking** | `http://localhost:3000/orders` |
| **Phone Login** | `http://localhost:3000/login` |
