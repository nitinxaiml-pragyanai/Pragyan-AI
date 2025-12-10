/**
 * Firebase Cloud Function to send email receipts via SendGrid, ONLY after
 * an Admin manually verifies and marks the transaction as 'Confirmed'.
 *
 * SENDER EMAIL: nitinxaiml@gmail.com (MUST be verified in SendGrid)
 * Trigger: Firestore onUpdate when status changes to 'Confirmed'.
 */

const functions = require('firebase-functions');
const sgMail = require('@sendgrid/mail');

// WARNING: Placing keys directly in code is generally insecure.
// This is done based on the user's explicit instruction that the repository is private.
const SENDGRID_API_KEY = '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'; 
sgMail.setApiKey(SENDGRID_API_KEY);

// Use the exact verified sender email address
const SENDER_EMAIL = 'nitinxaiml@gmail.com'; 

exports.sendVerifiedReceiptEmail = functions.firestore
    .document('artifacts/{appId}/users/{userId}/receipts/{receiptId}')
    .onUpdate(async (change, context) => {
        
        const beforeData = change.before.data();
        const afterData = change.after.data();

        // 1. Check if the status has changed TO 'Confirmed'
        const statusBefore = beforeData.status;
        const statusAfter = afterData.status;

        if (statusAfter !== 'Confirmed' || statusBefore === 'Confirmed') {
            functions.logger.info(`Status change not from Pending to Confirmed, or status unchanged. Aborting.`);
            return null;
        }

        // --- Verification Complete: Send Email ---
        
        if (!afterData.email || !afterData.name || !afterData.amount || !afterData.txnId) {
            functions.logger.error("Missing essential data after confirmation. Aborting email send.", afterData);
            return null;
        }

        const receiptData = afterData; // Use the confirmed data

        const msg = {
            to: receiptData.email,
            from: SENDER_EMAIL,
            subject: '✅ Receipt Confirmed: Thank You for Your Contribution to Pragyan AI!',
            text: `Dear ${receiptData.name}, your contribution of ₹${receiptData.amount} (Txn ID: ${receiptData.txnId}) has been manually verified and confirmed. Your support fuels India's open-source AI future!`,
            html: `
                <div style="font-family: 'Outfit', Arial, sans-serif; background-color: #f4f7fa; padding: 20px;">
                    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 0; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                        
                        <!-- Header Block -->
                        <table role="presentation" width="100%" style="border-collapse: collapse;">
                            <tr>
                                <td style="background-color: #0F172A; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; border-top: 5px solid #0EA5E9;">
                                    
                                    <!-- LOGO PLACEMENT: Place your Company/Project Logo URL here -->
                                    <img src="https://placehold.co/40x40/E11D48/ffffff?text=LOGO" alt="Company Logo" style="height: 40px; margin-bottom: 10px; border-radius: 4px;">

                                    <h1 style="color: #0EA5E9; margin: 0; font-size: 28px; font-weight: 700;">Pragyan AI</h1>
                                    <p style="color: #94a3b8; font-size: 14px; margin: 5px 0 0 0;">India's Open Source AI Mission</p>
                                </td>
                            </tr>
                        </table>

                        <!-- Content Block -->
                        <div style="padding: 30px;">
                            <p style="font-size: 18px; color: #1E293B; font-weight: 700; margin-top: 0;">✅ Receipt Confirmed</p>
                            
                            <p style="font-size: 16px; color: #475569; line-height: 1.5;">
                                Dear <strong style="color: #0EA5E9;">${receiptData.name}</strong>,
                            </p>
                            <p style="font-size: 16px; color: #475569; line-height: 1.5;">
                                Your generous contribution has been manually verified and confirmed by our team. Thank you for making an impact on indigenous open-source AI in India!
                            </p>

                            <table role="presentation" width="100%" style="border-collapse: collapse; margin: 20px 0; font-size: 15px;">
                                <tr>
                                    <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee; color: #334155; font-weight: 400;">Expected & Verified Amount:</td>
                                    <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee; text-align: right; font-weight: 700; color: #E11D48; font-size: 20px;">
                                        ₹${receiptData.amount}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee; color: #334155; font-weight: 400;">Transaction ID (UTR):</td>
                                    <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee; text-align: right; font-weight: 500;">
                                        ${receiptData.txnId}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; color: #334155; font-weight: 400;">Email Address:</td>
                                    <td style="padding: 12px 0; text-align: right; font-weight: 500;">
                                        ${receiptData.email}
                                    </td>
                                </tr>
                            </table>

                            <p style="text-align: center; margin-top: 35px;">
                                <a href="https://your-domain.com/receipt/download?txn=${receiptData.txnId}&amount=${receiptData.amount}" style="display: inline-block; padding: 12px 25px; background-color: #E11D48; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; border: 1px solid #E11D48;">
                                    View Contribution Details
                                </a>
                            </p>
                            
                            <p style="text-align: center; margin-top: 30px; font-size: 14px; color: #64748B;">
                                Project by Nitin Raj. Thank you for your support!
                            </p>
                        </div>
                    </div>
                </div>
            `,
        };

        try {
            await sgMail.send(msg);
            functions.logger.log('Verified receipt email successfully sent to', afterData.email);
        } catch (error) {
            functions.logger.error('Error sending verified receipt email:', error.response ? error.response.body : error);
        }

        return null;
    });
