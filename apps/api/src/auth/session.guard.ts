import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AuthInstance, AuthUser } from './auth.factory';
import { AUTH, IS_PUBLIC } from './auth.constants';

export type AuthenticatedRequest = Request & { authUser?: AuthUser };

function toWebHeaders(raw: Request['headers']): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(raw)) {
    if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
    else if (value !== undefined) headers.set(key, value);
  }
  return headers;
}

/**
 * Guard global: valida a sessao do Better Auth em toda rota nao marcada com @Public().
 * A identidade vem sempre da sessao validada no servidor.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    @Inject(AUTH) private readonly auth: AuthInstance,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const session = await this.auth.api.getSession({ headers: toWebHeaders(request.headers) });
    if (!session) {
      throw new UnauthorizedException('Autenticacao necessaria.');
    }
    request.authUser = { id: session.user.id, name: session.user.name, email: session.user.email };
    return true;
  }
}

/** Injeta o usuario autenticado (vindo da sessao) no handler. */
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
  if (!request.authUser) throw new UnauthorizedException('Autenticacao necessaria.');
  return request.authUser;
});
