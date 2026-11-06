import { IsEnum, IsInt, IsLatitude, IsLongitude, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { IncidentStatus } from '../generated/prisma/enums.js';

/** stationId → truckId the operator chose; stations not listed send their first available truck. */
export type TruckPicks = Record<string, number>;

export class CreateIncidentDto {
  @IsLatitude() lat: number;
  @IsLongitude() lng: number;
  @IsString() @MinLength(1) @MaxLength(250) locationLabel: string;
  @IsOptional() @IsInt() barangayId?: number;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
  @IsOptional() @IsObject() truckPicks?: TruckPicks;
}

export class RaiseAlarmDto {
  @IsOptional() @IsObject() truckPicks?: TruckPicks;
}

export class IncidentQuery {
  @IsOptional() @IsEnum(IncidentStatus) status?: IncidentStatus;
  @IsOptional() @Type(() => Number) @IsInt() take?: number;
}
