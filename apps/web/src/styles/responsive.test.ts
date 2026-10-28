import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const css = (path: string) => readFileSync(resolve(__dirname, '..', path), 'utf8');

/**
 * O jsdom nao calcula layout, entao este teste e apenas um guarda de regressao:
 * garante que as regras responsivas essenciais continuam presentes nos arquivos CSS.
 */
describe('layout responsivo essencial (verificacao estatica do CSS)', () => {
  it('o conteudo reserva espaco para o player fixo', () => {
    expect(css('components/AppShell.module.css')).toMatch(/padding:[^;]*var\(--player-height\)/);
  });

  it('a grade principal vira uma coluna em telas menores', () => {
    const shell = css('components/AppShell.module.css');
    expect(shell).toMatch(
      /@media \(max-width: 960px\)[\s\S]*grid-template-columns: minmax\(0, 1fr\)/,
    );
  });

  it('o player reorganiza em coluna e preserva os controles em telas pequenas', () => {
    const player = css('features/player/AudioPlayer.module.css');
    expect(player).toMatch(/@media \(max-width: 720px\)[\s\S]*grid-template-columns: 1fr/);
  });

  it('respeita prefers-reduced-motion e o fundo nao captura cliques', () => {
    const global = css('styles/global.css');
    expect(global).toMatch(/prefers-reduced-motion: reduce/);
    expect(global).toMatch(/body::before[\s\S]*pointer-events: none/);
  });
});
