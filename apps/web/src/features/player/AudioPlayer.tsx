import { useCallback, useEffect, useRef, useState } from 'react';
import { Cover } from '../../components/Cover';
import { AlertIcon } from '../../components/Icons';
import { PlaybackControls } from './PlaybackControls';
import { ProgressBar } from './ProgressBar';
import { VolumeControl } from './VolumeControl';
import { usePlayback } from './playback-context';
import styles from './AudioPlayer.module.css';

/** Se a musica ja passou deste ponto, "Anterior" volta ao inicio em vez de ir a faixa anterior. */
const RESTART_THRESHOLD_SECONDS = 3;
const VOLUME_KEY = 'pulse:volume';

function mediaErrorMessage(code: number | undefined): string {
  switch (code) {
    case 2:
      return 'Falha de rede ao carregar o áudio. Verifique a conexão.';
    case 3:
      return 'Não foi possível decodificar o áudio. O arquivo pode estar corrompido.';
    case 4:
      return 'Formato ou endereço de áudio não suportado.';
    default:
      return 'Não foi possível reproduzir esta música.';
  }
}

function readStoredVolume(): { volume: number; muted: boolean } {
  try {
    const raw = window.localStorage.getItem(VOLUME_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { volume?: unknown; muted?: unknown };
      const volume =
        typeof parsed.volume === 'number' ? Math.min(1, Math.max(0, parsed.volume)) : 0.8;
      return { volume, muted: parsed.muted === true };
    }
  } catch {
    /* armazenamento indisponivel: usa o padrao */
  }
  return { volume: 0.8, muted: false };
}

/**
 * Player fixo. O elemento <audio> e a fonte do progresso; o servidor e a fonte do
 * estado logico (faixa atual, fila, historico). Os eventos reais do audio sincronizam os dois.
 */
