create extension if not exists pgcrypto;
create type account_type as enum ('workshop','customer','marketer');
create type verification as enum ('pending','verified','rejected','suspended');
create type order_status as enum ('pending_review','processing','shipped','completed','cancelled','refunded');
create type commission_status as enum ('pending','approved','paid','rejected');

-- Admins live in their own table: no client policy can write it. Grant the first admin from the SQL editor:
--   insert into admins(user_id) select id from auth.users where email='you@example.com';
create table admins(user_id uuid primary key references auth.users on delete cascade);
create function is_admin() returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from admins where user_id=auth.uid()) $$;

create table profiles(
  id uuid primary key references auth.users on delete cascade,
  full_name text not null, phone text, account_type account_type not null,
  verification verification not null default 'pending',
  referral_code text unique not null default upper(substr(encode(gen_random_bytes(6),'hex'),1,8)),
  created_at timestamptz not null default now());
create table referrals(
  referred_id uuid primary key references profiles(id) on delete cascade,
  referrer_id uuid not null references profiles(id),
  created_at timestamptz not null default now(), check (referred_id<>referrer_id));
create index on referrals(referrer_id);

create table product_categories(id serial primary key, name_ar text not null, sort int default 0);
create table products(
  id uuid primary key default gen_random_uuid(),
  category_id int references product_categories, name_ar text not null, manufacturer text,
  part_number text, compatibility text, description text, image_path text,
  price numeric(12,2) not null check(price>=0), stock int not null default 0 check(stock>=0),
  active boolean not null default true);
create index on products(part_number); create index on products(category_id);

create table orders(
  id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles(id),
  status order_status not null default 'pending_review',
  total numeric(12,2) not null check(total>=0), payment_status text not null default 'unpaid',
  created_at timestamptz not null default now());
create index on orders(user_id, created_at desc);
create table order_items(
  id uuid primary key default gen_random_uuid(), order_id uuid not null references orders on delete cascade,
  product_id uuid not null references products, qty int not null check(qty>0),
  unit_price numeric(12,2) not null);

-- Commission ledger: one 'earn' and at most one 'reversal' per order, so reprocessing is a no-op.
create table commissions(
  id uuid primary key default gen_random_uuid(), beneficiary_id uuid not null references profiles(id),
  order_id uuid not null references orders, kind text not null check(kind in('earn','reversal')),
  amount numeric(12,2) not null, status commission_status not null default 'pending',
  created_at timestamptz not null default now(), unique(order_id, kind));
create index on commissions(beneficiary_id);
create view wallet_balance with(security_invoker=true) as
  select beneficiary_id, sum(amount) filter(where status in('pending','approved','paid')) as total,
         sum(amount) filter(where status='pending') as pending,
         sum(amount) filter(where status='approved') as approved,
         sum(amount) filter(where status='paid') as paid
  from commissions group by beneficiary_id;

create table app_settings(key text primary key, value numeric not null);
insert into app_settings values('referral_rate',0.02);
-- Thresholds are NULL on purpose: the company sets them in admin; unset tiers are never awarded.
create table loyalty_tiers(id serial primary key, name_ar text not null, rank int unique not null,
  min_referrals int, min_orders int, min_sales numeric(14,2));
insert into loyalty_tiers(name_ar,rank) values('برونزي',1),('فضي',2),('ذهبي',3),('بلاتيني',4);
create table reward_rules(id serial primary key, name text not null, rate numeric(5,4) check(rate between 0 and 0.2),
  basis text, min_tier_rank int, requires_approval boolean not null default true, active boolean not null default false);
create table audit_logs(id bigserial primary key, actor uuid, action text not null, detail jsonb, at timestamptz default now());

create function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
declare t account_type; ref uuid; begin
  t := case when new.raw_user_meta_data->>'account_type' in('workshop','marketer') then (new.raw_user_meta_data->>'account_type')::account_type else 'customer' end;
  insert into profiles(id,full_name,phone,account_type,verification)
    values(new.id, coalesce(nullif(new.raw_user_meta_data->>'full_name',''),'مستخدم'), new.raw_user_meta_data->>'phone', t,
           case when t='workshop' then 'pending'::verification else 'verified' end);
  select id into ref from profiles where referral_code=upper(new.raw_user_meta_data->>'referral_code');
  if ref is not null and ref<>new.id then insert into referrals values(new.id,ref); end if;
  return new; end $$;
