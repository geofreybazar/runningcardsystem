import { Controller, Get, Query } from '@nestjs/common';
import { Can } from '@nestjs/authorization';
import { z } from 'zod';
import { AccessPolicy } from '../auth/access.policy.js';
import { AuditService } from './audit.service.js';

const auditQuerySchema = z.strictObject({
  entity: z.string().optional(),
  take: z.coerce.number().int().min(1).max(500).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});

@Controller('audit-logs')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @Can(AccessPolicy, 'viewAuditLog')
  list(@Query({ schema: auditQuerySchema }) query: z.infer<typeof auditQuerySchema>) {
    return this.audit.list(query);
  }
}
