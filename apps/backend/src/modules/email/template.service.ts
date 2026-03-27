import { Injectable, Logger } from '@nestjs/common';
import * as ejs from 'ejs';
import * as fs from 'fs';
import * as path from 'path';

interface EmailTemplate {
  subject?: string;
  title?: string;
  icon?: string;
  headerColor?: string;
  headerColorDark?: string;
}

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);
  private readonly templatesDir = path.join(__dirname, '../../templates/emails');
  private readonly templatesConfig: Record<string, EmailTemplate>;

  constructor() {
    this.templatesConfig = this.loadTemplatesConfig();
    this.logger.log(`Templates loaded from: ${this.templatesDir}`);
  }

  private loadTemplatesConfig(): Record<string, EmailTemplate> {
    const configPath = path.join(this.templatesDir, 'templates.json');
    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      this.logger.warn('Templates config not found, using defaults');
      return {};
    }
  }

  private loadTemplate(name: string): string {
    const templatePath = path.join(this.templatesDir, `${name}.html`);
    try {
      return fs.readFileSync(templatePath, 'utf-8');
    } catch (error) {
      this.logger.error(`Template ${name} not found`);
      throw new Error(`Template ${name} not found`);
    }
  }

  render(templateName: string, data: Record<string, any>): { subject: string; html: string } {
    const config = this.templatesConfig[templateName] || {};
    const contentTemplate = this.loadTemplate(templateName);
    const layoutTemplate = this.loadTemplate('layout');

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const templateData = {
      ...data,
      monthName: `${currentYear}年${currentMonth}月`,
      sentAt: `${currentYear}年${currentMonth}月${now.getDate()}日 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    };

    const subject = config.subject 
      ? ejs.render(config.subject, templateData)
      : templateName;

    const body = ejs.render(contentTemplate, templateData);

    const layoutData: Record<string, any> = {
      ...templateData,
      subject,
      title: config.title || templateName,
      subtitle: data.subtitle || `${templateData.monthName} 房租缴费通知`,
      icon: config.icon || '📧',
      headerColor: config.headerColor || '#059669',
      headerColorDark: config.headerColorDark || '#047857',
      body,
    };

    const html = ejs.render(layoutTemplate, layoutData);

    return { subject, html };
  }
}