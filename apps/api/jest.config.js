/** Testes unitarios: nao dependem de banco de dados. */
const swc = require('./jest.swc');

module.exports = {
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  testEnvironment: 'node',
  transform: { '^.+\\.ts$': ['@swc/jest', swc] },
  moduleFileExtensions: ['ts', 'js', 'json'],
};
