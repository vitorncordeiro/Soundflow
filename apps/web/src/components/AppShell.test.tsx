import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../App';
import { api } from '../test/mock-api';
import { authClient, mockSession } from '../test/mock-auth';
import { idleState, track } from '../test/fixtures';

vi.mock('../lib/api', () => import('../test/mock-api'));
vi.mock('../lib/auth-client', () => import('../test/mock-auth'));

const USER = { id: 'u1', name: 'Ana', email: 'ana@example.com' };

function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  api.playback.get.mockResolvedValue(idleState());
  api.tracks.list.mockResolvedValue([track(1)]);
});

describe('Fluxo de autenticacao', () => {
  it('redireciona para o login quando nao ha sessao', async () => {
    mockSession(null);
    renderApp('/');
    expect(await screen.findByRole('heading', { name: 'Bem-vindo de volta' })).toBeInTheDocument();
    expect(api.tracks.list).not.toHaveBeenCalled();
  });

  it('mostra carregamento enquanto verifica a sessao', () => {
    mockSession(null, true);
    renderApp('/');
    expect(screen.getByText('Verificando sessão...')).toBeInTheDocument();
  });

  it('login com sucesso leva ao catalogo', async () => {
    mockSession(null);
    authClient.signIn.email.mockResolvedValue({ data: {}, error: null });
    const user = userEvent.setup();
    renderApp('/login');
    await user.type(await screen.findByLabelText('E-mail'), 'ana@example.com');
    await user.type(screen.getByLabelText('Senha'), 'senha-segura-123');
    mockSession(USER); // o Better Auth atualiza a sessao apos o login
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(authClient.signIn.email).toHaveBeenCalledWith({
      email: 'ana@example.com',
      password: 'senha-segura-123',
    });
    expect(await screen.findByText('Seu catálogo')).toBeInTheDocument();
  });

  it('mostra mensagem clara para credenciais invalidas', async () => {
    mockSession(null);
    authClient.signIn.email.mockResolvedValue({
      data: null,
      error: {
        code: 'INVALID_EMAIL_OR_PASSWORD',
        status: 401,
        message: 'Invalid email or password',
      },
    });
    const user = userEvent.setup();
    renderApp('/login');
    await user.type(await screen.findByLabelText('E-mail'), 'ana@example.com');
    await user.type(screen.getByLabelText('Senha'), 'errada-errada');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.');
  });

  it('cadastro envia nome, e-mail e senha', async () => {
    mockSession(null);
    authClient.signUp.email.mockResolvedValue({ data: {}, error: null });
    const user = userEvent.setup();
    renderApp('/cadastro');
    await user.type(await screen.findByLabelText('Nome'), 'Ana');
    await user.type(screen.getByLabelText('E-mail'), 'ana@example.com');
    await user.type(screen.getByLabelText('Senha'), 'senha-segura-123');
    mockSession(USER);
    await user.click(screen.getByRole('button', { name: 'Criar conta' }));
    await waitFor(() =>
      expect(authClient.signUp.email).toHaveBeenCalledWith({
        name: 'Ana',
        email: 'ana@example.com',
        password: 'senha-segura-123',
      }),
    );
  });

  it('com sessao, mostra o shell com o nome do usuario e permite sair', async () => {
    mockSession(USER);
    authClient.signOut.mockImplementation(async () => {
      mockSession(null);
    });
    const user = userEvent.setup();
    renderApp('/');
    expect(await screen.findByText('Seu catálogo')).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Player' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /sair/i }));
    expect(authClient.signOut).toHaveBeenCalled();
    expect(await screen.findByRole('heading', { name: 'Bem-vindo de volta' })).toBeInTheDocument();
  });

  it('mostra erro quando o estado de reproducao nao carrega e permite tentar de novo', async () => {
    mockSession(USER);
    api.playback.get.mockRejectedValueOnce(new Error('Falha ao carregar'));
    api.playback.get.mockResolvedValueOnce(idleState());
    const user = userEvent.setup();
    renderApp('/');
    expect(await screen.findByRole('alert')).toHaveTextContent('Falha ao carregar');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('Seu catálogo')).toBeInTheDocument();
  });
});
