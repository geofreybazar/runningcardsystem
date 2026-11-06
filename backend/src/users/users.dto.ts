import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { OfficeLevel, Role } from '../generated/prisma/enums.js';

export class CreateUserDto {
  @IsString() @MinLength(3) @MaxLength(50) @Matches(/^[a-zA-Z0-9._-]+$/, { message: 'username may only contain letters, numbers, . _ -' })
  username: string;

  @IsString() @MinLength(1) @MaxLength(120) fullName: string;

  @IsEnum(Role) role: Role;

  /** Defaults to REGIONAL. DISTRICT needs districtId; CITY needs cityId (the district follows from the city). */
  @IsOptional() @IsEnum(OfficeLevel) officeLevel?: OfficeLevel;
  @IsOptional() @IsInt() districtId?: number | null;
  @IsOptional() @IsInt() cityId?: number | null;
}

export class UpdateUserDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(120) fullName?: string;
  @IsOptional() @IsEnum(Role) role?: Role;
  @IsOptional() @IsEnum(OfficeLevel) officeLevel?: OfficeLevel;
  @IsOptional() @IsInt() districtId?: number | null;
  @IsOptional() @IsInt() cityId?: number | null;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
