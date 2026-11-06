import { IsBoolean, IsEnum, IsInt, IsLatitude, IsLongitude, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { TruckOwnership, TruckStatus, TruckType } from '../generated/prisma/enums.js';

export class StationQuery {
  @IsOptional() @Type(() => Number) @IsInt() districtId?: number;
}

export class CreateStationDto {
  @IsString() @MinLength(1) @MaxLength(150) name: string;
  @IsLatitude() lat: number;
  @IsLongitude() lng: number;
  @IsInt() districtId: number;
  @IsOptional() @IsInt() cityId?: number | null;
  @IsOptional() @IsString() @MaxLength(250) address?: string | null;
  @IsOptional() @IsString() @MaxLength(50) contactNumber?: string | null;
}

export class UpdateStationDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(150) name?: string;
  @IsOptional() @IsLatitude() lat?: number;
  @IsOptional() @IsLongitude() lng?: number;
  @IsOptional() @IsInt() districtId?: number;
  @IsOptional() @IsInt() cityId?: number | null;
  @IsOptional() @IsString() @MaxLength(250) address?: string | null;
  @IsOptional() @IsString() @MaxLength(50) contactNumber?: string | null;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateTruckDto {
  @IsString() @MinLength(1) @MaxLength(80) callSign: string;
  @IsOptional() @IsString() @MaxLength(20) plateNumber?: string | null;
  @IsEnum(TruckType) type: TruckType;
  @IsOptional() @IsInt() @Min(0) waterCapacityLiters?: number | null;
  @IsEnum(TruckOwnership) ownership: TruckOwnership;
}

export class UpdateTruckDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(80) callSign?: string;
  @IsOptional() @IsString() @MaxLength(20) plateNumber?: string | null;
  @IsOptional() @IsEnum(TruckType) type?: TruckType;
  @IsOptional() @IsInt() @Min(0) waterCapacityLiters?: number | null;
  @IsOptional() @IsEnum(TruckOwnership) ownership?: TruckOwnership;
  @IsOptional() @IsEnum(TruckStatus) status?: TruckStatus;
}
