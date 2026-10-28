import { SetMetadata } from '@nestjs/common';

export const AUTH = Symbol('AUTH');
export const IS_PUBLIC = 'isPublic';
/** Marca uma rota como publica (sem sessao). Por padrao todas as rotas exigem sessao. */
export const Public = () => SetMetadata(IS_PUBLIC, true);
