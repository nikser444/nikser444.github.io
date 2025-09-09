// backend/src/services/EmailService.ts
import nodemailer from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  static async init(): Promise<void> {
    if (this.transporter) return;

    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    };

    this.transporter = nodemailer.createTransporter(config);

    // Проверяем подключение
    try {
      await this.transporter.verify();
      console.log('✅ Email service подключен успешно');
    } catch (error) {
      console.error('❌ Ошибка подключения к email service:', error);
      throw error;
    }
  }

  static async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.transporter) {
      await this.init();
    }

    if (!this.transporter) {
      throw new Error('Email transporter не инициализирован');
    }

    const mailOptions = {
      from: `"${process.env.APP_NAME || 'Мессенджер'}" <${process.env.SMTP_USER}>`,
      ...options,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('📧 Email отправлен:', info.messageId);
    } catch (error) {
      console.error('❌ Ошибка отправки email:', error);
      throw error;
    }
  }

  static async sendWelcomeEmail(email: string, username: string): Promise<void> {
    const subject = 'Добро пожаловать в наш мессенджер!';
    const html = this.getWelcomeEmailTemplate(username);

    await this.sendEmail({
      to: email,
      subject,
      html,
      text: `Привет ${username}! Добро пожаловать в наш мессенджер!`,
    });
  }

  static async sendPasswordResetEmail(email: string, tempPassword: string): Promise<void> {
    const subject = 'Восстановление пароля';
    const html = this.getPasswordResetEmailTemplate(tempPassword);

    await this.sendEmail({
      to: email,
      subject,
      html,
      text: `Ваш временный пароль: ${tempPassword}`,
    });
  }

  static async sendEmailVerification(email: string, verificationLink: string): Promise<void> {
    const subject = 'Подтверждение email адреса';
    const html = this.getEmailVerificationTemplate(verificationLink);

    await this.sendEmail({
      to: email,
      subject,
      html,
      text: `Перейдите по ссылке для подтверждения email: ${verificationLink}`,
    });
  }

  static async sendLoginNotification(email: string, userAgent: string, ip: string): Promise<void> {
    const subject = 'Новый вход в аккаунт';
    const html = this.getLoginNotificationTemplate(userAgent, ip);

    await this.sendEmail({
      to: email,
      subject,
      html,
      text: `Обнаружен новый вход в ваш аккаунт с устройства: ${userAgent}`,
    });
  }

  static async sendFriendRequestEmail(email: string, fromUsername: string): Promise<void> {
    const subject = 'Новая заявка в друзья';
    const html = this.getFriendRequestEmailTemplate(fromUsername);

    await this.sendEmail({
      to: email,
      subject,
      html,
      text: `${fromUsername} отправил вам заявку в друзья!`,
    });
  }

  static async sendGroupInviteEmail(
    email: string, 
    groupName: string, 
    inviterUsername: string
  ): Promise<void> {
    const subject = 'Приглашение в группу';
    const html = this.getGroupInviteEmailTemplate(groupName, inviterUsername);

    await this.sendEmail({
      to: email,
      subject,
      html,
      text: `${inviterUsername} пригласил вас в группу "${groupName}"`,
    });
  }

  // Email шаблоны
  private static getWelcomeEmailTemplate(username: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Добро пожаловать!</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #4f46e5; margin: 0;">Добро пожаловать!</h1>
            </div>
            
            <div style="margin-bottom: 30px;">
              <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                Привет <strong>${username}</strong>! 👋
              </p>
              <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                Спасибо за регистрацию в нашем мессенджере! Теперь вы можете:
              </p>
              
              <ul style="font-size: 16px; line-height: 1.6; color: #374151;">
                <li>💬 Общаться с друзьями в реальном времени</li>
                <li>📞 Совершать аудио и видеозвонки</li>
                <li>👥 Создавать групповые чаты</li>
                <li>📁 Отправлять файлы и изображения</li>
                <li>🖥️ Делиться экраном</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="font-size: 14px; color: #9ca3af;">
                С уважением,<br>
                Команда мессенджера
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private static getPasswordResetEmailTemplate(tempPassword: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Восстановление пароля</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #ef4444; margin: 0;">🔒 Восстановление пароля</h1>
            </div>
            
            <div style="margin-bottom: 30px;">
              <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                Ваш временный пароль:
              </p>
              
              <div style="background-color: #f9fafb; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <span style="font-family: monospace; font-size: 24px; font-weight: bold; color: #ef4444; letter-spacing: 2px;">
                  ${tempPassword}
                </span>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                ⚠️ <strong>Важно:</strong> Обязательно смените пароль после входа в аккаунт!
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="font-size: 14px; color: #9ca3af;">
                Если вы не запрашивали восстановление пароля, проигнорируйте это письмо.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private static getEmailVerificationTemplate(verificationLink: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Подтверждение email</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #4f46e5; margin: 0;">✉️ Подтвердите email</h1>
            </div>
            
            <div style="margin-bottom: 30px;">
              <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                Пожалуйста, подтвердите ваш email адрес, нажав на кнопку ниже:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}" style="background-color: #4f46e5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                  Подтвердить email
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280;">
                Или скопируйте и вставьте эту ссылку в браузер:<br>
                <span style="word-break: break-all;">${verificationLink}</span>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private static getLoginNotificationTemplate(userAgent: string, ip: string): string {
    const now = new Date().toLocaleString('ru-RU');
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Новый вход в аккаунт</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #f59e0b; margin: 0;">🔐 Новый вход в аккаунт</h1>
            </div>
            
            <div style="margin-bottom: 30px;">
              <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                Обнаружен новый вход в ваш аккаунт:
              </p>
              
              <div style="background-color: #f9fafb; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #374151;">
                  <strong>Время:</strong> ${now}<br>
                  <strong>IP адрес:</strong> ${ip}<br>
                  <strong>Устройство:</strong> ${userAgent}
                </p>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                Если это были не вы, немедленно смените пароль!
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private static getFriendRequestEmailTemplate(fromUsername: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Новая заявка в друзья</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #10b981; margin: 0;">👥 Новая заявка в друзья</h1>
            </div>
            
            <div style="margin-bottom: 30px;">
              <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                <strong>${fromUsername}</strong> отправил вам заявку в друзья! 🎉
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                Войдите в приложение, чтобы принять или отклонить заявку.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private static getGroupInviteEmailTemplate(groupName: string, inviterUsername: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Приглашение в группу</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #8b5cf6; margin: 0;">🎊 Приглашение в группу</h1>
            </div>
            
            <div style="margin-bottom: 30px;">
              <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                <strong>${inviterUsername}</strong> пригласил вас в группу 
                "<strong>${groupName}</strong>"! 
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                Войдите в приложение, чтобы присоединиться к обсуждению.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}