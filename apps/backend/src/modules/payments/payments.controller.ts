import { Controller, Get, Post, Query, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('缴费记录')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiQuery({ name: 'type', required: false, description: '缴费类型' })
  @ApiQuery({ name: 'year', required: false, description: '年份' })
  @ApiOperation({ summary: '获取所有缴费记录' })
  async findAll(@Query() query: { type?: string; year?: string }) {
    return this.paymentsService.findAll(query);
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: '缴费记录 ID' })
  @ApiOperation({ summary: '获取单个缴费记录' })
  async findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(+id);
  }

  @Post()
  @ApiOperation({ summary: '创建缴费记录' })
  async create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Get('stats/month')
  @ApiOperation({ summary: '获取月度统计' })
  async getMonthlyStats() {
    return this.paymentsService.getMonthlyStats();
  }

  @Get('stats/year')
  @ApiOperation({ summary: '获取年度统计' })
  async getYearlyStats() {
    return this.paymentsService.getYearlyStats();
  }
}
