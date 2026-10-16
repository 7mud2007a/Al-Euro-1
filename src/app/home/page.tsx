"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import Nav from "@/components/Nav";
import { supabase } from "@/lib/supabase";
type P = { id: string; name_ar: string; price: number; stock: number; part_number: string | null };
export default function Home() {
  const r = useRouter(), sb = supabase();
  const [name, setName] = useState(""), [pending, setPending] = useState(true), [bal, setBal] = useState(0), [refs, setRefs] = useState(0);
  const [kw, setKw] = useState(""), [items, setItems] = useState<P[]>([]), [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return r.replace("/login");
      const [p, w, c] = await Promise.all([
        sb.from("profiles").select("full_name,verification").eq("id", user.id).single(),
        sb.from("wallet_balance").select("total").eq("beneficiary_id", user.id).maybeSingle(),
        sb.from("referrals").select("referred_id", { count: "exact", head: true }).eq("referrer_id", user.id)]);
      setName(p.data?.full_name ?? ""); setPending(p.data?.verification !== "verified");
      setBal(Number(w.data?.total ?? 0)); setRefs(c.count ?? 0);
    })();
  }, []);
  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      const s = kw.trim().replace(/[%,()]/g, "");
      let q = sb.from("products").select("id,name_ar,price,stock,part_number").eq("active", true).limit(20);
      if (s) q = q.or(`name_ar.ilike.%${s}%,part_number.ilike.%${s}%`);
      setItems((await q).data ?? []); setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [kw]);
  return (
    <div className="mx-auto min-h-screen max-w-md pb-20">
      <header className="rounded-b-2xl bg-navy px-5 pb-5 pt-8 text-white">
        <h1 className="text-lg font-bold">أهلاً بك في اليورو، {name}</h1>
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-navy2">
          <Search size={18} />
          <input className="w-full bg-transparent text-sm outline-none" placeholder="ابحث عن قطعة أو رقم المنتج" value={kw} onChange={e => setKw(e.target.value)} />
        </div>
      </header>
      {pending && <p className="mx-5 mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">حسابك قيد المراجعة. يمكنك التصفح، والطلب بعد موافقة الإدارة.</p>}
      <section className="mx-5 mt-4 grid grid-cols-2 gap-3 text-center">
        <div className="rounded-xl bg-navy p-4 text-white"><p className="text-xs text-silver">رصيد العمولات</p><p className="mt-1 text-xl font-bold" dir="ltr">{bal.toFixed(2)}</p></div>
        <div className="rounded-xl border border-silver p-4"><p className="text-xs text-slate-500">الإحالات المسجلة</p><p className="mt-1 text-xl font-bold">{refs}</p></div>
      </section>
      <section className="mx-5 mt-5">
        <h2 className="font-bold">المنتجات</h2>
        {loading ? <p className="mt-3 text-sm text-slate-500">جارٍ التحميل...</p> : items.length === 0 ? <p className="mt-3 text-sm text-slate-500">لا توجد منتجات مطابقة.</p> :
          <ul className="mt-3 divide-y divide-silver">{items.map(p => (
            <li key={p.id} className="flex justify-between py-3 text-sm"><span>{p.name_ar}<br /><span className="text-xs text-slate-500" dir="ltr">{p.part_number}</span></span>
              <span className="text-left"><b dir="ltr">{Number(p.price).toFixed(2)}</b><br /><span className={p.stock > 0 ? "text-green-700" : "text-red-700"}>{p.stock > 0 ? `متوفر (${p.stock})` : "غير متوفر"}</span></span></li>))}</ul>}
      </section>
      <Nav active="/home" />
    </div>
  );
}
