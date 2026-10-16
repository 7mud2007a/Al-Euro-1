"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import Nav from "@/components/Nav";

type Product = { id: number; name_ar: string; price: number; stock: number; part_number: string };
const demoProducts: Product[] = [
  { id: 1, name_ar: "فلتر زيت", price: 12.5, stock: 24, part_number: "EU-1001" },
  { id: 2, name_ar: "فلتر هواء", price: 18, stock: 12, part_number: "EU-1002" },
  { id: 3, name_ar: "شمعات احتراق", price: 32, stock: 0, part_number: "EU-1003" },
  { id: 4, name_ar: "فحمات فرامل", price: 45, stock: 8, part_number: "EU-1004" },
  { id: 5, name_ar: "سير محرك", price: 27.5, stock: 5, part_number: "EU-1005" },
];
export default function Home() {
  const [name] = useState("مستخدم تجريبي");
  const [kw, setKw] = useState("");
  const items = useMemo(() => {
    const s = kw.trim().toLowerCase();
    return demoProducts.filter(p => !s || p.name_ar.toLowerCase().includes(s) || p.part_number.toLowerCase().includes(s));
  }, [kw]);
  return (
    <div id="home" className="mx-auto min-h-screen max-w-md pb-20">
      <header className="rounded-b-2xl bg-navy px-5 pb-5 pt-8 text-white">
        <p className="mb-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs">وضع تجريبي — البيانات غير محفوظة</p>
        <h1 className="text-lg font-bold">أهلاً بك في اليورو، {name}</h1>
        <p className="mt-2 text-sm text-silver">تصفّح قطع السيارات وجرّب البحث.</p>
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-navy2">
          <Search size={18} />
          <input aria-label="البحث عن المنتجات" className="w-full bg-transparent text-sm outline-none" placeholder="ابحث عن قطعة أو رقم المنتج" value={kw} onChange={e => setKw(e.target.value)} />
        </div>
      </header>
      <section className="mx-5 mt-4 grid grid-cols-2 gap-3 text-center">
        <div id="wallet" className="rounded-xl bg-navy p-4 text-white"><p className="text-xs text-silver">رصيد العمولات التجريبي</p><p className="mt-1 text-xl font-bold" dir="ltr">25.00 €</p></div>
        <div id="referrals" className="rounded-xl border border-silver p-4"><p className="text-xs text-slate-500">الإحالات التجريبية</p><p className="mt-1 text-xl font-bold">3</p></div>
      </section>
      <section id="products" className="mx-5 mt-5">
        <div className="flex items-center justify-between"><h2 className="font-bold">المنتجات</h2><span className="text-xs text-slate-500">{items.length} منتجات</span></div>
        {items.length === 0 ? <p className="mt-3 text-sm text-slate-500">لا توجد منتجات مطابقة.</p> :
          <ul className="mt-3 divide-y divide-silver">{items.map(p => (
            <li key={p.id} className="flex justify-between gap-3 py-3 text-sm"><span>{p.name_ar}<br /><span className="text-xs text-slate-500" dir="ltr">{p.part_number}</span></span>
              <span className="shrink-0 text-left"><b dir="ltr">{p.price.toFixed(2)} €</b><br /><span className={p.stock > 0 ? "text-green-700" : "text-red-700"}>{p.stock > 0 ? `متوفر (${p.stock})` : "غير متوفر"}</span></span></li>))}</ul>}
      </section>
      <p id="profile" className="mx-5 mt-5 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">هذا عرض تجريبي فقط. تسجيل الدخول والطلبات والعمولات ليست مرتبطة بقاعدة بيانات.</p>
      <Nav active="/home" />
    </div>
  );
}