const BY_CODE: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'E-mail ou senha incorretos.',
  INVALID_PASSWORD: 'E-mail ou senha incorretos.',
  INVALID_EMAIL: 'Informe um e-mail válido.',
  USER_ALREADY_EXISTS: 'Já existe uma conta com este e-mail.',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'Já existe uma conta com este e-mail.',
  PASSWORD_TOO_SHORT: 'A senha deve ter pelo menos 8 caracteres.',
  PASSWORD_TOO_LONG: 'A senha deve ter no máximo 128 caracteres.',
};

interface AuthError {
  code?: string;
  status?: number;
  message?: string;
}

/** Traduz erros do Better Auth para mensagens claras em portugues. */
export function authErrorMessage(error: AuthError | null | undefined): string {
  if (!error) return 'Não foi possível concluir a operação.';
  if (error.code && BY_CODE[error.code]) return BY_CODE[error.code]!;
  if (error.status === 429) return 'Muitas tentativas. Aguarde um instante e tente de novo.';
  if (error.status === 0 || error.status === undefined) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
  }
  if (error.status >= 500) return 'Erro no servidor. Tente novamente em instantes.';
  return 'Não foi possível concluir a operação. Confira os dados e tente de novo.';
}
