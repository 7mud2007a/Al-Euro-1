# EURO | اليورو

Status: backend core (database, security, commissions) plus welcome screen. Not yet built or tested with `npm run build`.

## Setup (works from a phone)
1. Create a project at supabase.com. In SQL Editor run `0001_core.sql`, then `0002_workshops.sql`.
   In Authentication > Providers > Email, turn off "Confirm email" if you want workshop documents uploaded at sign-up; otherwise the upload needs a later login.
2. Sign up once in the app, then run in SQL Editor:
   `insert into admins(user_id) select id from auth.users where email='YOUR_EMAIL';`
   This is the only way to create an admin; no user can grant it to themselves.
3. Push this folder to GitHub. On render.com choose New > Blueprint, select the repo (uses `render.yaml`).
4. Set the 3 variables from `.env.example`. Find them in Supabase > Project Settings > API.

## Rules enforced in the database
- Commission = `referral_rate` (2%) of an order when an admin sets it to completed; one per order (unique constraint).
- Cancel/refund rejects an unpaid commission, or adds a negative reversal if already paid.
- Prices and stock are read inside `place_order()`; the browser sends only product ids and quantities.
- Tier thresholds and the up-to-20% reward rule start empty/inactive; set them as admin.
