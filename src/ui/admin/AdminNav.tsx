"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Pedidos" },
  { href: "/admin/menu", label: "Menú" },
  { href: "/admin/reports", label: "Reportes" },
];

export const AdminNav = () => {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-2 text-sm">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-4 py-2 transition ${
              active
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
};
