import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class TrackIdDto {
  @IsUUID('all', { message: 'trackId deve ser um UUID valido' })
  trackId!: string;
}

export class RunIdDto {
  @IsUUID('all', { message: 'runId deve ser um UUID valido' })
  runId!: string;
}

export class ReportErrorDto extends RunIdDto {
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'message deve ter no maximo 200 caracteres' })
  message?: string;
}
