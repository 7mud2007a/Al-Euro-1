"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
const types = [["customer", "عميل"], ["marketer", "مسوّق"], ["workshop", "ورشة"]] as const;
function Form() {
  const r = useRouter(), q = useSearchParams();
  const [t, setT] = useState<string>(q.get("role") === "workshop" ? "workshop" : "customer");
  const [f, setF] = useState<Record<string, string>>({ referral_code: q.get("ref") ?? "" });
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const fields: [string, string, string?][] = [["full_name", t === "workshop" ? "اسم المسؤول" : "الاسم الكامل"],
    ...(t === "workshop" ? [["workshop_name", "اسم الورشة"], ["reg_no", "رقم السجل التجاري"], ["governorate", "المحافظة"], ["city", "المدينة"]] as [string, string][] : []),
    ["phone", "رقم الهاتف"], ["email", "البريد الإلكتروني", "email"], ["password", "كلمة المرور", "password"],
    ["referral_code", "رمز الدعوة (اختياري)"]];
  async function go(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    const need = ["full_name", "email", "password", ...(t === "workshop" ? ["workshop_name", "reg_no", "governorate"] : [])];
    if (need.some(k => !f[k]?.trim())) return setErr("أكمل الحقول المطلوبة");
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr("البريد الإلكتروني غير صحيح");
    if (f.password.length < 8) return setErr("كلمة المرور 8 أحرف على الأقل");
    if (t === "workshop" && !file) return setErr("ارفع صورة السجل التجاري");
    setBusy(true);
    const sb = supabase(), { password, email, ...meta } = f;
    const { data, error } = await sb.auth.signUp({ email, password, options: { data: { ...meta, account_type: t } } });
    if (error || !data.user) { setBusy(false); return setErr("تعذّر إنشاء الحساب، تحقق من البيانات أو جرّب بريدًا آخر"); }
    if (t === "workshop" && file && data.session) {
      const path = `${data.user.id}/${Date.now()}.${file.name.split(".").pop()}`;
      const up = await sb.storage.from("workshop-docs").upload(path, file);
      if (!up.error) await sb.from("workshop_documents").insert({ user_id: data.user.id, path });
    }
    r.push(data.session ? "/home" : "/login");
  }
  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-2xl font-bold">إنشاء حساب جديد</h1>
      <div className="mt-4 flex gap-2" role="radiogroup">
        {types.map(([v, l]) => (
          <button type="button" key={v} role="radio" aria-checked={t === v} onClick={() => setT(v)}
            className={"flex-1 rounded-lg border py-2 text-sm " + (t === v ? "border-royal bg-royal text-white" : "border-silver")}>{l}</button>))}
      </div>
      <form onSubmit={go} noValidate>
        {fields.map(([k, l, type]) => (<div key={k}><label className="lbl">{l}</label>
          <input className="inp" type={type ?? "text"} dir={["email", "password", "phone", "referral_code"].includes(k) ? "ltr" : "rtl"} value={f[k] ?? ""} onChange={set(k)} /></div>))}
        {t === "workshop" && (<><label className="lbl">صورة السجل التجاري (إلزامي)</label>
          <input className="inp" type="file" accept="image/*,application/pdf" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          <p className="mt-2 text-xs text-slate-500">تبقى حسابات الورش قيد المراجعة حتى توافق الإدارة.</p></>)}
        {err && <p role="alert" className="mt-3 text-sm text-red-700">{err}</p>}
        <button className="btn mt-6" disabled={busy}>{busy ? "جارٍ الإرسال..." : t === "workshop" ? "إرسال طلب التسجيل" : "إنشاء الحساب"}</button>
      </form>
      <p className="mt-6 text-sm">لديك حساب؟ <Link href="/login" className="text-royal">تسجيل الدخول</Link></p>
    </main>
  );
}
export default function Register() { return <Suspense><Form /></Suspense>; }
