create table workshops(user_id uuid primary key references profiles(id) on delete cascade,
  name text not null default '', reg_no text not null default '', governorate text not null default '', city text, created_at timestamptz default now());
create table workshop_documents(id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade, path text not null, created_at timestamptz default now());
alter table workshops enable row level security; alter table workshop_documents enable row level security;
create policy w_read on workshops for select using(user_id=auth.uid() or is_admin());
create policy wd_read on workshop_documents for select using(user_id=auth.uid() or is_admin());
create policy wd_ins on workshop_documents for insert with check(user_id=auth.uid() and path like auth.uid()::text||'/%');
-- private bucket: users reach only their own folder; admins read all
insert into storage.buckets(id,name,public) values('workshop-docs','workshop-docs',false) on conflict do nothing;
create policy wdocs_ins on storage.objects for insert to authenticated
  with check(bucket_id='workshop-docs' and (storage.foldername(name))[1]=auth.uid()::text);
create policy wdocs_read on storage.objects for select to authenticated
  using(bucket_id='workshop-docs' and ((storage.foldername(name))[1]=auth.uid()::text or is_admin()));

-- same signup logic as 0001 (type whitelist, workshops start 'pending', referral link) plus the workshop row
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
declare t account_type; ref uuid; m jsonb:=new.raw_user_meta_data; begin
  t := case when m->>'account_type' in('workshop','marketer') then (m->>'account_type')::account_type else 'customer' end;
  insert into profiles(id,full_name,phone,account_type,verification)
    values(new.id, coalesce(nullif(m->>'full_name',''),'مستخدم'), m->>'phone', t,
           case when t='workshop' then 'pending'::verification else 'verified' end);
  if t='workshop' then
    insert into workshops(user_id,name,reg_no,governorate,city)
      values(new.id, coalesce(m->>'workshop_name',''), coalesce(m->>'reg_no',''), coalesce(m->>'governorate',''), m->>'city');
  end if;
  select id into ref from profiles where referral_code=upper(m->>'referral_code');
  if ref is not null and ref<>new.id then insert into referrals values(new.id,ref); end if;
  return new; end $$;
