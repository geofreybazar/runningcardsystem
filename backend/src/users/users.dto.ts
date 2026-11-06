import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { Role } from '../generated/prisma/enums.js';

export class CreateUserDto {
  @IsString() @MinLength(3) @MaxLength(50) @Matches(/^[a-zA-Z0-9._-]+$/, { message: 'username may only contain letters, numbers, . _ -' })
  username: string;

  @IsString() @MinLength(1) @MaxLength(120) fullName: string;

  @IsEnum(Role) role: Role;

  @ValidateIf((o) => o.role === Role.OPERATIONS) @IsInt() districtId?: number;
}

export class UpdateUserDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(120) fullName?: string;
  @IsOptional() @IsEnum(Role) role?: Role;
  @IsOptional() @IsInt() districtId?: number | null;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
