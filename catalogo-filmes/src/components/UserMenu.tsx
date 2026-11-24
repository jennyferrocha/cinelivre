import { AccountMenu } from "@/components/AccountMenu";
import { UserIcon } from "@/components/Icons";
import { LoginLink } from "@/components/LoginLink";
import { signOut } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { supabaseConfig } from "@/lib/supabase/config";

/** Canto do topo: "Entrar" para quem não está logado; perfil com "Sair" para quem está. */
export async function UserMenu() {
  if (!supabaseConfig()) return null;
  const user = await getCurrentUser();
  if (!user) return <LoginLink />;
  return (
    <AccountMenu
      summary={
        <summary
          aria-label="Sua conta"
          className="grid size-10 cursor-pointer list-none place-items-center rounded-full bg-accent text-accent-ink hover:brightness-110 [&::-webkit-details-marker]:hidden"
        >
          <UserIcon />
        </summary>
      }
    >
      <div className="absolute top-12 right-0 z-40 flex w-60 flex-col gap-3 rounded-lg border border-line bg-surface p-4 shadow-xl">
        <p className="truncate text-sm text-muted" title={user.email}>
          {user.email}
        </p>
        <form action={signOut}>
          <button type="submit" className="w-full rounded-md bg-surface-2 px-4 py-2 text-sm font-semibold hover:bg-line">
            Sair
          </button>
        </form>
      </div>
    </AccountMenu>
  );
}
