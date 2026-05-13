import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata = {
  title: "DraftOps | Autonomous AIOps Pipeline",
  description: "Real-time incident response and autonomous root cause analysis.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="bg-[#050505] text-white selection:bg-blue-500/30">
        {children}
      </body>
    </html>
  );
}
