import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private smtpConfig: { host: string; port: number; user: string } | null = null;

  constructor(private configService: ConfigService) {
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
  ) {
    if (!this.transporter) {
      const msg = 'Email service is not configured. Please check SMTP settings in .env file.';
      this.logger.error(msg);
      throw new InternalServerErrorException(msg);
    }

    const fromEmail = this.configService.get<string>('SMTP_FROM') || 
                      this.configService.get<string>('SMTP_USER');

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const mailOptions = {
      from: fromEmail,
      to,
      subject: `【缴费提醒】${tenantName} 您好，您的房租即将到期`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">缴费提醒</h1>
          </div>
          <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; color: #374151;">尊敬的 <strong>${tenantName}</strong> 您好：</p>
            <p style="font-size: 15px; color: #4b5563; line-height: 1.6;">
              您租住的房屋 <strong>${houseTitle}</strong> 本月缴费提醒已触发。
            </p>
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
              <p style="margin: 0 0 10px 0; color: #059669; font-weight: bold;">📅 缴费时间安排</p>
              <p style="margin: 5px 0; color: #374151;">
                <span style="color: #6b7280;">提醒日期：</span>
                每月 <strong>${reminderDay}</strong> 号
              </p>
              <p style="margin: 5px 0; color: #374151;">
                <span style="color: #6b7280;">逾期日期：</span>
                每月 <strong>${dueDay}</strong> 号
              </p>
            </div>
            <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
              请您在规定时间内完成缴费，如有疑问请联系房东。
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
              此邮件由系统自动发送，请勿回复。<br>
              发送时间：${currentYear}年${currentMonth}月${now.getDate()}日
            </p>
          </div>
        </div>
      `,
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