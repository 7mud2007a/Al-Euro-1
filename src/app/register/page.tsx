"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
const types = [["customer", "عميل"], ["marketer", "مسوّق"], ["workshop", "ورشة"]] as const;
export default function Register() {
  const r = useRouter();
  const [type, setType] = useState<string>("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  function go(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setMessage("اكتب الاسم للتجربة");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setMessage("أدخل بريدًا إلكترونيًا صحيحًا للتجربة");
    r.push("/home");
  }
  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <p className="mb-3 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-800">وضع تجريبي</p>
      <h1 className="text-2xl font-bold">إنشاء حساب تجريبي</h1>
      <p className="mt-2 text-sm text-slate-500">هذه استمارة للعرض فقط؛ لن يتم إنشاء حساب أو حفظ البيانات.</p>
      <div className="mt-4 flex gap-2" role="radiogroup" aria-label="نوع الحساب">
        {types.map(([v, l]) => (
          <button type="button" key={v} role="radio" aria-checked={type === v} onClick={() => setType(v)}
            className={"flex-1 rounded-lg border py-2 text-sm " + (type === v ? "border-royal bg-royal text-white" : "border-silver")}>{l}</button>))}
      </div>
      <form onSubmit={go} noValidate>
        <label className="lbl">الاسم</label>
        <input className="inp" value={name} onChange={e => setName(e.target.value)} />
        <label className="lbl">البريد الإلكتروني</label>
        <input className="inp" type="email" dir="ltr" value={email} onChange={e => setEmail(e.target.value)} />
        {type === "workshop" && <p className="mt-3 text-sm text-slate-500">تسجيل الورشة غير محفوظ في النسخة التجريبية.</p>}
        {message && <p role="alert" className="mt-3 text-sm text-red-700">{message}</p>}
        <button className="btn mt-6">متابعة للتجربة</button>
      </form>
      <p className="mt-6 text-sm">لديك حساب؟ <Link href="/login" className="text-royal">دخول تجريبي</Link></p>
      <p className="mt-5"><Link href="/" className="text-sm text-royal">العودة للرئيسية</Link></p>
    </main>
  );
}