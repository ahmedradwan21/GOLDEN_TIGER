// Full export surface of '@/lib/auth/session' so partial per-file mocks don't break other test files
// (bun shares module mocks across files and cannot add exports to an already-mocked module).
export const sessionMockBase = {
  getSession: async (): Promise<any> => null,
  getAdminSession: async (): Promise<any> => null,
  createSessionCookie: async () => {},
  createAdminCookie: async () => {},
  clearSessionCookie: () => {},
  clearAdminCookie: () => {},
  verifyToken: async (): Promise<any> => null,
};
