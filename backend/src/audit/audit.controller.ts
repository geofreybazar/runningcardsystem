import { Controller, Get, Query } from '@nestjs/common';
import { Can } from '@nestjs/authorization';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AccessPolicy } from '../auth/access.policy.js';
import { AuditService } from './audit.service.js';

class AuditQuery {
  @IsOptional() @IsString() entity?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(500) take?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) skip?: number;
}

@Controller('audit-logs')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @Can(AccessPolicy, 'viewAuditLog')
  list(@Query() query: AuditQuery) {
    return this.audit.list(query);
  }
}
