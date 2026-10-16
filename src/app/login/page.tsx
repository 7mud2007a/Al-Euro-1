"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
export default function Login() {
  const r = useRouter();
  const [email, setEmail] = useState(""), [pw, setPw] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("أدخل بريدًا إلكترونيًا صحيحًا");
    if (pw.length < 8) return setErr("كلمة المرور 8 أحرف على الأقل");
    setBusy(true);
    const { error } = await supabase().auth.signInWithPassword({ email, password: pw });
    setBusy(false);
    if (error) return setErr("البريد أو كلمة المرور غير صحيحة");
    r.push("/home");
  }
  async function reset() {
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("اكتب بريدك أولًا ثم اضغط «نسيت كلمة المرور»");
    const { error } = await supabase().auth.resetPasswordForEmail(email);
    setErr(error ? "تعذّر إرسال الرابط، حاول لاحقًا" : "أرسلنا رابط الاستعادة إلى بريدك");
  }
  return (
    <main className="mx-auto max-w-md px-6 pt-16">
      <h1 className="text-2xl font-bold">تسجيل الدخول</h1>
      <form onSubmit={go} noValidate>
        <label className="lbl">البريد الإلكتروني</label>
        <input className="inp" type="email" dir="ltr" value={email} onChange={e => setEmail(e.target.value)} />
        <label className="lbl">كلمة المرور</label>
        <input className="inp" type="password" dir="ltr" value={pw} onChange={e => setPw(e.target.value)} />
        {err && <p role="alert" className="mt-3 text-sm text-red-700">{err}</p>}
        <button className="btn mt-6" disabled={busy}>{busy ? "جارٍ الدخول..." : "دخول"}</button>
      </form>
      <button onClick={reset} className="mt-4 text-sm text-royal">نسيت كلمة المرور؟</button>
      <p className="mt-6 text-sm">ليس لديك حساب؟ <Link href="/register" className="text-royal">إنشاء حساب جديد</Link></p>
    </main>
  );
}
