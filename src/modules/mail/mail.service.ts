import { ConfigService } from '@nestjs/config';
import { PasswordChangedEvent } from '../../events/password-changed.event';
import { ForgotPasswordEvent } from '../../events/forgot-password.event';
import { UserCreatedEvent } from '../../events/user-created.event';
import { Injectable, Logger } from '@nestjs/common';
import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { OnEvent } from '@nestjs/event-emitter';
import { Event } from '../../events/events.enum';
import { Config } from '../../config/configuration.interface';

@Injectable()
export class MailService {
  private readonly baseDomain: string;
  private readonly logger: Logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService<Config>,
  ) {
    this.baseDomain = this.configService.get<string>('domain');
  }

  /**
   * Sends an email
   * @param options the email options
   */
  private sendEmail(options: ISendMailOptions): void {
    this.mailerService.sendMail(options).catch((err) => {
      this.logger.error({
        message: `Error sending a ${options.template} email to user ${options.to}`,
        err,
      });
    });
  }

  /**
   * Sends an account verification email to the user
   * @param payload the user.created event payload
   */
  private sendAccountVerificationEmail(payload: UserCreatedEvent): void {
    this.sendEmail({
      to: payload.user.email,
      subject: 'Verify Your AgoraCloud Account',
      template: './verify-account',
      context: {
        fullName: payload.user.fullName,
        link: `${this.baseDomain}/verify-account?token=${payload.token}`,
      },
    });
  }

  /**
   * Sends a forgot password email to the user
   * @param payload the user.forgotPassword event payload
   */
  private sendForgotPasswordEmail(payload: ForgotPasswordEvent): void {
    this.sendEmail({
      to: payload.user.email,
      subject: 'Change Your AgoraCloud Account Password',
      template: './forgot-password',
      context: {
        fullName: payload.user.fullName,
        link: `${this.baseDomain}/change-password?token=${payload.token}`,
      },
    });
  }

  /**
   * Sends a password changed email to the user
   * @param payload the user.passwordChanged event payload
   */
  private sendPasswordChangedEmail(payload: PasswordChangedEvent): void {
    this.sendEmail({
      to: payload.user.email,
      subject: 'AgoraCloud Account Password Changed',
      template: './password-changed',
      context: {
        fullName: payload.user.fullName,
        link: `${this.baseDomain}/sign-in`,
      },
    });
  }

  /**
   * Handles the user.created event
   * @param payload the user.created event payload
   */
  @OnEvent(Event.UserCreated)
  private handleUserCreatedEvent(payload: UserCreatedEvent): void {
    if (!payload.user.isVerified) this.sendAccountVerificationEmail(payload);
  }

  /**
   * Handles the user.forgotPassword event
   * @param payload the user.forgotPassword event payload
   */
  @OnEvent(Event.ForgotPassword)
  private handleForgotPasswordEvent(payload: ForgotPasswordEvent): void {
    this.sendForgotPasswordEmail(payload);
  }

  /**
   * Handles the user.passwordChanged event
   * @param payload the user.passwordChanged event payload
   */
  @OnEvent(Event.PasswordChanged)
  private handlePasswordChangedEvent(payload: PasswordChangedEvent): void {
    this.sendPasswordChangedEmail(payload);
  }
}
