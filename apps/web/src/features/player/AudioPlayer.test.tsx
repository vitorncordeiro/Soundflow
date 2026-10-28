import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../../test/mock-api';
import { idleState, playingState, queueEntry, renderWithPlayback } from '../../test/fixtures';
import { AudioPlayer } from './AudioPlayer';

vi.mock('../../lib/api', () => import('../../test/mock-api'));

const getAudio = () => document.querySelector('audio') as HTMLAudioElement;

function setAudioTime(audio: HTMLAudioElement, time: number) {
  Object.defineProperty(audio, 'currentTime', { value: time, writable: true, configurable: true });
}

describe('AudioPlayer', () => {
  it('sem musica: mostra o estado de ausencia e desabilita os controles principais', async () => {
    api.playback.get.mockResolvedValue(idleState());
    renderWithPlayback(<AudioPlayer />);
    expect(await screen.findByText('Nenhuma música selecionada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reproduzir' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Música anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Próxima música' })).toBeDisabled();
  });

  it('mostra titulo, artista e carrega a fonte de audio da faixa atual', async () => {
    api.playback.get.mockResolvedValue(playingState(1));
    renderWithPlayback(<AudioPlayer />);
    expect(await screen.findByText('Faixa 1')).toBeInTheDocument();
    expect(screen.getByText('Artista 1')).toBeInTheDocument();
    await waitFor(() => expect(getAudio().src).toBe('http://localhost/audio-1.mp3'));
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('metadados e progresso atualizam a interface; a barra permite buscar posicao', async () => {
    api.playback.get.mockResolvedValue(playingState(1));
    renderWithPlayback(<AudioPlayer />);
    await screen.findByText('Faixa 1');
    const audio = getAudio();
    Object.defineProperty(audio, 'duration', { value: 120, configurable: true });
    fireEvent.loadedMetadata(audio);
    setAudioTime(audio, 30);
    fireEvent.timeUpdate(audio);
    const slider = screen.getByRole('slider', { name: 'Posição na música' });
    expect(slider).toHaveAttribute('aria-valuetext', '0:30 de 2:00');

    fireEvent.change(slider, { target: { value: '90' } });
    expect(audio.currentTime).toBe(90);
  });

  it('pausar chama a API e o estado devolvido pausa o audio', async () => {
    api.playback.get.mockResolvedValue(playingState(1));
    api.playback.pause.mockResolvedValue(playingState(1, { status: 'paused' }));
    const user = userEvent.setup();
    renderWithPlayback(<AudioPlayer />);
    await screen.findByText('Faixa 1');
    fireEvent.play(getAudio()); // o navegador confirmou que esta tocando
    await user.click(await screen.findByRole('button', { name: 'Pausar' }));
    expect(api.playback.pause).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Em pausa')).toBeInTheDocument();
  });

  it('retomar quando pausado chama /resume', async () => {
    api.playback.get.mockResolvedValue(playingState(1, { status: 'paused' }));
    api.playback.resume.mockResolvedValue(playingState(1));
    const user = userEvent.setup();
    renderWithPlayback(<AudioPlayer />);
    await user.click(await screen.findByRole('button', { name: 'Reproduzir' }));
    expect(api.playback.resume).toHaveBeenCalledTimes(1);
  });

  it('proxima chama a API com o estado atualizado', async () => {
    api.playback.get.mockResolvedValue(playingState(1, { queue: [queueEntry(2)] }));
    api.playback.next.mockResolvedValue(playingState(2));
    const user = userEvent.setup();
    renderWithPlayback(<AudioPlayer />);
    await user.click(await screen.findByRole('button', { name: 'Próxima música' }));
    expect(await screen.findByText('Faixa 2')).toBeInTheDocument();
  });

  it('anterior apos 3 s reinicia localmente; antes disso chama a API', async () => {
    api.playback.get.mockResolvedValue(playingState(2));
    api.playback.previous.mockResolvedValue(playingState(1));
    const user = userEvent.setup();
    renderWithPlayback(<AudioPlayer />);
    await screen.findByText('Faixa 2');
    const audio = getAudio();

    setAudioTime(audio, 10);
    await user.click(screen.getByRole('button', { name: 'Música anterior' }));
    expect(api.playback.previous).not.toHaveBeenCalled();
    expect(audio.currentTime).toBe(0);

    await user.click(screen.getByRole('button', { name: 'Música anterior' }));
    expect(api.playback.previous).toHaveBeenCalledTimes(1);
  });

  it('o evento ended avisa a API uma unica vez, mesmo se repetido', async () => {
    api.playback.get.mockResolvedValue(playingState(1, { queue: [queueEntry(2)] }));
    api.playback.ended.mockResolvedValue(playingState(2));
    renderWithPlayback(<AudioPlayer />);
    await screen.findByText('Faixa 1');
    const audio = getAudio();
    fireEvent.ended(audio);
    fireEvent.ended(audio);
    await waitFor(() => expect(api.playback.ended).toHaveBeenCalledTimes(1));
    expect(api.playback.ended).toHaveBeenCalledWith('run-1');
    expect(await screen.findByText('Faixa 2')).toBeInTheDocument();
  });

  it('falha de audio e reportada, mostra erro claro e oferece tentar de novo ou pular', async () => {
    api.playback.get.mockResolvedValue(playingState(1));
    api.playback.error.mockResolvedValue(
      playingState(1, { status: 'paused', error: 'Formato ou endereço de áudio não suportado.' }),
    );
    renderWithPlayback(<AudioPlayer />);
    await screen.findByText('Faixa 1');
    const audio = getAudio();
    Object.defineProperty(audio, 'error', { value: { code: 4 }, configurable: true });
    fireEvent.error(audio);
    expect(api.playback.error).toHaveBeenCalledWith(
      'run-1',
      'Formato ou endereço de áudio não suportado.',
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('não suportado');
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pular' })).toBeInTheDocument();
    expect(screen.getByText('Erro ao reproduzir')).toBeInTheDocument();
  });

  it('ignora MEDIA_ERR_ABORTED (troca de fonte nao e falha)', async () => {
    api.playback.get.mockResolvedValue(playingState(1));
    renderWithPlayback(<AudioPlayer />);
    await screen.findByText('Faixa 1');
    const audio = getAudio();
    Object.defineProperty(audio, 'error', { value: { code: 1 }, configurable: true });
    fireEvent.error(audio);
    expect(api.playback.error).not.toHaveBeenCalled();
  });

  it('informa quando o navegador bloqueia a reproducao automatica', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValue(
      new DOMException('blocked', 'NotAllowedError'),
    );
    api.playback.get.mockResolvedValue(playingState(1));
    renderWithPlayback(<AudioPlayer />);
    await screen.findByText('Faixa 1');
    fireEvent.loadedMetadata(getAudio());
    expect(await screen.findByText('Toque em Reproduzir para iniciar')).toBeInTheDocument();
  });

  it('pausa externa do navegador sincroniza o servidor, mas nao durante a troca de fonte', async () => {
    api.playback.get.mockResolvedValue(playingState(1));
    api.playback.pause.mockResolvedValue(playingState(1, { status: 'paused' }));
    renderWithPlayback(<AudioPlayer />);
    await screen.findByText('Faixa 1');
    const audio = getAudio();

    fireEvent.pause(audio); // ainda trocando a fonte: ignorado
    expect(api.playback.pause).not.toHaveBeenCalled();

    fireEvent.loadedMetadata(audio);
    await act(async () => {
      fireEvent.pause(audio); // pausa externa, ex.: tecla de midia
    });
    expect(api.playback.pause).toHaveBeenCalledTimes(1);
  });

  it('volume e silenciar/restaurar usam aria-pressed', async () => {
    api.playback.get.mockResolvedValue(idleState());
    const user = userEvent.setup();
    renderWithPlayback(<AudioPlayer />);
    const mute = await screen.findByRole('button', { name: 'Silenciar' });
    expect(mute).toHaveAttribute('aria-pressed', 'false');
    await user.click(mute);
    const restore = screen.getByRole('button', { name: 'Restaurar volume' });
    expect(restore).toHaveAttribute('aria-pressed', 'true');
    expect(getAudio().muted).toBe(true);
  });
});
