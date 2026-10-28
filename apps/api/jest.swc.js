/**
 * Configuracao do SWC para o Jest.
 * `ignoreDynamic` preserva `import()`: o Better Auth e um pacote somente ESM,
 * carregado de forma dinamica a partir do codigo CommonJS do NestJS.
 */
module.exports = {
  jsc: {
    target: 'es2022',
    parser: { syntax: 'typescript', decorators: true },
    transform: { legacyDecorator: true, decoratorMetadata: true },
    keepClassNames: true,
  },
  module: { type: 'commonjs', ignoreDynamic: true },
  sourceMaps: 'inline',
};
