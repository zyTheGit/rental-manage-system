import { Module, Global } from '@nestjs/common';
import { EmailService } from './email.service';
import { TemplateService } from './template.service';

@Global()
@Module({
  providers: [TemplateService, EmailService],
  exports: [EmailService],
})
export class EmailModule {}