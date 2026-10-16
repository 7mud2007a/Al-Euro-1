import "./globals.css";
import { Tajawal } from "next/font/google";
const f = Tajawal({ subsets: ["arabic", "latin"], weight: ["400", "500", "700"], variable: "--font-tajawal" });
export const metadata = { title: "EURO | اليورو" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="ar" dir="rtl"><body className={f.variable + " font-sans"}>{children}</body></html>);
}
