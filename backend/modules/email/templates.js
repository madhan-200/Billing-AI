/**
 * Email Templates for Invoice Delivery and Reminders
 * Professional HTML email templates
 */

export const invoiceEmailTemplate = (customerName, invoiceNumber, totalAmount, dueDate, pdfUrl) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoiceNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Invoice Received</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Dear ${customerName},
                            </p>
                            
                            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Thank you for your continued business. Please find your invoice details below:
                            </p>
                            
                            <!-- Invoice Details Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; margin: 30px 0;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <table width="100%" cellpadding="8" cellspacing="0">
                                            <tr>
                                                <td style="color: #6b7280; font-size: 14px;">Invoice Number:</td>
                                                <td style="color: #111827; font-size: 14px; font-weight: bold; text-align: right;">${invoiceNumber}</td>
                                            </tr>
                                            <tr>
                                                <td style="color: #6b7280; font-size: 14px;">Total Amount:</td>
                                                <td style="color: #2563eb; font-size: 18px; font-weight: bold; text-align: right;">$${parseFloat(totalAmount).toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <td style="color: #6b7280; font-size: 14px;">Due Date:</td>
                                                <td style="color: #111827; font-size: 14px; font-weight: bold; text-align: right;">${new Date(dueDate).toLocaleDateString()}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Download Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${pdfUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                                            Download Invoice PDF
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                                If you have any questions about this invoice, please don't hesitate to contact us.
                            </p>
                            
                            <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                                Best regards,<br>
                                <strong>BillerAGI Team</strong>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                            <p style="color: #6b7280; font-size: 12px; margin: 0;">
                                This is an automated message from BillerAGI<br>
                                Please do not reply to this email
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
};

export const reminderEmailTemplate = (customerName, invoiceNumber, totalAmount, dueDate, daysOverdue, pdfUrl) => {
    const urgencyColor = daysOverdue > 30 ? '#dc2626' : daysOverdue > 14 ? '#f59e0b' : '#2563eb';
    const urgencyText = daysOverdue > 30 ? 'URGENT' : daysOverdue > 14 ? 'IMPORTANT' : 'REMINDER';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Reminder - Invoice ${invoiceNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: ${urgencyColor}; padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">${urgencyText}: Payment Reminder</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Dear ${customerName},
                            </p>
                            
                            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                This is a friendly reminder that the following invoice is now <strong style="color: ${urgencyColor};">${daysOverdue} days overdue</strong>.
                            </p>
                            
                            <!-- Invoice Details Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; border-left: 4px solid ${urgencyColor}; border-radius: 6px; margin: 30px 0;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <table width="100%" cellpadding="8" cellspacing="0">
                                            <tr>
                                                <td style="color: #6b7280; font-size: 14px;">Invoice Number:</td>
                                                <td style="color: #111827; font-size: 14px; font-weight: bold; text-align: right;">${invoiceNumber}</td>
                                            </tr>
                                            <tr>
                                                <td style="color: #6b7280; font-size: 14px;">Amount Due:</td>
                                                <td style="color: ${urgencyColor}; font-size: 20px; font-weight: bold; text-align: right;">$${parseFloat(totalAmount).toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <td style="color: #6b7280; font-size: 14px;">Original Due Date:</td>
                                                <td style="color: #111827; font-size: 14px; font-weight: bold; text-align: right;">${new Date(dueDate).toLocaleDateString()}</td>
                                            </tr>
                                            <tr>
                                                <td style="color: #6b7280; font-size: 14px;">Days Overdue:</td>
                                                <td style="color: ${urgencyColor}; font-size: 16px; font-weight: bold; text-align: right;">${daysOverdue} days</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Download Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${pdfUrl}" style="display: inline-block; background-color: ${urgencyColor}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                                            View Invoice
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                                Please arrange payment at your earliest convenience. If you have already made this payment, please disregard this reminder.
                            </p>
                            
                            <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                                If you have any questions or concerns, please contact our billing department immediately.
                            </p>
                            
                            <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                                Thank you for your prompt attention to this matter.<br>
                                <strong>BillerAGI Team</strong>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                            <p style="color: #6b7280; font-size: 12px; margin: 0;">
                                This is an automated reminder from BillerAGI<br>
                                Please do not reply to this email
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
};

export const welcomeEmailTemplate = (customerName) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0;">
    <title>Welcome to BillerAGI</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome to BillerAGI!</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                                Dear ${customerName},
                            </p>
                            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                                Thank you for choosing BillerAGI for your billing needs. We're excited to serve you!
                            </p>
                            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                                You will receive automated invoices and billing updates via email. Our AI assistant is also available to answer any questions you may have.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
};
