import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { TemplateService } from './template.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private smtpConfig: { host: string; port: number; user: string } | null = null;

  constructor(
    private configService: ConfigService,
    private templateService: TemplateService,
  ) {
    this.initTransporter();
  }

  private initTransporter() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    this.logger.log(`SMTP Config - Host: ${host}, Port: ${port}, User: ${user ? '***' : 'not set'}`);

    if (!host || !user || !pass) {
      this.logger.warn('SMTP configuration is missing. Email service will not work.');
      this.logger.warn('Please set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env file');
      return;
    }

    this.smtpConfig = { host, port: port || 587, user };

    try {
      const isSecure = port === 465;
      
      this.transporter = nodemailer.createTransport({
        host,
        port: port || 587,
        secure: isSecure,
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 30000,
        socketTimeout: 30000,
      });
      
      this.logger.log(`Email transporter initialized (secure: ${isSecure}, port: ${port || 587})`);
    } catch (error: any) {
      this.logger.error(`Failed to initialize email transporter: ${error.message}`);
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    if (!this.transporter) {
      return { 
        success: false, 
        message: 'Transporter not configured. Check SMTP settings in .env',
        details: this.smtpConfig
      };
    }

    try {
      await this.transporter.verify();
      return { 
        success: true, 
        message: 'SMTP connection successful',
        details: this.smtpConfig
      };
    } catch (error: any) {
      const errorDetails = {
        code: error.code,
        message: error.message,
        command: error.command,
        smtpConfig: this.smtpConfig
      };
      this.logger.error(`SMTP test failed: ${JSON.stringify(errorDetails)}`);
      return { 
        success: false, 
        message: `Connection failed: ${error.message} (code: ${error.code})`,
        details: errorDetails
      };
    }
  }

  async sendPaymentReminder(
    to: string,
    tenantName: string,
    houseTitle: string,
    reminderDay: number,
    dueDay: number,
    rent?: number,
    balance?: number,
    landlordPhone?: string,
  ) {
    if (!this.transporter) {
      const msg = 'Email service is not configured. Please check SMTP settings in .env file.';
      this.logger.error(msg);
      throw new InternalServerErrorException(msg);
    }

    const fromEmail = this.configService.get<string>('SMTP_FROM') || 
                      this.configService.get<string>('SMTP_USER');

    const hasDebt = balance && balance > 0;
    const hasSurplus = balance && balance < 0;
    const displayRent = rent || 0;
    const displayBalance = balance || 0;
    const totalAmount = displayRent + (hasDebt ? displayBalance : 0);

    const { subject, html } = this.templateService.render('payment-reminder', {
      tenantName,
      houseTitle,
      reminderDay,
      dueDay,
      rent: displayRent,
      balance: displayBalance,
      hasDebt,
      hasSurplus,
      totalAmount,
      landlordPhone,
    });

    const mailOptions = {
      from: fromEmail,
      to,
      subject,
      html,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      throw new InternalServerErrorException(`发送邮件失败: ${error.message}`);
    }
  }
}