/**
 * Firebase Cloud Function for handling contribution submissions.
 * This function saves the receipt to Firestore and sends a confirmation email via SendGrid.
 */

// Import Firebase Functions and Admin SDK
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// This allows the function to interact with Firestore and other Firebase services
admin.initializeApp();
const db = admin.firestore();

// Import SendGrid
const sgMail = require('@sendgrid/mail');

// Set the SendGrid API Key from the Firebase environment configuration
// The key is accessed via functions.config().sendgrid.key
const sendGridKey = functions.config().sendgrid?.key;
if (!sendGridKey) {
    functions.logger.error("SendGrid API key not configured. Deployment will fail to send emails.");
} else {
    sgMail.setApiKey(sendGridKey);
}


/**
 * HTTPS Callable Function to handle receipt submission.
 * This is the public endpoint called by the contribution.html page.
 */
exports.submitReceipt = functions.https.onRequest(async (req, res) => {
    // 1. CORS Setup (Essential for GitHub Pages to talk to Cloud Functions)
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        // Stop preflight requests here
        res.status(204).send('');
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).send({ message: 'Method Not Allowed. Use POST.' });
    }

    // 2. Input Validation
    const { name, email, amount, txnId } = req.body;

    if (!name || !email || !amount || !txnId) {
        functions.logger.warn('Missing fields in request:', req.body);
        return res.status(400).json({ message: 'Missing required fields: name, email, amount, or UTR/Transaction ID (txnId).' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ message: 'Invalid contribution amount.' });
    }

    // Use a fixed App ID and User ID for the Firestore path (since this is a simple receipt system)
    const appId = 'pragyan-ai-receipt-system'; 

    // 3. UTR Duplicate Check (Public collection for global uniqueness)
    const uniqueTxnRef = db.collection(`artifacts/${appId}/public/data/all_receipts`);
    try {
        const qSnapshot = await uniqueTxnRef.where('txnId', '==', txnId.trim()).get();
        if (!qSnapshot.empty) {
            functions.logger.warn(`Duplicate UTR submission detected: ${txnId}`);
            return res.status(409).json({ message: `Error: The Transaction ID ${txnId} has already been submitted. Please double-check the ID.` });
        }
    } catch (error) {
        functions.logger.error('Firestore UTR Check Error:', error);
        // Continue submission, but log the error (don't stop process on check failure)
    }

    // 4. Save Receipt to Firestore
    const receiptData = {
        name: name,
        email: email,
        amount: parsedAmount.toFixed(2),
        txnId: txnId.trim(),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'Pending Verification', // Initial status
    };

    try {
        // Save to the admin-review collection
        const adminCollectionRef = db.collection(`artifacts/${appId}/public/data/receipts_for_review`);
        await adminCollectionRef.add(receiptData);
        functions.logger.info('Receipt saved to Firestore successfully.', { txnId, email });
    } catch (error) {
        functions.logger.error('Firestore Save Error:', error);
        return res.status(500).json({ message: 'Database error occurred. Receipt not saved.' });
    }

    // 5. Save UTR to the unique list (after successful receipt save)
    try {
        await uniqueTxnRef.add({ txnId: txnId.trim(), timestamp: admin.firestore.FieldValue.serverTimestamp() });
    } catch (error) {
        functions.logger.error('Failed to save UTR to unique list:', error);
        // Non-critical, but logged.
    }


    // 6. Send Confirmation Email via SendGrid
    if (!sendGridKey) {
        functions.logger.warn("SendGrid key is missing, skipping email.");
        return res.status(200).json({ message: 'Submission successful, but email skipped due to missing API key.' });
    }

    const emailTemplate = `
        <p style="font-family: Arial, sans-serif; color: #333;">Dear ${name},</p>
        <p style="font-family: Arial, sans-serif; color: #333;">Thank you for your generous contribution of <strong>₹${parsedAmount.toFixed(2)}</strong> to the Pragyan AI open-source project.</p>
        <p style="font-family: Arial, sans-serif; color: #333;">We have received your receipt submission details:</p>
        <ul style="font-family: Arial, sans-serif; color: #333; list-style-type: none; padding-left: 0;">
            <li><strong>Amount:</strong> ₹${parsedAmount.toFixed(2)}</li>
            <li><strong>Transaction ID (UTR):</strong> ${txnId}</li>
            <li><strong>Submission Time:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        <p style="font-family: Arial, sans-serif; color: #d9534f; font-weight: bold;">Your contribution is currently being verified. We will send a final, confirmed receipt to this email address within 24-48 hours.</p>
        <p style="font-family: Arial, sans-serif; color: #5cb85c; margin-top: 20px;">Your support directly fuels our mission to build India's next-generation open-source AI model.</p>
        <p style="font-family: Arial, sans-serif; color: #333;">Best regards,<br>The Pragyan AI Team</p>
    `;

    const msg = {
        to: email,
        from: 'no-reply@pragyan-ai.org', // Use a verified sender email in SendGrid
        subject: `Pragyan AI Contribution Received - Txn ID ${txnId}`,
        html: emailTemplate,
    };

    try {
        await sgMail.send(msg);
        functions.logger.info(`Confirmation email sent to ${email}.`);
        return res.status(200).json({ message: 'Submission successful! Your confirmed receipt will be emailed after verification.' });
    } catch (error) {
        functions.logger.error('SendGrid Email Error:', error.response?.body || error);
        return res.status(200).json({ message: 'Submission successful, but email failed to send. We saved your details and will contact you.' });
    }
});
