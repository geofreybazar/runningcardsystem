import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsString() @MinLength(1) @MaxLength(100) username: string;
  @IsString() @MinLength(1) @MaxLength(200) password: string;
}

export class ChangePasswordDto {
  @IsString() @MaxLength(200) currentPassword: string;
  @IsString() @MinLength(8) @MaxLength(200) newPassword: string;
}
