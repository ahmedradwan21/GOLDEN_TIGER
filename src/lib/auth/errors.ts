export interface AuthResult {
  success: boolean;
  error?: string;
  code?: string;
}

const errorKeys: Record<string, string> = {
  EMAIL_NOT_REGISTERED: 'auth.error.emailNotRegistered',
  WRONG_PASSWORD: 'auth.error.wrongPassword',
  EMAIL_ALREADY_REGISTERED: 'auth.error.emailAlreadyRegistered',
  INVALID_INPUT: 'auth.error.invalidInput',
  RATE_LIMITED: 'auth.error.rateLimited',
  NETWORK_ERROR: 'auth.error.network',
  SERVER_ERROR: 'auth.error.server',
};

export function authErrorKey(code?: string): string {
  return (code && errorKeys[code]) || 'auth.error.server';
}

export function authFailure(data: { error?: string; code?: string }, status: number): AuthResult {
  // Status fallback keeps throttling and duplicate-email feedback compatible
  // with existing responses that do not yet include a structured code.
  const code = status === 429 ? 'RATE_LIMITED'
    : status === 409 ? 'EMAIL_ALREADY_REGISTERED'
    : data.code ?? (status === 400 ? 'INVALID_INPUT' : 'SERVER_ERROR');
  return { success: false, error: data.error, code };
}