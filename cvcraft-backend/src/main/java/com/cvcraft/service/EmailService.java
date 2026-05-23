package com.cvcraft.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String from;

    @Value("${app.mail.base-url}")
    private String baseUrl;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Async
    public void sendPasswordResetEmail(String toEmail, String token) {
        String resetLink = baseUrl + "/auth/reset-password?token=" + token;

        // Dev mode: log to console when no mail password is configured
        if (mailPassword == null || mailPassword.isBlank()) {
            log.warn("=== [DEV] Password reset link for {} ===", toEmail);
            log.warn("=== LINK: {} ===", resetLink);
            return;
        }

        String subject = "CVCraft – Reset your password";
        String body = """
            <html><body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 24px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">CVCraft</h1>
              </div>
              <div style="background: #fff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                <h2 style="color: #111827; margin-top: 0;">Reset your password</h2>
                <p>We received a request to reset your CVCraft account password. Click the button below to set a new password.</p>
                <p>This link will expire in <strong>60 minutes</strong>.</p>
                <a href="%s" style="display: inline-block; background: #2563eb; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">Reset Password</a>
                <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
                <p style="color: #6b7280; font-size: 13px;">Or copy this link: <a href="%s" style="color: #2563eb;">%s</a></p>
              </div>
            </body></html>
            """.formatted(resetLink, resetLink, resetLink);

        sendHtmlEmail(toEmail, subject, body);
    }

    @Async
    public void sendVerificationOtpEmail(String toEmail, String otpCode) {
        if (mailPassword == null || mailPassword.isBlank()) {
            log.warn("=== [DEV] Email verification OTP for {} ===", toEmail);
            log.warn("=== OTP CODE: {} ===", otpCode);
            return;
        }

        String subject = "CVCraft – Verify your email (" + otpCode + ")";
        String body = """
            <html><body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 24px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">CVCraft</h1>
              </div>
              <div style="background: #fff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                <h2 style="color: #111827; margin-top: 0;">Verify your email address</h2>
                <p>Enter the code below to verify your CVCraft account:</p>
                <div style="background: #f3f4f6; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                  <span style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #2563eb;">%s</span>
                </div>
                <p style="color: #6b7280; font-size: 13px;">This code expires in <strong>10 minutes</strong>.</p>
                <p style="color: #6b7280; font-size: 13px;">If you didn't create a CVCraft account, ignore this email.</p>
              </div>
            </body></html>
            """.formatted(otpCode);

        sendHtmlEmail(toEmail, subject, body);
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            var message = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from, "CVCraft");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