export function AudioPlayer() {
  const playback = usePlayback();
  const { state, retryNonce } = playback;
  const { current, status } = state;

  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [{ volume, muted }, setVolumeState] = useState(readStoredVolume);

  // Refs com o valor mais recente, lidos pelos handlers de evento do <audio>.
  const statusRef = useRef(status);
  const runIdRef = useRef<string | null>(null);
  const switchingRef = useRef(false);
  const endedHandledRef = useRef<string | null>(null);
  useEffect(() => {
    statusRef.current = status;
    runIdRef.current = current?.runId ?? null;
  }, [status, current?.runId]);

  const runId = current?.runId ?? null;
  const audioUrl = current?.track.audioUrl ?? null;

  const tryPlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.play().then(
      () => setBlocked(false),
      (error: unknown) => {
        const name = error instanceof DOMException ? error.name : '';
        if (name === 'NotAllowedError') setBlocked(true);
        // AbortError acontece quando a fonte troca durante o play(): e esperado.
      },
    );
  }, []);

  // Troca da fonte: nova execucao (runId), nova URL ou "tentar de novo".
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(0);
    setDuration(0);
    setBlocked(false);
    setAudioPlaying(false);
    if (!audioUrl) {
      switchingRef.current = false;
      setLoading(false);
      audio.removeAttribute('src');
      audio.load();
      return;
    }
    switchingRef.current = true;
    setLoading(true);
    audio.src = audioUrl;
    audio.load();
    if (statusRef.current === 'playing') tryPlay();
  }, [runId, audioUrl, retryNonce, tryPlay]);

  // Pausar/retomar a mesma execucao.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !runId) return;
    if (status === 'playing' && audio.paused) tryPlay();
    if (status === 'paused' && !audio.paused) audio.pause();
  }, [status, runId, tryPlay]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
      audio.muted = muted;
    }
    try {
      window.localStorage.setItem(VOLUME_KEY, JSON.stringify({ volume, muted }));
    } catch {
      /* ignorado */
    }
  }, [volume, muted]);

  function handleEnded() {
    const id = runIdRef.current;
    if (!id || endedHandledRef.current === id) return;
    endedHandledRef.current = id;
    void playback.reportEnded(id);
  }

  function handleError() {
    const audio = audioRef.current;
    const id = runIdRef.current;
    if (!audio || !id || !audio.getAttribute('src')) return;
    const code = audio.error?.code;
    if (code === 1) return; // MEDIA_ERR_ABORTED: troca de fonte, nao e falha
    switchingRef.current = false;
    setLoading(false);
    setAudioPlaying(false);
    void playback.reportError(id, mediaErrorMessage(code));
  }

  function handlePlayEvent() {
    setAudioPlaying(true);
    setBlocked(false);
    // Play externo (ex.: teclas de midia) enquanto o servidor diz "pausado".
    if (!switchingRef.current && statusRef.current === 'paused' && runIdRef.current) {
      void playback.resume();
    }
  }

  function handlePauseEvent() {
    setAudioPlaying(false);
    const audio = audioRef.current;
    // Pausa externa: sincroniza o servidor. Ignora fim de faixa e troca de fonte.
    if (
      audio &&
      !audio.ended &&
      !switchingRef.current &&
      statusRef.current === 'playing' &&
      runIdRef.current
    ) {
      void playback.pause();
    }
  }

  function handlePlayPause() {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (status === 'paused') {
      if (state.error) void playback.retryCurrent();
      else void playback.resume();
      return;
    }
    // status === 'playing'
    if (audioPlaying) void playback.pause();
    else tryPlay(); // bloqueio de autoplay ou carregamento: chamada direta dentro do gesto do usuario
  }

  function handlePrevious() {
    const audio = audioRef.current;
    if (audio && current && audio.currentTime > RESTART_THRESHOLD_SECONDS) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    void playback.previous();
  }

  function handleSeek(seconds: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = seconds;
    setCurrentTime(seconds);
  }

  const hasCurrent = Boolean(current);
  const track = current?.track;
  const hasError = Boolean(state.error);
  const canPrevious = hasCurrent || state.history.length > 0;
  const canNext = hasCurrent || state.queue.length > 0;

  let statusText = 'Nenhuma música selecionada';
  if (current) {
    if (hasError) statusText = 'Erro ao reproduzir';
    else if (blocked) statusText = 'Toque em Reproduzir para iniciar';
    else if (status === 'paused') statusText = 'Em pausa';
    else if (loading) statusText = 'Carregando...';
    else statusText = 'Tocando agora';
  }

  return (
    <section className={styles.player} aria-label="Player">
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          switchingRef.current = false;
          setLoading(false);
        }}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onWaiting={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
        onPlaying={() => {
          switchingRef.current = false;
          setLoading(false);
        }}
        onPlay={handlePlayEvent}
        onPause={handlePauseEvent}
        onEnded={handleEnded}
        onError={handleError}
      />

      <div className={styles.info}>
        {track ? (
          <Cover url={track.coverUrl} title={track.title} size={56} />
        ) : (
          <Cover url={null} title="" size={56} />
        )}
        <div className={styles.meta}>
          <p className={styles.title}>{track ? track.title : 'Pulse Player'}</p>
          <p className={styles.artist}>
            {track ? track.artist : 'Escolha uma música para começar'}
          </p>
          <p className={styles.status} role="status">
            {statusText}
          </p>
        </div>
      </div>

      <div className={styles.center}>
        <PlaybackControls
          playing={status === 'playing' && audioPlaying}
          loading={loading}
          hasCurrent={hasCurrent}
          canPrevious={canPrevious}
          canNext={canNext}
          onPlayPause={handlePlayPause}
          onPrevious={handlePrevious}
          onNext={() => void playback.next()}
        />
        <ProgressBar
          currentTime={currentTime}
          duration={duration || track?.durationSeconds || 0}
          disabled={!hasCurrent || hasError}
          onSeek={handleSeek}
        />
        {hasError && (
          <div className={styles.error} role="alert">
            <AlertIcon size={16} />
            <span>{state.error}</span>
            <button type="button" onClick={() => void playback.retryCurrent()}>
              Tentar novamente
            </button>
            <button type="button" onClick={() => void playback.next()}>
              Pular
            </button>
          </div>
        )}
      </div>

      <div className={styles.volume}>
        <VolumeControl
          volume={volume}
          muted={muted}
          onVolumeChange={(v) => setVolumeState({ volume: v, muted: v === 0 ? muted : false })}
          onToggleMute={() => setVolumeState((s) => ({ ...s, muted: !s.muted }))}
        />
      </div>
    </section>
  );
}
