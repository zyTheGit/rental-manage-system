import { Module } from '@nestjs/common';
import { AdminInitService } from './admin-init.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [AdminInitService],
})
export class AdminInitModule {}
