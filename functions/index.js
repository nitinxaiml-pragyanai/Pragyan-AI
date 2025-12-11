/**
 * Firebase Cloud Function for handling contribution submissions.
 * This function saves the receipt to Firestore and sends a confirmation email via SendGrid.
 */

'use strict';

// Import firebase-functions as a single object so config() and logger are available correctly
const functions = require('firebase-functions');
const { https } = functions;          // use functions.https
const { logger } = functions;         // functions.logger

const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

// Initialize Firebase Admin SDK (guard against double-initialization in emulators/tests)
if (!admin.apps || admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

// Set the SendGrid API Key from the Firebase environment configuration
const sendGridKey = functions.config().sendgrid?.key;
if (!sendGridKey) {
  logger.error('SendGrid API key not configured. Email sending will fail.');
} else {
  sgMail.setApiKey(sendGridKey);
}

// Fixed App ID using your project name
const APP_ID = 'pragyanalpha';

/**
 * HTTPS Function to handle receipt submission.
 */
exports.submitReceipt = https.onRequest(async (req, res) => {
  // 1. CORS Setup (Essential for GitHub Pages/External Hosting)
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed. Use POST.' });
  }

  // 2. Input Validation
  const { name, email, amount, txnId } = req.body || {};

  if (!name || !email || !amount || !txnId) {
    return res.status(400).json({
      message: 'Missing required fields: name, email, amount, or UTR/Transaction ID.',
    });
  }

  const parsedAmount = parseFloat(amount);
  if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ message: 'Invalid contribution amount.' });
  }

  // 3. UTR Duplicate Check (Collection path uses the APP_ID)
  const uniqueTxnRef = db.collection(`artifacts/${APP_ID}/public/data/all_receipts`);
  try {
    const qSnapshot = await uniqueTxnRef.where('txnId', '==', txnId.trim()).get();
    if (!qSnapshot.empty) {
      return res
        .status(409)
        .json({ message: `Error: The Transaction ID ${txnId} has already been submitted.` });
    }
  } catch (error) {
    logger.error('Firestore UTR Check Error:', error);
    // continue — don't block submission for transient read errors, but inform client
    return res.status(500).json({ message: 'Error checking transaction uniqueness.' });
  }

  // 4. Save Receipt to Firestore
  const receiptData = {
    name: String(name).trim(),
    email: String(email).trim(),
    amount: Number(parsedAmount).toFixed(2),
    txnId: String(txnId).trim(),
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    status: 'Pending Verification',
  };

  try {
    const adminCollectionRef = db.collection(`artifacts/${APP_ID}/public/data/receipts_for_review`);
    await adminCollectionRef.add(receiptData);
    logger.info('Receipt saved to Firestore successfully.', { txnId: receiptData.txnId, email: receiptData.email });
  } catch (error) {
    logger.error('Firestore Save Error:', error);
    return res.status(500).json({ message: 'Database error occurred. Receipt not saved.' });
  }

  // 5. Save UTR to the unique list
  try {
    await uniqueTxnRef.add({
      txnId: receiptData.txnId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    // Log but don't fail the whole request
    logger.error('Failed to save UTR to unique list:', error);
  }

  // 6. Send Confirmation Email via SendGrid
  if (!sendGridKey) {
    // Successfully saved, but can't send email
    return res
      .status(200)
      .json({ message: 'Submission successful, but email skipped due to missing API key.' });
  }

  // Email content (using your verified Single Sender email)
  const msg = {
    to: receiptData.email,
    from: 'nitinxai.ml@gmail.com',
    subject: `Pragyan AI Contribution Received - Txn ID ${receiptData.txnId}`,
    html: `<p>Thank you for your generous contribution of <strong>₹${Number(parsedAmount).toFixed(
      2
    )}</strong> to the Pragyan AI open-source project. Your details are being verified.</p>`,
  };

  try {
    await sgMail.send(msg);
    return res.status(200).json({ message: 'Submission successful! Your receipt will be emailed after verification.' });
  } catch (error) {
    // If SendGrid returns a response body, prefer that for logs
    logger.error('SendGrid Email Error:', error.response?.body || error);
    return res
      .status(200)
      .json({ message: 'Submission successful, but email failed to send. We saved your details and will contact you.' });
  }
});
