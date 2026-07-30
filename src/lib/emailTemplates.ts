/**
 * Sevikaa Dedicated HTML Email Templates Module
 * Standardized on Sevikaa Emerald Green (#2E7D32 / #1B5E20) Brand Theme
 */

// Common Header Fragment
const getEmailHeader = (subtitle: string = 'Trusted Home Services') => `
        <!-- Header -->
        <tr>
          <td align="center" style="background:linear-gradient(180deg,#2E7D32,#1B5E20);padding:40px 30px;">
            <div style="text-align:center;margin-bottom:18px;">
              <img src="https://www.sevikaa.in/logo.png" alt="Sevikaa Logo" style="height:65px;width:auto;display:block;margin:0 auto;">
            </div>
            <p style="margin:0;color:#E8F5E9;font-size:16px;font-weight:500;letter-spacing:.5px;">
              ${subtitle}
            </p>
          </td>
        </tr>
`;

// Common Footer Fragment
const getEmailFooter = () => `
        <!-- Footer -->
        <tr>
          <td align="center" style="background:#f8f8f8;padding:30px;">
            <div style="margin-bottom:15px;">
              <img src="https://www.sevikaa.in/logo.png" alt="Sevikaa" style="height:42px;width:auto;">
            </div>
            <p style="margin:0;color:#666;font-size:14px;line-height:24px;">
              Trusted Home Services Platform
            </p>
            <p style="margin:8px 0 0;color:#888;font-size:13px;line-height:22px;">
              © 2026 Sevikaa. All Rights Reserved.
            </p>
          </td>
        </tr>
`;

// Common Support Block
const getSupportBlock = () => `
          <hr style="border:none;border-top:1px solid #eeeeee;margin:40px 0;">

          <!-- Support -->
          <p style="margin:0;font-size:15px;line-height:28px;color:#555;text-align:center;">
            Need assistance?
          </p>

          <p style="margin:8px 0 0;text-align:center;">
            <a href="mailto:support@sevikaa.in" style="color:#2E7D32;font-size:16px;font-weight:bold;text-decoration:none;">
              support@sevikaa.in
            </a>
          </p>
`;

/**
 * 1. Confirm Registration Signup Email Template
 */
