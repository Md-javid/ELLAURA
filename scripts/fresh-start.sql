-- ═══════════════════════════════════════════════════════════════════════════
-- Ellaura — Fresh Start Script
-- Wipes everything so you launch with a completely clean slate.
--
-- 🗑  DELETED:   products, orders, cart_items, wishlists, addresses,
--               reviews, profiles, auth.users (all customers)
-- ✅ PRESERVED:  coupons, waitlist emails
--
-- HOW TO RUN:
--   1. Open Supabase Dashboard → SQL Editor
--   2. Paste this entire file and click "Run"
--   3. If you get a permission error on `delete from auth.users`, delete users
--      manually via Dashboard → Authentication → Users → Select All → Delete
--
-- SAFE TO RE-RUN: all deletes are idempotent.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Dependent tables first (foreign keys point to products / profiles / auth.users)
delete from reviews;
delete from wishlists;
delete from cart_items;
delete from addresses;
delete from orders;

-- 2. Products (after orders/cart reference them)
delete from products;

-- 3. Customer profiles (cascades to above if any rows remain)
delete from profiles;

-- 4. Auth users — removes login credentials for ALL customers
--    Requires service-role SQL access (available in Supabase SQL Editor).
--    If this line errors, delete users via:
--      Dashboard → Authentication → Users → select all → Delete
delete from auth.users;

-- ─────────────────────────────────────────────────────────────────────────
-- Done. Coupons and waitlist entries are untouched.
-- Admin accounts are stored in localStorage only — they are unaffected.
-- After running this, re-add your products via the Admin panel.
--
-- ⚠️  ALSO clear browser localStorage before relaunching:
--   Open browser DevTools → Application → Local Storage → ellaura.in
--   Delete the key:  ellaura_admin_products
--   (This removes the local cache of previously added products)
-- ─────────────────────────────────────────────────────────────────────────
