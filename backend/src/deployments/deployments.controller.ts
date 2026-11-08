import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { AccessPolicy } from '../auth/access.policy.js';
import type { AuthUser } from '../auth/auth-user.js';
import { DeploymentsService } from './deployments.service.js';
import {
  assignTrucksSchema,
  createDeploymentSchema,
  deploymentQuerySchema,
  truckPostSchema,
  updateDeploymentSchema,
  type AssignTrucksDto,
  type CreateDeploymentDto,
  type DeploymentQuery,
  type TruckPostDto,
  type UpdateDeploymentDto,
} from './deployments.dto.js';

/** Everyone reads special deployments; only Regional Operations (and Super Admin) change them. */
@Controller('deployments')
@Can(AccessPolicy, 'operate')
export class DeploymentsController {
  constructor(private readonly deployments: DeploymentsService) {}

  @Get()
  list(@Query({ schema: deploymentQuerySchema }) query: DeploymentQuery) {
    return this.deployments.list(query.status);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.deployments.get(id);
  }

  @Can(AccessPolicy, 'manageDeployments')
  @Post()
  create(@CurrentUser() user: AuthUser, @Body({ schema: createDeploymentSchema }) dto: CreateDeploymentDto) {
    return this.deployments.create(user, dto);
  }

  @Can(AccessPolicy, 'manageDeployments')
  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body({ schema: updateDeploymentSchema }) dto: UpdateDeploymentDto) {
    return this.deployments.update(user, id, dto);
  }

  @Can(AccessPolicy, 'manageDeployments')
  @Post(':id/trucks')
  @HttpCode(200)
  assign(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body({ schema: assignTrucksSchema }) dto: AssignTrucksDto) {
    return this.deployments.assign(user, id, dto.truckIds);
  }

  @Can(AccessPolicy, 'manageDeployments')
  @Patch(':id/trucks/:truckId/post')
  setPost(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('truckId', ParseIntPipe) truckId: number,
    @Body({ schema: truckPostSchema }) dto: TruckPostDto,
  ) {
    return this.deployments.setPost(user, id, truckId, dto);
  }

  @Can(AccessPolicy, 'manageDeployments')
  @Post(':id/trucks/:truckId/release')
  @HttpCode(200)
  release(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Param('truckId', ParseIntPipe) truckId: number) {
    return this.deployments.release(user, id, truckId);
  }

  /** Soft delete; trucks still there are released first. */
  @Can(AccessPolicy, 'manageDeployments')
  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    await this.deployments.remove(user, id);
  }

  @Can(AccessPolicy, 'manageDeployments')
  @Post(':id/end')
  @HttpCode(200)
  end(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.deployments.end(user, id);
  }
}