export function getConfirmSignupEmailHtml(token: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email | Sevikaa</title>
</head>
<body style="margin:0;padding:0;background:#f4f7f9;font-family:Arial,Helvetica,sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f9;padding:40px 15px;">
    <tr>
      <td align="center">

        <!-- Email Card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e8e8e8;">

${getEmailHeader('Trusted Home Services')}

          <!-- Body -->
          <tr>
            <td style="padding:45px 40px;">

              <h2 style="margin:0 0 20px;color:#222;font-size:30px;font-weight:700;">
                Confirm Your Email
              </h2>

              <p style="margin:0 0 18px;font-size:16px;line-height:28px;color:#555;">
                Hello,
              </p>

              <p style="margin:0 0 30px;font-size:16px;line-height:28px;color:#555;">
                Thank you for choosing <strong style="color:#2E7D32;">Sevikaa</strong>. Use the verification code below to complete your registration and secure your account.
              </p>

              <!-- OTP Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:35px 0;">
                <tr>
                  <td align="center">
                    <div style="background:#F1F8E9;border:2px dashed #43A047;border-radius:16px;padding:28px 20px;">
                      <div style="font-size:13px;font-weight:bold;color:#2E7D32;letter-spacing:2px;margin-bottom:12px;">
                        VERIFICATION CODE
                      </div>
                      <div style="font-size:42px;font-weight:700;letter-spacing:10px;color:#1B5E20;font-family:monospace;">
                        ${token}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="font-size:15px;color:#555;line-height:28px;margin:0 0 25px;">
                This verification code is valid for a limited time and can only be used once.
              </p>

              <!-- Security Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8E1;border-left:5px solid #FFC107;border-radius:10px;">
                <tr>
                  <td style="padding:18px;">
                    <p style="margin:0;font-size:15px;line-height:26px;color:#666;">
                      🔒 <strong>Security Tip:</strong> Never share this verification code with anyone. Sevikaa will never ask for your OTP by phone, email, or WhatsApp.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin-top:30px;font-size:15px;line-height:28px;color:#666;">
                If you didn't create a Sevikaa account, you can safely ignore this email. No further action is required.
              </p>

${getSupportBlock()}

            </td>
          </tr>

${getEmailFooter()}

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

/**
 * 2. Security Verification OTP Email Template (Step 1 Verification)
 */
export function getSecurityOtpEmailHtml(otp: string, targetPhoneMasked?: string): string {
  const targetLabel = targetPhoneMasked ? ` to link or update mobile number <strong style="color:#1B5E20;font-family:monospace;">+91 ${targetPhoneMasked}</strong>` : '';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Verification Code | Sevikaa</title>
</head>
<body style="margin:0;padding:0;background:#f4f7f9;font-family:Arial,Helvetica,sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f9;padding:40px 15px;">
    <tr>
      <td align="center">

        <!-- Email Card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e8e8e8;">

${getEmailHeader('Trusted Home Services')}

          <!-- Body -->
          <tr>
            <td style="padding:45px 40px;">

              <h2 style="margin:0 0 20px;color:#222;font-size:30px;font-weight:700;">
                Security Verification Code
              </h2>

              <p style="margin:0 0 18px;font-size:16px;line-height:28px;color:#555;">
                Hello,
              </p>

              <p style="margin:0 0 30px;font-size:16px;line-height:28px;color:#555;">
                A request was made on your <strong style="color:#2E7D32;">Sevikaa</strong> account${targetLabel}. Use the verification code below to verify your identity:
              </p>

              <!-- OTP Display Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:35px 0;">
                <tr>
                  <td align="center">
                    <div style="background:#F1F8E9;border:2px dashed #43A047;border-radius:16px;padding:28px 20px;">
                      <div style="font-size:13px;font-weight:bold;color:#2E7D32;letter-spacing:2px;margin-bottom:12px;">
                        VERIFICATION CODE
                      </div>
                      <div style="font-size:42px;font-weight:700;letter-spacing:10px;color:#1B5E20;font-family:monospace;">
                        ${otp}
                      </div>
                      <p style="margin:12px 0 0;font-size:14px;color:#555;font-weight:500;">
                        ⏱️ Valid for 10 minutes. Do not share this code with anyone.
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8E1;border-left:5px solid #FFC107;border-radius:10px;">
                <tr>
                  <td style="padding:18px;">
                    <p style="margin:0;font-size:15px;line-height:26px;color:#666;">
                      🔒 <strong>Security Tip:</strong> Never share this verification code with anyone. Sevikaa will never ask for your OTP by phone, email, or WhatsApp.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin-top:30px;font-size:15px;line-height:28px;color:#666;">
                If you didn't initiate this change, you can safely ignore this email or contact our support team immediately.
              </p>

${getSupportBlock()}

            </td>
          </tr>

${getEmailFooter()}

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

/**
 * 3. Final Phone Number Changed / Linked Confirmation Email Template
 */
export function getPhoneChangedConfirmationEmailHtml(oldPhone?: string, newPhone?: string): string {
  const isFirstTimeLink = !oldPhone || oldPhone.includes('EMAIL') || oldPhone === 'None';
  const titleText = isFirstTimeLink ? 'Phone Number Linked' : 'Phone Number Updated';
  const descriptionText = isFirstTimeLink 
    ? 'This is a confirmation that a primary mobile number has been successfully linked to your <strong style="color:#2E7D32;">Sevikaa</strong> account.'
    : 'This is a confirmation that the phone number associated with your <strong style="color:#2E7D32;">Sevikaa</strong> account has been successfully updated.';

  const oldPhoneBlock = isFirstTimeLink ? '' : `
              <p style="margin:0;font-size:15px;color:#555;">
                <strong>Previous Phone Number</strong>
              </p>
              <p style="margin:8px 0 20px;font-size:17px;font-weight:bold;color:#666;">
                ${oldPhone.startsWith('+91') ? oldPhone : `+91 ${oldPhone}`}
              </p>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titleText} | Sevikaa</title>
</head>
<body style="margin:0;padding:0;background:#f4f7f9;font-family:Arial,Helvetica,sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f9;padding:40px 15px;">
    <tr>
      <td align="center">

        <!-- Email Card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e8e8e8;">

${getEmailHeader('Trusted Home Services')}

          <!-- Body -->
          <tr>
            <td style="padding:45px 40px;">

              <h2 style="margin:0 0 20px;color:#222;font-size:30px;font-weight:700;">
                ${titleText}
              </h2>

              <p style="margin:0 0 18px;font-size:16px;line-height:28px;color:#555;">
                Hello,
              </p>

              <p style="margin:0 0 30px;font-size:16px;line-height:28px;color:#555;">
                ${descriptionText}
              </p>

              <!-- Phone Details Box -->
              <div style="background:#E8F5E9;border-left:5px solid #43A047;padding:20px;border-radius:10px;margin:30px 0;">
${oldPhoneBlock}
                <p style="margin:0;font-size:15px;color:#555;">
                  <strong>New Phone Number</strong>
                </p>
                <p style="margin:8px 0 0;font-size:17px;font-weight:bold;color:#2E7D32;">
                  ${newPhone ? (newPhone.startsWith('+91') ? newPhone : `+91 ${newPhone}`) : 'Updated'}
                </p>
              </div>

              <!-- Security Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8E1;border-left:5px solid #FFC107;border-radius:10px;">
                <tr>
                  <td style="padding:18px;">
                    <p style="margin:0;font-size:15px;line-height:26px;color:#666;">
                      🔒 <strong>Didn't make this change?</strong><br><br>
                      If you didn't update your phone number, please contact the Sevikaa Support Team immediately at <a href="mailto:support@sevikaa.in" style="color:#2E7D32;font-weight:bold;">support@sevikaa.in</a> to secure your account.
                    </p>
                  </td>
                </tr>
              </table>

${getSupportBlock()}

            </td>
          </tr>

${getEmailFooter()}

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

/**
 * 4. Final Email Address Changed Confirmation Email Template
 */
export function getEmailChangedConfirmationEmailHtml(oldEmail?: string, newEmail?: string): string {
  const isFirstTimeLink = !oldEmail || oldEmail === 'None';
  const titleText = isFirstTimeLink ? 'Email Address Linked' : 'Email Address Updated';
  const descriptionText = isFirstTimeLink 
    ? 'This is a confirmation that a primary email address has been successfully linked to your <strong style="color:#2E7D32;">Sevikaa</strong> account.'
    : 'This is a confirmation that the email address associated with your <strong style="color:#2E7D32;">Sevikaa</strong> account has been successfully updated.';

  const oldEmailBlock = isFirstTimeLink ? '' : `
              <p style="margin:0;font-size:15px;color:#555;">
                <strong>Previous Email Address</strong>
              </p>
              <p style="margin:8px 0 20px;font-size:17px;font-weight:bold;color:#666;">
                ${oldEmail}
              </p>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titleText} | Sevikaa</title>
</head>
<body style="margin:0;padding:0;background:#f4f7f9;font-family:Arial,Helvetica,sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f9;padding:40px 15px;">
    <tr>
      <td align="center">

        <!-- Email Card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e8e8e8;">

${getEmailHeader('Trusted Home Services')}

          <!-- Body -->
          <tr>
            <td style="padding:45px 40px;">

              <h2 style="margin:0 0 20px;color:#222;font-size:30px;font-weight:700;">
                ${titleText}
              </h2>

              <p style="margin:0 0 18px;font-size:16px;line-height:28px;color:#555;">
                Hello,
              </p>

              <p style="margin:0 0 30px;font-size:16px;line-height:28px;color:#555;">
                ${descriptionText}
              </p>

              <!-- Email Details Box -->
              <div style="background:#E8F5E9;border-left:5px solid #43A047;padding:20px;border-radius:10px;margin:30px 0;">
${oldEmailBlock}
                <p style="margin:0;font-size:15px;color:#555;">
                  <strong>New Primary Email Address</strong>
                </p>
                <p style="margin:8px 0 0;font-size:17px;font-weight:bold;color:#2E7D32;">
                  ${newEmail || 'Updated'}
                </p>
              </div>

              <!-- Security Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8E1;border-left:5px solid #FFC107;border-radius:10px;">
                <tr>
                  <td style="padding:18px;">
                    <p style="margin:0;font-size:15px;color:#666;line-height:26px;">
                      🔒 <strong>Didn't make this change?</strong><br><br>
                      If you didn't update your email address, please contact the Sevikaa Support Team immediately at <a href="mailto:support@sevikaa.in" style="color:#2E7D32;font-weight:bold;">support@sevikaa.in</a> to secure your account.
                    </p>
                  </td>
                </tr>
              </table>

${getSupportBlock()}

            </td>
          </tr>

${getEmailFooter()}

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

/**
 * 5. Magic Link or Login OTP Email Template (Passwordless Email Sign In)
 */
export function getMagicLinkOrLoginOtpEmailHtml(tokenOrLink: string, isMagicLink: boolean = false): string {
  const contentBlock = isMagicLink ? `
              <p style="margin:0 0 30px;font-size:16px;line-height:28px;color:#555;">
                Click the button below to log in to your <strong style="color:#2E7D32;">Sevikaa</strong> account instantly:
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:35px 0;">
                <tr>
                  <td align="center">
                    <a href="${tokenOrLink}" target="_blank" style="background:#2E7D32;color:#ffffff;font-size:16px;font-weight:bold;padding:16px 36px;border-radius:12px;text-decoration:none;display:inline-block;box-shadow:0 4px 12px rgba(46,125,50,0.25);">
                      Log In to Sevikaa
                    </a>
                  </td>
                </tr>
              </table>
  ` : `
              <p style="margin:0 0 30px;font-size:16px;line-height:28px;color:#555;">
                Use the 6-digit sign-in code below to log in to your <strong style="color:#2E7D32;">Sevikaa</strong> account:
              </p>

              <!-- OTP Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:35px 0;">
                <tr>
                  <td align="center">
                    <div style="background:#F1F8E9;border:2px dashed #43A047;border-radius:16px;padding:28px 20px;">
                      <div style="font-size:13px;font-weight:bold;color:#2E7D32;letter-spacing:2px;margin-bottom:12px;">
                        LOG IN VERIFICATION CODE
                      </div>
                      <div style="font-size:42px;font-weight:700;letter-spacing:10px;color:#1B5E20;font-family:monospace;">
                        ${tokenOrLink}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Log In to Sevikaa</title>
</head>
<body style="margin:0;padding:0;background:#f4f7f9;font-family:Arial,Helvetica,sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f9;padding:40px 15px;">
    <tr>
      <td align="center">

        <!-- Email Card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e8e8e8;">

${getEmailHeader('Trusted Home Services')}

          <!-- Body -->
          <tr>
            <td style="padding:45px 40px;">

              <h2 style="margin:0 0 20px;color:#222;font-size:30px;font-weight:700;">
                Log In to Your Account
              </h2>

              <p style="margin:0 0 18px;font-size:16px;line-height:28px;color:#555;">
                Hello,
              </p>

${contentBlock}

              <p style="font-size:15px;color:#555;line-height:28px;margin:0 0 25px;">
                This sign-in verification code is valid for 10 minutes and can only be used once.
              </p>

              <!-- Security Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8E1;border-left:5px solid #FFC107;border-radius:10px;">
                <tr>
                  <td style="padding:18px;">
                    <p style="margin:0;font-size:15px;line-height:26px;color:#666;">
                      🔒 <strong>Security Tip:</strong> Never share your sign-in code or login link with anyone. If you didn't request this login, please ignore this email.
                    </p>
                  </td>
                </tr>
              </table>

${getSupportBlock()}

            </td>
          </tr>

${getEmailFooter()}

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

/**
 * 6. Reset Password Email Template
 */
export function getResetPasswordEmailHtml(tokenOrLink: string, isLink: boolean = true): string {
  const actionBlock = isLink ? `
              <p style="margin:0 0 30px;font-size:16px;line-height:28px;color:#555;">
                We received a request to reset your password for your <strong style="color:#2E7D32;">Sevikaa</strong> account. Click the button below to set a new password:
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:35px 0;">
                <tr>
                  <td align="center">
                    <a href="${tokenOrLink}" target="_blank" style="background:#2E7D32;color:#ffffff;font-size:16px;font-weight:bold;padding:16px 36px;border-radius:12px;text-decoration:none;display:inline-block;box-shadow:0 4px 12px rgba(46,125,50,0.25);">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
  ` : `
              <p style="margin:0 0 30px;font-size:16px;line-height:28px;color:#555;">
                We received a request to reset your password for your <strong style="color:#2E7D32;">Sevikaa</strong> account. Use the code below to reset your password:
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:35px 0;">
                <tr>
                  <td align="center">
                    <div style="background:#F1F8E9;border:2px dashed #43A047;border-radius:16px;padding:28px 20px;">
                      <div style="font-size:13px;font-weight:bold;color:#2E7D32;letter-spacing:2px;margin-bottom:12px;">
                        PASSWORD RESET CODE
                      </div>
                      <div style="font-size:42px;font-weight:700;letter-spacing:10px;color:#1B5E20;font-family:monospace;">
                        ${tokenOrLink}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password | Sevikaa</title>
</head>
<body style="margin:0;padding:0;background:#f4f7f9;font-family:Arial,Helvetica,sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f9;padding:40px 15px;">
    <tr>
      <td align="center">

        <!-- Email Card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e8e8e8;">

${getEmailHeader('Trusted Home Services')}

          <!-- Body -->
          <tr>
            <td style="padding:45px 40px;">

              <h2 style="margin:0 0 20px;color:#222;font-size:30px;font-weight:700;">
                Reset Your Password
              </h2>

              <p style="margin:0 0 18px;font-size:16px;line-height:28px;color:#555;">
                Hello,
              </p>

${actionBlock}

              <!-- Security Warning Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8E1;border-left:5px solid #FFC107;border-radius:10px;">
                <tr>
                  <td style="padding:18px;">
                    <p style="margin:0;font-size:15px;color:#666;line-height:26px;">
                      🔒 <strong>Security Warning:</strong> If you did not request a password reset, your account is still secure. No changes have been made to your account.
                    </p>
                  </td>
                </tr>
              </table>

${getSupportBlock()}

            </td>
          </tr>

${getEmailFooter()}

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

/**
 * 7. Job Posted Confirmation Email Template (Employer)
 */
export function getJobPostedEmailHtml(data: {
  employerName?: string;
  jobTitle: string;
  category: string;
  salary: string;
  societyName?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Job Posted Successfully | Sevikaa</title>
</head>
<body style="margin:0;padding:0;background:#f4f7f9;font-family:Arial,Helvetica,sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f9;padding:40px 15px;">
    <tr>
      <td align="center">

        <!-- Email Card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e8e8e8;">

${getEmailHeader('Trusted Home Services')}

          <!-- Body -->
          <tr>
            <td style="padding:45px 40px;">

              <h2 style="margin:0 0 20px;color:#222;font-size:30px;font-weight:700;">
                Job Requisition Submitted
              </h2>

              <p style="margin:0 0 18px;font-size:16px;line-height:28px;color:#555;">
                Hello ${data.employerName || 'Employer'},
              </p>

              <p style="margin:0 0 30px;font-size:16px;line-height:28px;color:#555;">
                Your new job requirement for <strong style="color:#2E7D32;">${data.jobTitle}</strong> has been successfully submitted and is under Admin verification before going live.
              </p>

              <!-- Job Details Card -->
              <div style="background:#E8F5E9;border-left:5px solid #43A047;padding:20px;border-radius:10px;margin:30px 0;">
                <p style="margin:0;font-size:15px;color:#555;"><strong>Job Category:</strong> ${data.category.toUpperCase()}</p>
                <p style="margin:8px 0;font-size:15px;color:#555;"><strong>Offered Salary:</strong> ₹${data.salary} / month</p>
                <p style="margin:0;font-size:15px;color:#555;"><strong>Location / Society:</strong> ${data.societyName || 'Gated Community'}</p>
              </div>

              <!-- Action Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:35px 0;">
                <tr>
                  <td align="center">
                    <a href="https://www.sevikaa.in/employer/jobs" target="_blank" style="background:#2E7D32;color:#ffffff;font-size:16px;font-weight:bold;padding:16px 36px;border-radius:12px;text-decoration:none;display:inline-block;box-shadow:0 4px 12px rgba(46,125,50,0.25);">
                      Manage My Jobs
                    </a>
                  </td>
                </tr>
              </table>

${getSupportBlock()}

            </td>
          </tr>

${getEmailFooter()}

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

/**
 * 8. New Candidate Application Alert Email Template (Employer)
 */
export function getNewCandidateApplicationEmailHtml(data: {
  employerName?: string;
  workerName: string;
  workerRole: string;
  experience?: string;
  jobTitle: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Candidate Application | Sevikaa</title>
</head>
<body style="margin:0;padding:0;background:#f4f7f9;font-family:Arial,Helvetica,sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f9;padding:40px 15px;">
    <tr>
      <td align="center">

        <!-- Email Card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e8e8e8;">

${getEmailHeader('Trusted Home Services')}

          <!-- Body -->
          <tr>
            <td style="padding:45px 40px;">

              <h2 style="margin:0 0 20px;color:#222;font-size:30px;font-weight:700;">
                New Candidate Applied
              </h2>

              <p style="margin:0 0 18px;font-size:16px;line-height:28px;color:#555;">
                Hello ${data.employerName || 'Employer'},
              </p>

              <p style="margin:0 0 30px;font-size:16px;line-height:28px;color:#555;">
                A verified candidate has just applied for your job opening: <strong style="color:#2E7D32;">${data.jobTitle}</strong>.
              </p>

              <!-- Candidate Card -->
              <div style="background:#E8F5E9;border-left:5px solid #43A047;padding:20px;border-radius:10px;margin:30px 0;">
                <p style="margin:0;font-size:17px;font-weight:bold;color:#1B5E20;">👤 ${data.workerName}</p>
                <p style="margin:6px 0;font-size:15px;color:#555;"><strong>Role:</strong> ${data.workerRole}</p>
                <p style="margin:0;font-size:15px;color:#555;"><strong>Experience:</strong> ${data.experience || '2+ Years in Gated Communities'}</p>
              </div>

              <!-- Action Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:35px 0;">
                <tr>
                  <td align="center">
                    <a href="https://www.sevikaa.in/employer/workers" target="_blank" style="background:#2E7D32;color:#ffffff;font-size:16px;font-weight:bold;padding:16px 36px;border-radius:12px;text-decoration:none;display:inline-block;box-shadow:0 4px 12px rgba(46,125,50,0.25);">
                      Review Candidate Profile
                    </a>
                  </td>
                </tr>
              </table>

${getSupportBlock()}

            </td>
          </tr>

${getEmailFooter()}

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

/**
 * 9. Interview Scheduled Confirmation Email Template (Employer)
 */
export function getInterviewScheduledEmailHtml(data: {
  employerName?: string;
  workerName: string;
  workerRole: string;
  interviewDate: string;
  interviewTime: string;
  location?: string;
  workerPhone?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Scheduled | Sevikaa</title>
</head>
<body style="margin:0;padding:0;background:#f4f7f9;font-family:Arial,Helvetica,sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f9;padding:40px 15px;">
    <tr>
      <td align="center">

        <!-- Email Card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e8e8e8;">

${getEmailHeader('Trusted Home Services')}

          <!-- Body -->
          <tr>
            <td style="padding:45px 40px;">

              <h2 style="margin:0 0 20px;color:#222;font-size:30px;font-weight:700;">
                Interview Scheduled
              </h2>

              <p style="margin:0 0 18px;font-size:16px;line-height:28px;color:#555;">
                Hello ${data.employerName || 'Employer'},
              </p>

              <p style="margin:0 0 30px;font-size:16px;line-height:28px;color:#555;">
                Your interview with <strong style="color:#2E7D32;">${data.workerName}</strong> (${data.workerRole}) has been scheduled successfully.
              </p>

              <!-- Interview Details Card -->
              <div style="background:#E8F5E9;border-left:5px solid #43A047;padding:20px;border-radius:10px;margin:30px 0;">
                <p style="margin:0;font-size:15px;color:#555;"><strong>Candidate:</strong> ${data.workerName}</p>
                <p style="margin:8px 0;font-size:15px;color:#555;"><strong>Date & Time:</strong> 📅 ${data.interviewDate} at ⏰ ${data.interviewTime}</p>
                <p style="margin:0 0 8px;font-size:15px;color:#555;"><strong>Location:</strong> 📍 ${data.location || 'Your Registered Residence'}</p>
                ${data.workerPhone ? `<p style="margin:0;font-size:15px;color:#555;"><strong>Worker Phone:</strong> 📞 +91 ${data.workerPhone}</p>` : ''}
              </div>

              ${getSupportBlock()}

            </td>
          </tr>

${getEmailFooter()}

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

/**
 * 10. Subscription Plan Activated Email Template (Employer)
 */
export function getSubscriptionActivatedEmailHtml(data: {
  employerName?: string;
  planName: string;
  amount: string;
  validityDays?: string;
  expiryDate?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Plan Activated | Sevikaa</title>
</head>
<body style="margin:0;padding:0;background:#f4f7f9;font-family:Arial,Helvetica,sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f9;padding:40px 15px;">
    <tr>
      <td align="center">

        <!-- Email Card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e8e8e8;">

${getEmailHeader('Trusted Home Services')}

          <!-- Body -->
          <tr>
            <td style="padding:45px 40px;">

              <h2 style="margin:0 0 20px;color:#222;font-size:30px;font-weight:700;">
                Subscription Activated 🎉
              </h2>

              <p style="margin:0 0 18px;font-size:16px;line-height:28px;color:#555;">
                Hello ${data.employerName || 'Employer'},
              </p>

              <p style="margin:0 0 30px;font-size:16px;line-height:28px;color:#555;">
                Congratulations! Your <strong style="color:#2E7D32;">${data.planName}</strong> plan has been activated. You now have full access to hiring verified domestic helpers on Sevikaa.
              </p>

              <!-- Subscription Details Box -->
              <div style="background:#E8F5E9;border-left:5px solid #43A047;padding:20px;border-radius:10px;margin:30px 0;">
                <p style="margin:0;font-size:17px;font-weight:bold;color:#1B5E20;">🌟 ${data.planName}</p>
                <p style="margin:8px 0;font-size:15px;color:#555;"><strong>Amount Paid:</strong> ₹${data.amount}</p>
                <p style="margin:0;font-size:15px;color:#555;"><strong>Validity:</strong> ${data.validityDays || '30 Days'} (Expires: ${data.expiryDate || 'Next Month'})</p>
              </div>

              <!-- Action Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:35px 0;">
                <tr>
                  <td align="center">
                    <a href="https://www.sevikaa.in/employer/workers" target="_blank" style="background:#2E7D32;color:#ffffff;font-size:16px;font-weight:bold;padding:16px 36px;border-radius:12px;text-decoration:none;display:inline-block;box-shadow:0 4px 12px rgba(46,125,50,0.25);">
                      Start Hiring Now
                    </a>
                  </td>
                </tr>
              </table>

${getSupportBlock()}

            </td>
          </tr>

${getEmailFooter()}

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

/**
 * 11. Payment Successful & Tax Receipt Email Template (Employer)
 */
export function getPaymentReceiptEmailHtml(data: {
  employerName?: string;
  transactionId: string;
  planName: string;
  amount: string;
  date?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt | Sevikaa</title>
</head>
<body style="margin:0;padding:0;background:#f4f7f9;font-family:Arial,Helvetica,sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f9;padding:40px 15px;">
    <tr>
      <td align="center">

        <!-- Email Card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e8e8e8;">

${getEmailHeader('Trusted Home Services')}

          <!-- Body -->
          <tr>
            <td style="padding:45px 40px;">

              <h2 style="margin:0 0 20px;color:#222;font-size:30px;font-weight:700;">
                Payment Receipt
              </h2>

              <p style="margin:0 0 18px;font-size:16px;line-height:28px;color:#555;">
                Hello ${data.employerName || 'Employer'},
              </p>

              <p style="margin:0 0 30px;font-size:16px;line-height:28px;color:#555;">
                Thank you for your payment. Here is your official payment receipt for your transaction on Sevikaa.
              </p>

              <!-- Receipt Box -->
              <div style="background:#E8F5E9;border-left:5px solid #43A047;padding:20px;border-radius:10px;margin:30px 0;">
                <p style="margin:0;font-size:15px;color:#555;"><strong>Transaction ID:</strong> <span style="font-family:monospace;">${data.transactionId}</span></p>
                <p style="margin:8px 0;font-size:15px;color:#555;"><strong>Item Purchased:</strong> ${data.planName}</p>
                <p style="margin:8px 0;font-size:15px;color:#555;"><strong>Payment Date:</strong> ${data.date || new Date().toLocaleDateString()}</p>
                <p style="margin:0;font-size:18px;font-weight:bold;color:#1B5E20;">Total Paid: ₹${data.amount}</p>
              </div>

${getSupportBlock()}

            </td>
          </tr>

${getEmailFooter()}

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

/**
 * 12. Account Deletion / Data Privacy Notice Email Template (Employer)
 */
export function getAccountDeletionRequestedEmailHtml(data: {
  employerName?: string;
  date?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Closure Notice | Sevikaa</title>
</head>
<body style="margin:0;padding:0;background:#f4f7f9;font-family:Arial,Helvetica,sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f9;padding:40px 15px;">
    <tr>
      <td align="center">

        <!-- Email Card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e8e8e8;">

${getEmailHeader('Trusted Home Services')}

          <!-- Body -->
          <tr>
            <td style="padding:45px 40px;">

              <h2 style="margin:0 0 20px;color:#222;font-size:30px;font-weight:700;">
                Account Deletion Requested
              </h2>

              <p style="margin:0 0 18px;font-size:16px;line-height:28px;color:#555;">
                Hello ${data.employerName || 'Employer'},
              </p>

              <p style="margin:0 0 30px;font-size:16px;line-height:28px;color:#555;">
                We have received your request to delete your Sevikaa account and purge personal profile information.
              </p>

              <div style="background:#FFF8E1;border-left:5px solid #FFC107;padding:20px;border-radius:10px;margin:30px 0;">
                <p style="margin:0;font-size:15px;color:#666;line-height:26px;">
                  ℹ️ <strong>Request Summary:</strong> Submitted on ${data.date || new Date().toLocaleDateString()}. Your data will be removed within 30 days as per data privacy regulations.
                </p>
              </div>

${getSupportBlock()}

            </td>
          </tr>

${getEmailFooter()}

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}
