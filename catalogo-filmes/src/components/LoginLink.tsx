"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { UserIcon } from "@/components/Icons";

/** "Entrar", voltando para a página atual depois do login. */
export function LoginLink() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const here = search ? `${pathname}?${search}` : pathname;
  const href = pathname.startsWith("/entrar") ? "/entrar" : `/entrar?next=${encodeURIComponent(here)}`;
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-full bg-accent px-3 py-3 text-sm font-semibold text-accent-ink hover:brightness-110 sm:px-4 sm:py-2"
    >
      <UserIcon className="size-4" />
      <span className="max-sm:sr-only">Entrar</span>
    </Link>
  );
}
