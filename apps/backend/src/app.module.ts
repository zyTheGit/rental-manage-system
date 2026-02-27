import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { HousesModule } from './modules/houses/houses.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AdminInitModule } from './modules/admin-init/admin-init.module';
import { JwtConfigModule } from './jwt-config/jwt-config.module';
import { RemindersModule } from './modules/reminders/reminders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtConfigModule,
    PrismaModule,
    AuthModule,
    HousesModule,
    TenantsModule,
    PaymentsModule,
    DashboardModule,
    AdminInitModule,
    RemindersModule,
  ],
})
export class AppModule {}
