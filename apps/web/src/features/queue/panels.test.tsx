import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../../test/mock-api';
import { SidePanel } from '../../components/SidePanel';
import {
  historyEntry,
  idleState,
  queueEntry,
  renderWithPlayback,
  snapshot,
} from '../../test/fixtures';

vi.mock('../../lib/api', () => import('../../test/mock-api'));

describe('Fila e historico', () => {
  it('mostra estados vazios informativos', async () => {
    api.playback.get.mockResolvedValue(idleState());
    const user = userEvent.setup();
    renderWithPlayback(<SidePanel />);
    expect(await screen.findByText('A fila está vazia')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /histórico/i }));
    expect(screen.getByText('Nada tocado ainda')).toBeInTheDocument();
  });

  it('lista a fila na ordem, indica a proxima e atualiza ao remover um item', async () => {
    api.playback.get.mockResolvedValue(
      idleState({ queue: [queueEntry(1), queueEntry(2), queueEntry(3)] }),
    );
    api.queue.remove.mockResolvedValue(idleState({ queue: [queueEntry(1), queueEntry(3)] }));
    const user = userEvent.setup();
    renderWithPlayback(<SidePanel />);

    const list = await screen.findByRole('list', { name: 'Fila de reprodução' });
    const titles = () =>
      within(list)
        .getAllByRole('listitem')
        .map((li) => li.querySelector('p')!.textContent);
    expect(titles()).toEqual(['Faixa 1Próxima', 'Faixa 2', 'Faixa 3']);

    await user.click(screen.getByRole('button', { name: 'Remover da fila: Faixa 2' }));
    expect(api.queue.remove).toHaveBeenCalledWith('entry-2');
    expect(await screen.findByText('"Faixa 2" removida da fila.')).toBeInTheDocument();
    expect(titles()).toEqual(['Faixa 1Próxima', 'Faixa 3']);
  });

  it('limpa a fila', async () => {
    api.playback.get.mockResolvedValue(idleState({ queue: [queueEntry(1)] }));
    api.queue.clear.mockResolvedValue(idleState());
    const user = userEvent.setup();
    renderWithPlayback(<SidePanel />);
    await user.click(await screen.findByRole('button', { name: /limpar fila/i }));
    expect(await screen.findByText('A fila está vazia')).toBeInTheDocument();
  });

  it('mostra o historico (mais recente primeiro) e toca de novo', async () => {
    api.playback.get.mockResolvedValue(idleState({ history: [historyEntry(2), historyEntry(1)] }));
    api.playback.play.mockResolvedValue(idleState());
    const user = userEvent.setup();
    renderWithPlayback(<SidePanel />);
    await user.click(await screen.findByRole('tab', { name: /histórico/i }));
    const items = within(
      screen.getByRole('list', { name: 'Histórico de reprodução' }),
    ).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Faixa 2');
    expect(items[1]).toHaveTextContent('Faixa 1');
    await user.click(screen.getByRole('button', { name: 'Tocar novamente: Faixa 1' }));
    expect(api.playback.play).toHaveBeenCalledWith(snapshot(1).id);
  });

  it('as abas alternam com as setas do teclado', async () => {
    api.playback.get.mockResolvedValue(idleState());
    const user = userEvent.setup();
    renderWithPlayback(<SidePanel />);
    const queueTab = await screen.findByRole('tab', { name: /fila/i });
    queueTab.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /histórico/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
});
