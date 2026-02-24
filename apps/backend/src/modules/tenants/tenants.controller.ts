import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('租户')
@Controller('tenants')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @ApiOperation({ summary: '获取所有租户' })
  async findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: '租户 ID' })
  @ApiOperation({ summary: '获取单个租户' })
  async findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(+id);
  }

  @Post()
  @ApiOperation({ summary: '创建租户' })
  async create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Put(':id')
  @ApiParam({ name: 'id', description: '租户 ID' })
  @ApiOperation({ summary: '更新租户' })
  async update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantsService.update(+id, updateTenantDto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', description: '租户 ID' })
  @ApiOperation({ summary: '删除租户' })
  async remove(@Param('id') id: string) {
    return this.tenantsService.remove(+id);
  }

  @Post(':id/checkout')
  @ApiParam({ name: 'id', description: '租户 ID' })
  @ApiOperation({ summary: '租户退租' })
  async checkout(@Param('id') id: string) {
    return this.tenantsService.checkout(+id);
  }
}
