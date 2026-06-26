import Link from 'next/link'
import { Sparkles } from 'lucide-react'

const LINKS = {
  Product:  ['Features', 'Pricing', 'Changelog', 'Roadmap'],
  Company:  ['About', 'Blog', 'Careers', 'Press'],
  Legal:    ['Privacy', 'Terms', 'Security'],
  Support:  ['Documentation', 'API', 'Status', 'Contact'],
}

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#060310] px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-[13px] font-semibold text-white">Mira</span>
            </Link>
            <p className="text-[12px] leading-relaxed text-zinc-600">
              Your personal AI that turns recordings into clear protocols.
            </p>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([group, items]) => (
            <div key={group}>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">{group}</p>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-[13px] text-zinc-600 hover:text-zinc-300 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 md:flex-row">
          <p className="text-[12px] text-zinc-700">© 2026 Mira. All rights reserved.</p>
          <p className="text-[12px] text-zinc-700">Made with ♥ in Ulaanbaatar, Mongolia 🇲🇳</p>
        </div>
      </div>
    </footer>
  )
}
