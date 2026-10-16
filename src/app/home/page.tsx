"use client";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import Nav from "@/components/Nav";
import { CATEGORIES, PRODUCTS, REFERRALS } from "@/lib/demo/data";
import {
  addToCart, balance, cartLines, cartTotal, load, placeOrder,
  removeFromCart, requestWithdrawal, setQty, updateProfile,
  type State,
} from "@/lib/demo/store";

export default function Home() {
  const [kw, setKw] = useState("");
  const [state, setState] = useState<State | null>(null);
  const [category, setCategory] = useState("الكل");
  const [message, setMessage] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [iban, setIban] = useState("");
  const [profileName, setProfileName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const s = load();
    setState(s);
    setProfileName(s.profile.name);
    setPhone(s.profile.phone);
  }, []);

  const items = useMemo(() => {
    const s = kw.trim().toLowerCase();
    return PRODUCTS.filter((p) =>
      (!s || [p.name, p.part, p.manufacturer, p.compat].some((v) => v.toLowerCase().includes(s))) &&
      (category === "الكل" || p.category === category)
    );
  }, [kw, category]);

  const refresh = () => setState(load());
  const add = (id: string) => {
    const result = addToCart(id);
    setMessage(result.ok ? "تمت إضافة المنتج إلى السلة." : result.error);
    refresh();
  };
  const checkout = () => {
    const result = placeOrder();
    setMessage(result.ok ? "تم إنشاء الطلب التجريبي رقم " + result.order.id : result.error);
    refresh();
  };
  const withdraw = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = requestWithdrawal(Number(withdrawAmount), iban);
    setMessage(result.ok ? "تم تسجيل طلب السحب التجريبي." : result.error);
    if (result.ok) { setWithdrawAmount(""); setIban(""); }
    refresh();
  };
  const saveProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = updateProfile(profileName, phone);
    setMessage(result.ok ? "تم حفظ بيانات الحساب على هذا المتصفح." : result.error);
    refresh();
  };

  const lines = state ? cartLines(state) : [];
  const total = state ? cartTotal(state) : 0;
  const walletBalance = state ? balance(state) : 0;
  const statusLabels: Record<string, string> = {
    pending_review: "بانتظار المراجعة",
    processing: "قيد التجهيز",
    shipped: "تم الشحن",
    completed: "مكتمل",
  };

  return (
    <div id="home" className="mx-auto min-h-screen max-w-md pb-24">
      <header className="rounded-b-2xl bg-navy px-5 pb-5 pt-8 text-white">
        <p className="mb-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs">وضع تجريبي — البيانات محفوظة محليًا على هذا المتصفح</p>
        <h1 className="text-lg font-bold">أهلاً بك في اليورو، {state?.profile.name || "مستخدم تجريبي"}</h1>
        <p className="mt-2 text-sm text-silver">تصفّح قطع السيارات وجرّب البحث.</p>
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-navy2">
          <Search size={18} />
          <input aria-label="البحث عن المنتجات" className="w-full bg-transparent text-sm outline-none" placeholder="ابحث عن قطعة أو رقم المنتج" value={kw} onChange={(e) => setKw(e.target.value)} />
        </div>
      </header>

      <section className="mx-5 mt-4 grid grid-cols-2 gap-3 text-center">
        <a href="#wallet" className="rounded-xl bg-navy p-4 text-white">
          <p className="text-xs text-silver">رصيد العمولات التجريبي</p>
          <p className="mt-1 text-xl font-bold" dir="ltr">{walletBalance.toFixed(2)} €</p>
        </a>
        <a href="#referrals" className="rounded-xl border border-silver p-4">
          <p className="text-xs text-slate-500">الإحالات التجريبية</p>
          <p className="mt-1 text-xl font-bold">{REFERRALS.length}</p>
        </a>
      </section>

      <section id="products" className="mx-5 mt-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">المنتجات</h2>
          <span className="text-xs text-slate-500">{items.length} منتجات</span>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <button key={c} type="button" onClick={() => setCategory(c)} className={"shrink-0 rounded-full border px-3 py-1 text-xs " + (category === c ? "border-navy bg-navy text-white" : "border-silver text-slate-600")}>{c}</button>
          ))}
        </div>
        {items.length === 0 ? <p className="mt-3 text-sm text-slate-500">لا توجد منتجات مطابقة.</p> :
          <ul className="mt-3 divide-y divide-silver">{items.map((p) => {
            const inStock = (state?.stock[p.id] ?? p.stock) > 0;
            return <li key={p.id} className="flex justify-between gap-3 py-3 text-sm">
              <span className="min-w-0">{p.name}<br /><span className="text-xs text-slate-500" dir="ltr">{p.part} · {p.manufacturer}</span><br /><span className="text-xs text-slate-500">{p.compat}</span></span>
              <span className="shrink-0 text-left">
                <b dir="ltr">{p.price.toFixed(2)} €</b><br />
                <span className={inStock ? "text-green-700" : "text-red-700"}>{inStock ? "متوفر (" + (state?.stock[p.id] ?? p.stock) + ")" : "غير متوفر"}</span><br />
                <button type="button" disabled={!inStock} onClick={() => add(p.id)} className="mt-1 rounded-lg bg-navy px-3 py-1.5 text-xs text-white disabled:opacity-40">أضف للسلة</button>
              </span>
            </li>;
          })}</ul>}
      </section>

      <section id="cart" className="mx-5 mt-6 rounded-xl border border-silver p-4">
        <div className="flex items-center justify-between"><h2 className="font-bold">سلة المشتريات</h2><span className="text-xs text-slate-500">{lines.length} منتجات</span></div>
        {lines.length === 0 ? <p className="mt-3 text-sm text-slate-500">السلة فارغة حاليًا.</p> : <>
          <ul className="mt-2 divide-y divide-silver">{lines.map((p) => <li key={p.id} className="flex items-center justify-between gap-2 py-3 text-sm">
            <span>{p.name}<br /><b dir="ltr">{(p.price * p.qty).toFixed(2)} €</b></span>
            <span className="flex items-center gap-2">
              <button type="button" aria-label="تقليل الكمية" onClick={() => { setQty(p.id, p.qty - 1); refresh(); }} className="rounded border border-silver px-2 py-1">−</button>
              <span>{p.qty}</span>
              <button type="button" aria-label="زيادة الكمية" onClick={() => { setQty(p.id, p.qty + 1); refresh(); }} className="rounded border border-silver px-2 py-1">+</button>
              <button type="button" onClick={() => { removeFromCart(p.id); refresh(); }} className="text-red-700">حذف</button>
            </span>
          </li>)}</ul>
          <div className="flex items-center justify-between border-t border-silver pt-3 text-sm"><b>المجموع</b><b dir="ltr">{total.toFixed(2)} €</b></div>
          <button type="button" onClick={checkout} className="mt-3 w-full rounded-lg bg-navy px-4 py-2 text-sm text-white">تأكيد الطلب التجريبي</button>
        </>}
      </section>

      <section id="orders" className="mx-5 mt-5 rounded-xl border border-silver p-4">
        <h2 className="font-bold">طلباتي</h2>
        {!state?.orders.length ? <p className="mt-3 text-sm text-slate-500">ما في طلبات لحد الآن.</p> :
          <ul className="mt-2 divide-y divide-silver">{state.orders.map((o) => <li key={o.id} className="py-3 text-sm">
            <div className="flex justify-between gap-2"><b>طلب #{o.id}</b><b dir="ltr">{o.total.toFixed(2)} €</b></div>
            <p className="mt-1 text-xs text-slate-500">{o.date} · {statusLabels[o.status] || o.status}</p>
            <p className="mt-1 text-xs">{o.items.map((i) => i.name + " × " + i.qty).join("، ")}</p>
          </li>)}</ul>}
      </section>

      <section id="referrals" className="mx-5 mt-5 rounded-xl border border-silver p-4">
        <h2 className="font-bold">الإحالات</h2>
        <ul className="mt-2 divide-y divide-silver">{REFERRALS.map((r) => <li key={r.name} className="flex justify-between gap-3 py-3 text-sm">
          <span>{r.name}<br /><span className="text-xs text-slate-500">{r.status}</span></span>
          <span className="text-left"><b dir="ltr">{r.sales.toFixed(2)} €</b><br /><span className="text-xs text-slate-500">مبيعات تجريبية</span></span>
        </li>)}</ul>
      </section>

      <section id="wallet" className="mx-5 mt-5 rounded-xl border border-silver p-4">
        <h2 className="font-bold">المحفظة</h2>
        <p className="mt-2 text-xl font-bold" dir="ltr">{walletBalance.toFixed(2)} €</p>
        <p className="text-xs text-slate-500">رصيد تجريبي فقط، لا توجد تحويلات مالية حقيقية.</p>
        <form onSubmit={withdraw} className="mt-3 space-y-2">
          <input required type="number" min="10" step="0.01" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="مبلغ السحب (الحد الأدنى 10€)" className="w-full rounded-lg border border-silver px-3 py-2 text-sm" />
          <input required value={iban} onChange={(e) => setIban(e.target.value)} placeholder="IBAN تجريبي" className="w-full rounded-lg border border-silver px-3 py-2 text-sm" />
          <button type="submit" className="w-full rounded-lg bg-navy px-4 py-2 text-sm text-white">تسجيل طلب سحب تجريبي</button>
        </form>
        {state?.tx.length ? <ul className="mt-3 divide-y divide-silver">{state.tx.map((tx) => <li key={tx.id} className="flex justify-between gap-3 py-2 text-xs">
          <span>{tx.label}<br /><span className="text-slate-500">{tx.date}</span></span>
          <b className={tx.amount < 0 ? "text-red-700" : "text-green-700"} dir="ltr">{tx.amount.toFixed(2)} €</b>
        </li>)}</ul> : null}
      </section>

      <section id="profile" className="mx-5 mt-5 rounded-xl bg-slate-50 p-4">
        <h2 className="font-bold">حسابي</h2>
        <form onSubmit={saveProfile} className="mt-3 space-y-2">
          <label className="block text-xs text-slate-500">الاسم</label>
          <input required value={profileName} onChange={(e) => setProfileName(e.target.value)} className="w-full rounded-lg border border-silver bg-white px-3 py-2 text-sm" />
          <label className="block text-xs text-slate-500">رقم الهاتف</label>
          <input required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-silver bg-white px-3 py-2 text-sm" />
          <button type="submit" className="w-full rounded-lg bg-navy px-4 py-2 text-sm text-white">حفظ بيانات الحساب</button>
        </form>
        <p className="mt-3 text-xs text-slate-500">الحساب والطلبات والمحفظة تجريبية ومحفوظة محليًا على هذا المتصفح فقط.</p>
      </section>

      {message ? <div role="status" className="mx-5 mt-4 rounded-lg border border-silver p-3 text-sm">{message}</div> : null}
      <Nav active="/home" />
    </div>
  );
}
