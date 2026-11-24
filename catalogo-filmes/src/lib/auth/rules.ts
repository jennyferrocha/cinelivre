// Regras puras do login (sem Supabase), fáceis de testar.

/**
 * Para onde voltar depois de entrar. Só aceita caminhos do próprio app ("/algo"),
 * para ninguém usar o link de login para mandar a pessoa a outro site.
 */
export function safeNext(next: string | string[] | undefined): string {
  const value = Array.isArray(next) ? next[0] : next;
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
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
