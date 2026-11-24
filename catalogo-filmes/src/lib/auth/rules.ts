// Regras puras do login (sem Supabase), fáceis de testar.

/**
 * Para onde voltar depois de entrar. Só aceita caminhos do próprio app ("/algo"),
 * para ninguém usar o link de login para mandar a pessoa a outro site.
 */
export function safeNext(next: string | string[] | undefined): string {
  const value = Array.isArray(next) ? next[0] : next;
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  // Navegadores descartam tabs/quebras de linha ao montar o endereço ("/\t/site.com" vira "//site.com").
  if (/[\u0000- \u007f\\]/.test(value)) return "/";
  try {
    // Última conferência: o endereço resolvido continua no próprio app.
    if (new URL(value, "http://cinelivre.local").origin !== "http://cinelivre.local") return "/";
  } catch {
    return "/";
  }
  return value;
}

const MESSAGES: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos",
  user_already_exists: "Este e-mail já tem conta",
  email_exists: "Este e-mail já tem conta",
  weak_password: "A senha precisa ter pelo menos 6 caracteres",
};

/** Erro do Supabase em português para a tela de login. */
export function authErrorMessage(error: { code?: string; message?: string }): string {
  return (error.code && MESSAGES[error.code]) || "Não foi possível entrar agora. Tente de novo.";
}

export type PendingMark = { movieId: number; status: "quero" | "assisti" };

/** O filme que a pessoa tocou antes de entrar (`?marcar=603:quero`). Inválido = null. */
export function parsePendingMark(value: string | string[] | undefined): PendingMark | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const match = raw?.match(/^([1-9]\d{0,9}):(quero|assisti)$/);
  if (!match) return null;
  return { movieId: Number(match[1]), status: match[2] as PendingMark["status"] };
}
