import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

import OTPEmail from '../emails/otp';
import * as React from 'react';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private resend: Resend;
  constructor(private configService: ConfigService) {
    this.resend = new Resend(this.configService.get('RESEND_API_KEY'));
  }
  async sendOTP(payload: { email: string; otp: string }) {
    // const otpTemplate = fs.readFileSync(path.resolve("src/shared/email-templates/otp.html"), { encoding: "utf-8" })
    return await this.resend.emails.send({
      from: 'HomeCare360 <no-reply@homecare360.space>',
      to: [payload.email],
      subject: 'OTP',
      react: <OTPEmail otpCode={payload.otp} title="Your OTP" />,
      // html: otpTemplate.replaceAll('{{subject}}', "Your OTP").replaceAll("{{code}}", payload.otp),
    });
  }
}
