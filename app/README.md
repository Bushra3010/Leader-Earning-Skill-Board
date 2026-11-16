# Leaders Earning and Skill Board — Partner App

A mobile-first education partner app: partners share course and kit links, buyers enroll through those links, and partners earn the commission shown on each product.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

Without Supabase keys the app runs in **demo mode**: data is saved only in that browser. The demo login is `demo@leaders.app` / `demo1234`, and the demo account is an admin.

## Connect Supabase

1. Create a project at supabase.com.
2. In **SQL Editor**, run `supabase/schema.sql`, then `supabase/seed.sql`.
3. Copy `.env.example` to `.env.local` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (from **Project Settings → API**).
4. Restart `npm run dev`, register your account, then make yourself admin:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
5. In **Authentication → URL Configuration**, set the Site URL to your domain.

## Screens

| Tab | What it does |
|---|---|
| Home | Pre-School / Pro-School / School switcher, partner-kit alert, "Start Selling" carousel, earnings snapshot, product grid with Share and Open buttons |
| Orders | Reports overview (sales, enrolled, alerts, delivered), search, and Orders / Enrolled / Subscriptions / Delivery tabs, with buyer phone numbers masked |
| Team | Invite link and the list of partners who joined with your code |
| Learn | Learn & Grow: product snapshot, Best Flow, copy-paste pitch, and training lessons |
| Profile | Personal details, payout and KYC details (UPI, bank, PAN), commission rates, support, and the admin panel |

Other routes: `/wallet`, `/notifications`, `/kit`, `/privacy`, `/admin`, and the public buyer page `/p/:slug?ref=CODE`.

## How money moves

1. A buyer opens a partner link (`/p/slug?ref=CODE`) and submits the form. This creates a **pending** order linked to that partner.
2. The admin collects payment and sets the order to **paid** (Admin → Orders). A database trigger then credits the commission to the partner's wallet and adds 10 points.
3. If the order is later cancelled or refunded, the commission is reversed automatically.
4. The partner requests a withdrawal. The server checks it against the minimum amount and the wallet balance, then the admin marks it paid. A rejected withdrawal is refunded to the wallet.

## Fixes for the audit's red flags

- Every product shows its exact commission %, instead of "as per slab".
- Payout rules (minimum amount and schedule) are shown in the Wallet.
- The partner kit is optional by default (Admin → Settings), and its price is always shown.
- Partners see buyer phone numbers only in masked form, enforced by a database view.
- Income comes only from a partner's own sales. There is no recruitment income.
- The app needs only internet access: no location, microphone, camera, or run-at-startup.
- The privacy policy covers partner data, buyer data, and payouts.

## Next steps

- **Online payments:** add a Razorpay checkout and webhook (a Supabase Edge Function) that sets `orders.status = 'paid'`. Until then, the admin marks orders paid by hand.
- **Play Store:** wrap the app with Capacitor (`npx cap add android`) and request only the INTERNET permission.
- **Deploy:** run `npm run build` and host `dist/` on any static host (Vercel, Netlify), with SPA rewrites to `index.html`.
