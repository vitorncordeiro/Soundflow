/** Testes de integracao: exigem PostgreSQL (veja o README, secao Testes). */
const swc = require('./jest.swc');

module.exports = {
  rootDir: 'test',
  testRegex: '.*\\.e2e-spec\\.ts$',
  testEnvironment: 'node',
  testTimeout: 30000,
  transform: { '^.+\\.ts$': ['@swc/jest', swc] },
  moduleFileExtensions: ['ts', 'js', 'json'],
  globalSetup: '<rootDir>/global-setup.ts',
  setupFiles: ['<rootDir>/setup-env.ts'],
};
