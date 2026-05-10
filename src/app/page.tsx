"use client";
import Hero from "@/components/hero";
export default function Home() {

  const footer = "w-full py-12 px-6 md:px-24 text-gray-400 text-xs border-t border-gray-100 mt-0";
  const link = "hover:text-[#007AFF] transition-colors";
  return (
    <main className="container">
      
      <Hero />
      <footer className={footer}>
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <p>© 2026 科成开放原子开源社团. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className={link}>
              Privacy Policy
            </a>
            <a href="#" className={link}>
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
