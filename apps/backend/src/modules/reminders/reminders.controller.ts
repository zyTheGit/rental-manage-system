import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { RemindersService } from './reminders.service';
import { CreateReminderDto, UpdateReminderDto } from './dto/reminder.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('缴费提醒')
@Controller('reminders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  @ApiOperation({ summary: '获取所有提醒配置' })
  async findAll() {
    return this.remindersService.findAll();
  }

  @Get('overdue')
  @ApiOperation({ summary: '获取逾期提醒列表' })
  async getOverdueReminders() {
    return this.remindersService.getOverdueReminders();
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: '提醒 ID' })
  @ApiOperation({ summary: '获取单个提醒配置' })
  async findOne(@Param('id') id: string) {
    return this.remindersService.findOne(+id);
  }

  @Get('tenant/:tenantId')
  @ApiParam({ name: 'tenantId', description: '租户 ID' })
  @ApiOperation({ summary: '获取指定租户的提醒配置' })
  async findByTenant(@Param('tenantId') tenantId: string) {
    return this.remindersService.findByTenant(+tenantId);
  }

  @Post()
  @ApiQuery({ name: 'tenantId', description: '租户 ID' })
  @ApiOperation({ summary: '创建提醒配置' })
  async create(@Body() createReminderDto: CreateReminderDto, @Query('tenantId') tenantId: string) {
    return this.remindersService.create(createReminderDto, +tenantId);
  }

  @Put(':id')
  @ApiParam({ name: 'id', description: '提醒 ID' })
  @ApiOperation({ summary: '更新提醒配置' })
  async update(@Param('id') id: string, @Body() updateReminderDto: UpdateReminderDto) {
    return this.remindersService.update(+id, updateReminderDto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', description: '提醒 ID' })
  @ApiOperation({ summary: '删除提醒配置' })
  async remove(@Param('id') id: string) {
    return this.remindersService.remove(+id);
  }
}
