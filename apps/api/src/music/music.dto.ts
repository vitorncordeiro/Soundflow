import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import type { SortOrder, TrackSort } from '@pulse/shared';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const trimToNull = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || null : value;

// Apenas http(s). O servidor nunca busca essas URLs; quem as acessa e o navegador.
const URL_OPTIONS = { protocols: ['http', 'https'], require_protocol: true, require_tld: false };
const URL_MESSAGE = 'deve ser uma URL http(s) valida';

export class CreateTrackDto {
  @Transform(trim)
  @IsString({ message: 'title deve ser um texto' })
  @IsNotEmpty({ message: 'title e obrigatorio' })
  @MaxLength(200, { message: 'title deve ter no maximo 200 caracteres' })
  title!: string;

  @Transform(trim)
  @IsString({ message: 'artist deve ser um texto' })
  @IsNotEmpty({ message: 'artist e obrigatorio' })
  @MaxLength(200, { message: 'artist deve ter no maximo 200 caracteres' })
  artist!: string;

  @Transform(trimToNull)
  @IsOptional()
  @IsString({ message: 'album deve ser um texto' })
  @MaxLength(200, { message: 'album deve ter no maximo 200 caracteres' })
  album?: string | null;

  @Transform(trimToNull)
  @IsOptional()
  @IsUrl(URL_OPTIONS, { message: `coverUrl ${URL_MESSAGE}` })
  @MaxLength(2048)
  coverUrl?: string | null;

  @Transform(trim)
  @IsUrl(URL_OPTIONS, { message: `audioUrl ${URL_MESSAGE}` })
  @MaxLength(2048)
  audioUrl!: string;

  @IsOptional()
  @IsInt({ message: 'durationSeconds deve ser um inteiro' })
  @Min(1, { message: 'durationSeconds deve ser maior que zero' })
  @Max(86_400, { message: 'durationSeconds deve ser no maximo 86400' })
  durationSeconds?: number | null;
}

/** Campos editaveis (lista permitida). Campos obrigatorios nao aceitam null. */
export class UpdateTrackDto {
  @Transform(trim)
  @ValidateIf((_, value) => value !== undefined)
  @IsString({ message: 'title deve ser um texto' })
  @IsNotEmpty({ message: 'title nao pode ser vazio' })
  @MaxLength(200, { message: 'title deve ter no maximo 200 caracteres' })
  title?: string;

  @Transform(trim)
  @ValidateIf((_, value) => value !== undefined)
  @IsString({ message: 'artist deve ser um texto' })
  @IsNotEmpty({ message: 'artist nao pode ser vazio' })
  @MaxLength(200, { message: 'artist deve ter no maximo 200 caracteres' })
  artist?: string;

  @Transform(trimToNull)
  @IsOptional()
  @IsString({ message: 'album deve ser um texto' })
  @MaxLength(200, { message: 'album deve ter no maximo 200 caracteres' })
  album?: string | null;

  @Transform(trimToNull)
  @IsOptional()
  @IsUrl(URL_OPTIONS, { message: `coverUrl ${URL_MESSAGE}` })
  @MaxLength(2048)
  coverUrl?: string | null;

  @Transform(trim)
  @ValidateIf((_, value) => value !== undefined)
  @IsUrl(URL_OPTIONS, { message: `audioUrl ${URL_MESSAGE}` })
  @MaxLength(2048)
  audioUrl?: string;

  @IsOptional()
  @IsInt({ message: 'durationSeconds deve ser um inteiro' })
  @Min(1, { message: 'durationSeconds deve ser maior que zero' })
  @Max(86_400, { message: 'durationSeconds deve ser no maximo 86400' })
  durationSeconds?: number | null;
}

export class ListTracksQueryDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'q deve ter no maximo 100 caracteres' })
  q?: string;

  @IsOptional()
  @IsIn(['title', 'artist', 'createdAt'], {
    message: 'sort deve ser title, artist ou createdAt',
  })
  sort?: TrackSort;

  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'order deve ser asc ou desc' })
  order?: SortOrder;
}