create trigger on_signup after insert on auth.users for each row execute function handle_new_user();

-- Prices come from the database, never from the browser. Unverified workshops cannot order.
create function place_order(items jsonb) returns uuid language plpgsql security definer set search_path=public as $$
declare oid uuid; tot numeric:=0; i jsonb; p products; begin
  if not exists(select 1 from profiles where id=auth.uid() and verification='verified') then raise exception 'account not verified'; end if;
  insert into orders(user_id,total) values(auth.uid(),0) returning id into oid;
  for i in select * from jsonb_array_elements(items) loop
    select * into p from products where id=(i->>'product_id')::uuid and active for update;
    if p.id is null or (i->>'qty')::int<=0 or p.stock<(i->>'qty')::int then raise exception 'unavailable product'; end if;
    insert into order_items(order_id,product_id,qty,unit_price) values(oid,p.id,(i->>'qty')::int,p.price);
    update products set stock=stock-(i->>'qty')::int where id=p.id;
    tot := tot + p.price*(i->>'qty')::int;
  end loop;
  update orders set total=tot where id=oid; return oid; end $$;

create function settle_commission() returns trigger language plpgsql security definer set search_path=public as $$
declare ref uuid; rate numeric; c commissions; begin
  select referrer_id into ref from referrals where referred_id=new.user_id;
  if ref is null or new.status=old.status then return new; end if;
  if new.status='completed' then
    select value into rate from app_settings where key='referral_rate';
    insert into commissions(beneficiary_id,order_id,kind,amount) values(ref,new.id,'earn',round(new.total*rate,2)) on conflict do nothing;
  elsif new.status in('cancelled','refunded') then
    select * into c from commissions where order_id=new.id and kind='earn';
    if found and c.status<>'paid' then update commissions set status='rejected' where id=c.id;
    elsif found then insert into commissions(beneficiary_id,order_id,kind,amount,status) values(ref,new.id,'reversal',-c.amount,'approved') on conflict do nothing; end if;
  end if; return new; end $$;
create trigger on_order_status after update of status on orders for each row execute function settle_commission();

-- RLS
do $$ declare t text; begin foreach t in array array['admins','profiles','referrals','product_categories','products','orders','order_items','commissions','app_settings','loyalty_tiers','reward_rules','audit_logs']
  loop execute format('alter table %I enable row level security',t); end loop; end $$;
revoke update on profiles from authenticated; grant update(full_name,phone) on profiles to authenticated;  -- verification/type are admin-only
create policy p_self on profiles for select using(id=auth.uid() or is_admin());
create policy p_self_upd on profiles for update using(id=auth.uid());
create policy p_admin_prof on profiles for update using(is_admin());
create policy ref_read on referrals for select using(referrer_id=auth.uid() or referred_id=auth.uid() or is_admin());
create policy cat_read on product_categories for select to authenticated using(true);
create policy cat_admin on product_categories for all using(is_admin()) with check(is_admin());
create policy prod_read on products for select to authenticated using(active or is_admin());
create policy prod_admin on products for all using(is_admin()) with check(is_admin());
create policy ord_read on orders for select using(user_id=auth.uid() or is_admin());
create policy ord_admin on orders for update using(is_admin());
create policy oi_read on order_items for select using(exists(select 1 from orders o where o.id=order_id and (o.user_id=auth.uid() or is_admin())));
create policy com_read on commissions for select using(beneficiary_id=auth.uid() or is_admin());
create policy com_admin on commissions for update using(is_admin());
create policy set_read on app_settings for select to authenticated using(true);
create policy set_admin on app_settings for all using(is_admin()) with check(is_admin());
create policy tier_read on loyalty_tiers for select to authenticated using(true);
create policy tier_admin on loyalty_tiers for all using(is_admin()) with check(is_admin());
create policy rr_admin on reward_rules for all using(is_admin()) with check(is_admin());
create policy audit_read on audit_logs for select using(is_admin());
revoke execute on function place_order(jsonb) from public, anon; grant execute on function place_order(jsonb) to authenticated;
