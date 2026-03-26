import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Param,
  UseGuards,
  Res,
  Header,
  Patch,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  GetUtilityStatsDto,
  VerifyShareDto,
} from './dto/payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Response } from 'express';

@ApiTags('缴费记录')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('share/:id/verify')
  @ApiParam({ name: 'id', description: '缴费记录 ID' })
  @ApiOperation({ summary: '获取分享验证信息（无需登录）' })
  async getShareVerifyInfo(@Param('id') id: string) {
    return this.paymentsService.getShareVerifyInfo(+id);
  }

  @Post('share/:id/verify')
  @ApiParam({ name: 'id', description: '缴费记录 ID' })
  @ApiOperation({ summary: '验证身份证后6位并获取缴费详情（无需登录）' })
  async verifyShare(@Param('id') id: string, @Body() verifyShareDto: VerifyShareDto) {
    return this.paymentsService.verifyAndShare(+id, verifyShareDto.idCardLast6);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'search', required: false, description: '搜索租户姓名' })
  @ApiQuery({ name: 'type', required: false, description: '缴费类型' })
  @ApiQuery({ name: 'year', required: false, description: '年份' })
  @ApiQuery({ name: 'tenantId', required: false, description: '租客ID' })
  @ApiQuery({ name: 'startDate', required: false, description: '开始日期(YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: '结束日期(YYYY-MM-DD)' })
  @ApiOperation({ summary: '获取所有缴费记录' })
  async findAll(
    @Query()
    query: {
      search?: string;
      type?: string;
      year?: string;
      tenantId?: number;
      startDate?: string;
      endDate?: string;
    },
  ) {
    return this.paymentsService.findAll(query);
  }

  @Get('stats/monthly')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取月度统计' })
  async getMonthlyStats() {
    return this.paymentsService.getMonthlyStats();
  }

  @Get('stats/yearly')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取年度统计' })
  async getYearlyStats() {
    return this.paymentsService.getYearlyStats();
  }

  @Get('utility-stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'tenantId', required: false, description: '租客ID' })
  @ApiQuery({ name: 'year', required: false, description: '年份' })
  @ApiQuery({ name: 'month', required: false, description: '月份' })
  @ApiOperation({ summary: '获取水电表统计记录' })
  async getUtilityStats(@Query() query: GetUtilityStatsDto) {
    return this.paymentsService.getUtilityStats(query);
  }

  @Get('utility-stats/tenant/:tenantId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'tenantId', description: '租客ID' })
  @ApiQuery({ name: 'year', required: false, description: '年份，默认当前年份' })
  @ApiOperation({ summary: '获取指定租客指定年份的水电统计' })
  async getTenantUtilityByYear(@Param('tenantId') tenantId: string, @Query('year') year?: string) {
    return this.paymentsService.getTenantUtilityByYear(+tenantId, year ? +year : undefined);
  }

  @Get('export/csv')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'type', required: false, description: '缴费类型' })
  @ApiQuery({ name: 'year', required: false, description: '年份' })
  @ApiQuery({ name: 'tenantId', required: false, description: '租客 ID' })
  @ApiOperation({ summary: '导出缴费记录 CSV' })
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="payments.csv"')
  async exportCsv(
    @Query() query: { type?: string; year?: string; tenantId?: number },
    @Res() res: Response,
  ) {
    const payments = await this.paymentsService.findAll(query);
    const csv = this.paymentsService.exportToCsv(payments);
    res.send(csv);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '缴费记录 ID' })
  @ApiOperation({ summary: '获取单个缴费记录' })
  async findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(+id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建缴费记录，支持多个缴费类型' })
  async create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '缴费记录 ID' })
  @ApiOperation({ summary: '更新缴费记录' })
  async update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentsService.update(+id, updatePaymentDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '缴费记录 ID' })
  @ApiOperation({ summary: '删除缴费记录' })
  async remove(@Param('id') id: string) {
    return this.paymentsService.remove(+id);
  }
}
