import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../../test/mock-api';
import {
  idleState,
  playingState,
  queueEntry,
  renderWithPlayback,
  track,
} from '../../test/fixtures';
import { ApiError } from '../../lib/api';
import { MusicLibrary } from './MusicLibrary';

vi.mock('../../lib/api', () => import('../../test/mock-api'));

beforeEach(() => {
  api.playback.get.mockResolvedValue(idleState());
});

describe('MusicLibrary', () => {
  it('mostra o estado de carregamento e depois o catalogo', async () => {
    api.tracks.list.mockResolvedValue([track(1), track(2, { album: 'Album X' })]);
    renderWithPlayback(<MusicLibrary />);
    expect(screen.getByText('Carregando catálogo...')).toBeInTheDocument();
    expect(await screen.findByText('Faixa 1')).toBeInTheDocument();
    expect(screen.getByText('Artista 2 · Album X')).toBeInTheDocument();
    expect(screen.getByText('2 músicas')).toBeInTheDocument();
  });

  it('mostra estado vazio com acao para adicionar', async () => {
    api.tracks.list.mockResolvedValue([]);
    renderWithPlayback(<MusicLibrary />);
    expect(await screen.findByText('Seu catálogo está vazio')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /adicionar música/i }).length).toBeGreaterThan(0);
  });

  it('mostra erro e permite tentar de novo', async () => {
    api.tracks.list.mockRejectedValueOnce(new ApiError(500, 'Erro interno do servidor.'));
    api.tracks.list.mockResolvedValueOnce([track(1)]);
    const user = userEvent.setup();
    renderWithPlayback(<MusicLibrary />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Erro interno do servidor.');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('Faixa 1')).toBeInTheDocument();
  });

  it('"Tocar agora" pede a reproducao e marca a musica como tocando', async () => {
    api.tracks.list.mockResolvedValue([track(1), track(2)]);
    api.playback.play.mockResolvedValue(playingState(2));
    const user = userEvent.setup();
    renderWithPlayback(<MusicLibrary />);
    await user.click(await screen.findByRole('button', { name: 'Tocar agora: Faixa 2' }));
    expect(api.playback.play).toHaveBeenCalledWith(track(2).id);
    const item = screen.getByText('Faixa 2').closest('li')!;
    expect(await within(item).findByText('Tocando')).toBeInTheDocument();
  });

  it('"Adicionar à fila" chama a API de fila e mostra feedback', async () => {
    api.tracks.list.mockResolvedValue([track(1)]);
    api.queue.add.mockResolvedValue(idleState({ queue: [queueEntry(1)] }));
    const user = userEvent.setup();
    renderWithPlayback(<MusicLibrary />);
    await user.click(await screen.findByRole('button', { name: 'Adicionar à fila: Faixa 1' }));
    expect(api.queue.add).toHaveBeenCalledWith(track(1).id);
    expect(api.playback.play).not.toHaveBeenCalled();
    expect(await screen.findByText('"Faixa 1" adicionada à fila.')).toBeInTheDocument();
  });

  it('mostra a mensagem da API quando tocar uma musica falha', async () => {
    api.tracks.list.mockResolvedValue([track(1)]);
    api.playback.play.mockRejectedValue(new ApiError(404, 'Musica nao encontrada.'));
    const user = userEvent.setup();
    renderWithPlayback(<MusicLibrary />);
    await user.click(await screen.findByRole('button', { name: 'Tocar agora: Faixa 1' }));
    expect(await screen.findByText('Musica nao encontrada.')).toBeInTheDocument();
  });

  it('busca com debounce e envia o termo para a API', async () => {
    api.tracks.list.mockResolvedValue([track(1)]);
    const user = userEvent.setup();
    renderWithPlayback(<MusicLibrary />);
    await screen.findByText('Faixa 1');
    await user.type(screen.getByRole('searchbox'), 'ana');
    await waitFor(() =>
      expect(api.tracks.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ q: 'ana' }),
        expect.anything(),
      ),
    );
  });

  it('cria uma musica pelo formulario e recarrega a lista', async () => {
    api.tracks.list.mockResolvedValueOnce([]).mockResolvedValueOnce([track(1)]);
    api.tracks.create.mockResolvedValue(track(1));
    const user = userEvent.setup();
    renderWithPlayback(<MusicLibrary />);
    await user.click((await screen.findAllByRole('button', { name: /adicionar música/i }))[0]!);
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText('Título'), 'Faixa 1');
    await user.type(within(dialog).getByLabelText('Artista'), 'Artista 1');
    await user.type(within(dialog).getByLabelText('URL do áudio'), 'https://x.test/a.mp3');
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));
    await waitFor(() =>
      expect(api.tracks.create).toHaveBeenCalledWith({
        title: 'Faixa 1',
        artist: 'Artista 1',
        album: null,
        audioUrl: 'https://x.test/a.mp3',
        coverUrl: null,
      }),
    );
    expect(await screen.findByText('Faixa 1')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('valida a URL de audio no formulario sem chamar a API', async () => {
    api.tracks.list.mockResolvedValue([track(1)]);
    const user = userEvent.setup();
    renderWithPlayback(<MusicLibrary />);
    await user.click((await screen.findAllByRole('button', { name: /adicionar música/i }))[0]!);
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText('Título'), 'X');
    await user.type(within(dialog).getByLabelText('Artista'), 'Y');
    await user.type(within(dialog).getByLabelText('URL do áudio'), 'javascript:alert(1)');
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('URL de áudio');
    expect(api.tracks.create).not.toHaveBeenCalled();
  });
});
