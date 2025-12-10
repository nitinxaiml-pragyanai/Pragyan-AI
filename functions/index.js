/**
 * Firebase Cloud Function for handling contribution submissions.
 * This function saves the receipt to Firestore and sends a confirmation email via SendGrid.
 */

// Import Firebase Functions and Admin SDK
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// Import SendGrid
const sgMail = require('@sendgrid/mail');

// Set the SendGrid API Key from the Firebase environment configuration
const sendGridKey = functions.config().sendgrid?.key;
if (!sendGridKey) {
    functions.logger.error("SendGrid API key not configured. Email sending will fail.");
} else {
    sgMail.setApiKey(sendGridKey);
}

// Fixed App ID using your project name
const APP_ID = 'pragyanalpha'; 

/**
 * HTTPS Callable Function to handle receipt submission.
 */
exports.submitReceipt = functions.https.onRequest(async (req, res) => {
    // 1. CORS Setup (Essential for GitHub Pages/External Hosting)
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'POST') {
        // Corrected spacing: {message:'...'}
        return res.status(405).send({message:'Method Not Allowed. Use POST.'});
    }

    // 2. Input Validation
    const {name, email, amount, txnId} = req.body;

    if (!name || !email || !amount || !txnId) {
        // Corrected spacing: {message:'...'}
        return res.status(400).json({message:'Missing required fields: name, email, amount, or UTR/Transaction ID.'});
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        // Corrected spacing: {message:'...'}
        return res.status(400).json({message:'Invalid contribution amount.'});
    }

    // 3. UTR Duplicate Check (Collection path uses the APP_ID)
    const uniqueTxnRef = db.collection(`artifacts/${APP_ID}/public/data/all_receipts`);
    try {
        const qSnapshot = await uniqueTxnRef.where('txnId', '==', txnId.trim()).get();
        if (!qSnapshot.empty) {
            // Corrected spacing: {message:'...'}
            return res.status(409).json({message:`Error: The Transaction ID ${txnId} has already been submitted.`});
        }
    } catch (error) {
        functions.logger.error('Firestore UTR Check Error:', error);
    }

    // 4. Save Receipt to Firestore
    const receiptData = {
        name: name,
        email: email,
        amount: parsedAmount.toFixed(2),
        txnId: txnId.trim(),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'Pending Verification', 
    };

    try {
        const adminCollectionRef = db.collection(`artifacts/${APP_ID}/public/data/receipts_for_review`);
        await adminCollectionRef.add(receiptData);
        functions.logger.info('Receipt saved to Firestore successfully.', {txnId, email});
    } catch (error) {
        functions.logger.error('Firestore Save Error:', error);
        // Corrected spacing: {message:'...'}
        return res.status(500).json({message:'Database error occurred. Receipt not saved.'});
    }

    // 5. Save UTR to the unique list
    try {
        await uniqueTxnRef.add({txnId: txnId.trim(), timestamp: admin.firestore.FieldValue.serverTimestamp()});
    } catch (error) {
        functions.logger.error('Failed to save UTR to unique list:', error);
    }

    // 6. Send Confirmation Email via SendGrid
    if (!sendGridKey) {
        // Corrected spacing: {message:'...'}
        return res.status(200).json({message:'Submission successful, but email skipped due to missing API key.'});
    }

    // Email content (using your verified Single Sender email)
    const msg = {
        to: email,
        from: 'nitinxai.ml@gmail.com', 
        subject: `Pragyan AI Contribution Received - Txn ID ${txnId}`,
        html: `<p>Thank you for your generous contribution of <strong>₹${parsedAmount.toFixed(2)}</strong> to the Pragyan AI open-source project. Your details are being verified.</p>`,
    };

    try {
        await sgMail.send(msg);
        // Corrected spacing: {message:'...'}
        return res.status(200).json({message:'Submission successful! Your receipt will be emailed after verification.'});
    } catch (error) {
        functions.logger.error('SendGrid Email Error:', error.response?.body || error);
        // Corrected spacing: {message:'...'}
        return res.status(200).json({message:'Submission successful, but email failed to send. We saved your details and will contact you.'});
    }
});
