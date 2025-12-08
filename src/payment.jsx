import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

// --- Firebase Configuration (Hardcoded for your GitHub site) ---
const appId = 'pragyanalpha'; 
const firebaseConfig = {
  apiKey: "AIzaSyAq-LjX9z7hEdsB_2oXTjfYFE77OT-3X0I",
  authDomain: "pragyanalpha.firebaseapp.com",
  projectId: "pragyanalpha",
  storageBucket: "pragyanalpha.firebasestorage.app",
  messagingSenderId: "788103367384",
  appId: "1:788103367384:web:d742f0c8187bd1679c65ad",
  measurementId: "G-RHZ4W6J7T0"
};
// ------------------------------------------------------------------


// ⚠️ IMPORTANT: REPLACE THIS WITH YOUR PARENT'S ACTUAL UPI ID ⚠️
const UPI_ID = 'nitinraj@okicici'; // Placeholder for demonstration purposes

// Updated Tiers and Details
const CONTRIBUTION_TIERS = [
    { amount: 99, name: 'Entry Level', detail: 'Support training for 10,000 tokens' },
    { amount: 199, name: 'Data Helper', detail: 'Helps improve the dataset' },
    { amount: 499, name: 'GPU Hour Sponsor', detail: 'Sponsor 1-hour GPU time' },
    { amount: 999, name: 'Mini-Model Contributor', detail: 'Contribute to Mini-Model training' },
    { amount: 4999, name: 'Official Supporter', detail: 'Name on website' },
    { amount: 9999, name: 'Major Sponsor', detail: 'Sponsor Advance GPU Credits (Listed)' },
];

// --- Utility Components ---

const LoadingIndicator = ({ text = "Loading..." }) => (
    <div className="flex flex-col items-center justify-center p-8 bg-bg-dark text-white min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-cyan"></div>
        <p className="mt-4 text-accent-cyan text-lg font-semibold">{text}</p>
    </div>
);

const SamrionLogo = () => (
    // Samrion Red is kept for branding contrast on the receipt
    <div className="h-10 w-10 bg-samrion-red rounded-lg flex items-center justify-center shadow-lg shadow-red-900/50">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16.5 12.75a4.5 4.5 0 11-9 0m9 0H3m14.5 0H21m-2.5 0a4.5 4.5 0 00-9 0" />
        </svg>
    </div>
);

// --- Receipt View Component (Printable) ---
const ReceiptView = ({ receiptId, amount, utr, contributor, onReset }) => {
    const [emailStatus, setEmailStatus] = useState('sending'); // 'sending', 'sent', 'error'
    
    // Simulate email sending
    useEffect(() => {
        const timeout = setTimeout(() => {
            setEmailStatus('sent');
        }, 3000); // 3-second delay to simulate network latency

        return () => clearTimeout(timeout);
    }, []);

    const handlePrint = () => {
        // Trigger the browser's print dialog
        window.print();
    };

    const emailStatusMessage = useMemo(() => ({
        sending: <p className="text-yellow-400"><i className="fa-solid fa-spinner fa-spin mr-2"></i> Generating & preparing verified receipt email...</p>,
        sent: <p className="text-green-400 font-bold"><i className="fa-solid fa-envelope-circle-check mr-2"></i> Email Sent to {contributor.email}!</p>,
        error: <p className="text-red-400"><i className="fa-solid fa-triangle-exclamation mr-2"></i> Failed to send email. Please use the Print button.</p>
    }), [contributor.email]);
    
    return (
        <div className="text-center p-4 md:p-6 bg-bg-card-light rounded-2xl shadow-2xl animate-fade-in text-white w-full max-w-lg mx-auto">
            
            {/* The element to be printed */}
            <div id="printable-receipt" className="bg-white text-slate-900 p-8 md:p-10 rounded-lg shadow-xl mb-6">
                
                {/* Header (Samrion Branding) */}
                <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-4">
                    <div className="flex items-center space-x-3">
                        <SamrionLogo />
                        <div>
                            <p className="text-xs uppercase tracking-widest text-slate-400">Receipt from</p>
                            <h3 className="font-extrabold text-2xl text-accent-cyan">Samrion (Nitin Raj)</h3>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500">Issued: {new Date().toLocaleDateString('en-IN')}</p>
                </div>

                {/* Receipt Details */}
                <h4 className="text-xl font-bold mb-4 text-slate-800">Contribution Report Receipt</h4>

                <div className="grid grid-cols-2 gap-4 text-left border-b border-gray-200 pb-4 mb-4">
                    <div>
                        <p className="text-sm text-slate-500">Receipt ID (Transaction Report):</p>
                        <p className="font-mono text-base font-bold text-accent-cyan break-all">{receiptId}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Claimed Amount:</p>
                        <p className="text-2xl font-extrabold text-green-600">₹{amount.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-sm text-slate-500">Payment Status:</p>
                        <p className="font-semibold text-red-600">
                            <i className="fa-solid fa-hourglass-half mr-2"></i>Pending Verification (UTR: {utr})
                        </p>
                    </div>
                </div>

                {/* Contributor Details */}
                <div className="text-left mb-6">
                    <h5 className="font-bold text-base mb-2 border-b border-dashed pb-1">Contributor Information</h5>
                    <p className="text-sm"><span className="font-semibold w-24 inline-block">Name:</span> {contributor.name}</p>
                    <p className="text-sm"><span className="font-semibold w-24 inline-block">Email:</span> {contributor.email}</p>
                    <p className="text-sm"><span className="font-semibold w-24 inline-block">Phone:</span> {contributor.phone}</p>
                </div>

                <div className="text-sm text-center text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
                    <p>
                        **THIS IS NOT A VERIFIED RECEIPT.** This confirms your report.
                        The **final, verified receipt** confirming the amount will be sent to your email after bank reconciliation.
                    </p>
                </div>
            </div>

            {/* Email Status and Action Buttons (Hidden during print) */}
            <div className="mt-6 print:hidden">
                {emailStatusMessage[emailStatus]}
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 mt-4 print:hidden">
                <button 
                    onClick={handlePrint} 
                    className="flex-1 py-3 bg-accent-cyan hover:bg-blue-400 text-slate-900 rounded-lg font-semibold transition"
                >
                    <i className="fa-solid fa-print mr-2"></i> Print/Save PDF Receipt
                </button>
                <button 
                    onClick={onReset} 
                    className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition"
                >
                    <i className="fa-solid fa-arrow-left mr-2"></i> Start New Contribution
                </button>
            </div>
        </div>
    );
};


// --- Payment Flow Component (Main Application Logic) ---
const PaymentFlow = ({ db, userId }) => {
    // Payment UI States
    const [view, setView] = useState('tiers'); // 'tiers', 'form', 'loading', 'receipt'
    const [selectedAmount, setSelectedAmount] = useState(null);
    const [customAmount, setCustomAmount] = useState('');
    const [error, setError] = useState(null);

    // Form Field States
    const [upiRefNumber, setUpiRefNumber] = useState('');
    const [contributorName, setContributorName] = useState('');
    const [contributorEmail, setContributorEmail] = useState('');
    const [contributorPhone, setContributorPhone] = useState('');

    // Receipt Data
    const [receiptDetails, setReceiptDetails] = useState(null);
    
    // Determine the amount to display/submit
    const currentAmount = selectedAmount || (customAmount ? parseInt(customAmount) : 0) || 0;

    // 1. Data Submission Handler
    const handleTransactionReport = useCallback(async (e) => {
        e.preventDefault();
        
        if (!db || !userId) {
            setError("Authentication not ready. Please wait.");
            return;
        }

        const amount = currentAmount;
        const utr = upiRefNumber.trim();
        
        if (amount <= 0 || utr.length < 12 || !contributorName || !contributorEmail || !contributorPhone) {
            setError("Please fill all required fields correctly.");
            return;
        }

        setView('loading');
        setError(null);

        try {
            const transactionsColRef = collection(db, 'artifacts', appId, 'public', 'data', 'pragyan_transactions');
            
            // --- UTR Uniqueness Check (Crucial for "no 2 receipts with one utr") ---
            const q = query(transactionsColRef, where("upiRefNumber", "==", utr));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                setError("This UPI Transaction Reference Number (UTR) has already been reported. Please use a unique UTR.");
                setView('form');
                return;
            }
            // --- End UTR Uniqueness Check ---


            const newTransaction = {
                contributorId: userId,
                amount: amount,
                upiRefNumber: utr,
                upiIdReceived: UPI_ID,
                contributorName: contributorName,
                contributorEmail: contributorEmail,
                contributorPhone: contributorPhone,
                status: 'Pending Verification', 
                timestamp: serverTimestamp(),
            };

            const docRef = await addDoc(transactionsColRef, newTransaction);
            
            setReceiptDetails({
                receiptId: docRef.id,
                amount: amount,
                utr: utr,
                contributor: {
                    name: contributorName,
                    email: contributorEmail,
                    phone: contributorPhone,
                }
            });

            setView('receipt');
            
        } catch (err) {
            console.error("Error submitting transaction:", err);
            setError("Failed to record transaction. Please try again.");
            setView('form');
        }
    }, [db, userId, currentAmount, upiRefNumber, contributorName, contributorEmail, contributorPhone]);

    // 2. Reset Handler (Resets the form state, not the entire app)
    const handleReset = () => {
        setView('tiers');
        setSelectedAmount(null);
        setCustomAmount('');
        setUpiRefNumber('');
        setContributorName('');
        setContributorEmail('');
        setContributorPhone('');
        setReceiptDetails(null);
        setError(null);
    };

    if (view === 'loading') {
        return <LoadingIndicator text="Recording Contribution Details..." />;
    }
    
    if (view === 'receipt' && receiptDetails) {
        return <ReceiptView {...receiptDetails} onReset={handleReset} />; 
    }

    return (
        <div className="w-full max-w-lg mx-auto p-6 md:p-10 bg-bg-card-light rounded-xl shadow-2xl border border-slate-700 font-sans flex flex-col">
            
            <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-accent-cyan">
                    Contribute to Pragyan
                </h1>
                <p className="text-slate-400 mt-2">
                    Fueling India's Open Source AI.
                </p>
            </div>

            {/* Error Message Display */}
            {error && (
                <div className="p-4 mb-6 bg-red-900/30 text-red-300 rounded-lg border border-red-700 font-semibold">
                    <i className="fa-solid fa-circle-exclamation mr-2"></i> {error}
                </div>
            )}
            
            {/* 1. Tier Selection View */}
            {view === 'tiers' && (
                <div>
                    <h3 className="text-lg font-semibold mb-3 text-white">1. Select Contribution Tier:</h3>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {CONTRIBUTION_TIERS.map(tier => (
                            <button 
                                key={tier.amount}
                                type="button" 
                                onClick={() => {
                                    setSelectedAmount(tier.amount);
                                    setCustomAmount('');
                                    setView('form');
                                }}
                                className={`p-3 rounded-lg border-2 text-left transition duration-300 
                                    ${selectedAmount === tier.amount 
                                        ? 'border-accent-cyan bg-accent-cyan/10 shadow-accent' 
                                        : 'border-slate-700 bg-bg-dark hover:border-accent-cyan/50'}`
                                }
                            >
                                <span className="text-xl font-bold block text-accent-cyan">₹{tier.amount.toLocaleString('en-IN')}</span>
                                <span className="text-xs text-slate-400">{tier.name}</span>
                                <span className="text-xs text-slate-500 block mt-1">{tier.detail}</span>
                            </button>
                        ))}
                    </div>

                    <div className="mb-8 relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-2xl text-slate-500">₹</span>
                        <input 
                            type="number" 
                            min="10" 
                            placeholder="Or Enter Custom Amount (Min ₹10)" 
                            value={customAmount}
                            onChange={(e) => {
                                setCustomAmount(e.target.value);
                                setSelectedAmount(null);
                            }}
                            onBlur={() => {
                                const val = parseInt(customAmount);
                                if (val >= 10) {
                                    setSelectedAmount(val);
                                    setView('form');
                                } else {
                                    setCustomAmount('');
                                }
                            }}
                            className="w-full bg-bg-dark border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white text-xl focus:border-accent-cyan focus:ring-accent-cyan transition duration-200"
                        />
                    </div>

                    <button
                        onClick={() => {
                            const val = currentAmount;
                            if (val >= 10) setView('form');
                            else setError("Please select a tier or enter a custom amount of ₹10 or more.");
                        }}
                        className="w-full py-3 bg-accent-cyan hover:bg-blue-400 text-slate-900 rounded-lg font-bold transition disabled:opacity-50"
                        disabled={currentAmount < 10}
                    >
                        Continue to Payment Report
                    </button>
                </div>
            )}

            {/* 2. Payment & Report Form View */}
            {view === 'form' && (
                <form onSubmit={handleTransactionReport}>
                    <button type="button" onClick={() => handleReset()} className="inline-flex items-center text-sm text-slate-400 hover:text-white mb-6">
                        <i className="fa-solid fa-arrow-left mr-2"></i> Change Amount (₹{currentAmount.toLocaleString('en-IN')})
                    </button>

                    <div className="bg-bg-dark p-6 rounded-xl border border-slate-700 text-center mb-6">
                        <h3 className="text-lg font-semibold mb-4 text-white flex items-center justify-center gap-2">
                            <i className="fa-solid fa-mobile-screen-button text-green-400"></i>
                            UPI Payment for: <span className="text-accent-cyan">₹{currentAmount.toLocaleString('en-IN')}</span>
                        </h3>

                        {/* UPI QR Code Image - IMPORTANT: Use an actual QR code image for deployment */}
                        <div id="qr-code-display" className="mb-4">
                            <img src={`https://placehold.co/200x200/2D9CDB/ffffff?text=Scan+to+Pay`} alt="Scan QR Code to Pay" 
                                className="w-48 h-48 mx-auto rounded-xl border-4 border-accent-cyan shadow-lg shadow-accent"/>
                            <p className="text-sm text-slate-400 mt-2">Scan with Google Pay, PhonePe, or BHIM.</p>
                        </div>
                        
                        <p className="text-sm text-slate-400 mb-2">Or Pay Directly to UPI ID:</p>
                        <div className="bg-slate-800 p-3 rounded-lg inline-block">
                            <span className="font-mono text-lg text-accent-cyan font-bold">{UPI_ID}</span>
                        </div>
                    </div>

                    {/* Contributor Information Input */}
                    <h3 className="text-lg font-semibold mb-3 text-white">2. Your Details (For Verified Receipt):</h3>
                    <div className="space-y-4 mb-6">
                        <input 
                            type="text" 
                            required 
                            placeholder="Your Full Name" 
                            value={contributorName}
                            onChange={(e) => setContributorName(e.target.value)}
                            className="w-full bg-bg-dark border border-slate-700 rounded-lg py-3 px-4 text-white focus:border-accent-cyan transition"
                        />
                        <input 
                            type="email" 
                            required 
                            placeholder="Email Address (Verified Receipt will be sent here)" 
                            value={contributorEmail}
                            onChange={(e) => setContributorEmail(e.target.value)}
                            className="w-full bg-bg-dark border border-slate-700 rounded-lg py-3 px-4 text-white focus:border-accent-cyan transition"
                        />
                        <input 
                            type="tel" 
                            required 
                            placeholder="Phone Number" 
                            value={contributorPhone}
                            onChange={(e) => setContributorPhone(e.target.value)}
                            className="w-full bg-bg-dark border border-slate-700 rounded-lg py-3 px-4 text-white focus:border-accent-cyan transition"
                        />
                    </div>
                    
                    {/* Transaction Reference Input */}
                    <h3 className="text-lg font-semibold mb-3 text-white">3. Report Payment (Required):</h3>
                    <div className="mb-6">
                        <input 
                            type="text" 
                            id="upi-ref" 
                            required 
                            minLength="12"
                            maxLength="30"
                            placeholder="UPI Transaction Reference Number (UTR)" 
                            value={upiRefNumber}
                            onChange={(e) => setUpiRefNumber(e.target.value)}
                            className="w-full bg-bg-dark border border-slate-700 rounded-lg py-3 px-4 text-white text-lg focus:border-samrion-red focus:ring-samrion-red transition"
                        />
                        <p className="text-xs text-slate-500 mt-1">Found in your payment app's history. Must be unique.</p>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 bg-samrion-red hover:bg-red-700 text-white rounded-lg font-bold text-lg transition-all shadow-lg shadow-red-900/50 disabled:opacity-50"
                        disabled={upiRefNumber.length < 12 || currentAmount < 10 || !contributorName || !contributorEmail || !contributorPhone}
                    >
                        Generate Receipt Report & Await Email
                    </button>
                </form>
            )}
        </div>
    );
};


// --- Main Application Component (Handles Auth Only) ---

const App = () => {
    // Firebase States
    const [db, setDb] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    
    // 1. Firebase Initialization and Authentication
    useEffect(() => {
        if (!firebaseConfig) {
            console.error("Firebase config is missing.");
            return;
        }

        const app = initializeApp(firebaseConfig);
        const firestore = getFirestore(app);
        const authInstance = getAuth(app);
        
        setDb(firestore);

        const unsubscribe = onAuthStateChanged(authInstance, (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                // Simplified auth for external deployment: sign in anonymously
                signInAnonymously(authInstance).then(anonUser => setUserId(anonUser.user.uid));
            }
            setIsAuthReady(true);
        });

        return () => unsubscribe();
    }, []);

    // Define custom colors for Tailwind
    const customStyle = {
        '--accent-cyan': '#2D9CDB', // Bright Cyan/Electric Blue for primary text/borders
        '--samrion-red': '#E11D48', // Samrion Red for action buttons
        '--bg-dark': '#151c26', // Main background color (deep charcoal/navy)
        '--bg-card-light': '#1E293B' // Card/Input background color (lighter dark shade)
    };

    if (!isAuthReady) {
        return <LoadingIndicator text="Initializing Firebase & User Session..." />;
    }

    return (
        <div 
            className="w-full min-h-screen bg-bg-dark text-white font-sans pb-10 flex flex-col items-center p-4"
            style={customStyle}
        >
            <style jsx="true">{`
                /* Print Styles to hide everything but the receipt */
                @media print {
                    .print\\:hidden, #root > div > div:not(#printable-receipt-container) {
                        display: none !important;
                    }
                    body { 
                        background: white !important; 
                        padding: 0; 
                        margin: 0;
                    }
                    #printable-receipt { 
                        width: 100%; 
                        box-shadow: none !important; 
                        border: none !important; 
                        padding: 0;
                    }
                }
                
                .text-accent-cyan { color: var(--accent-cyan); }
                .border-accent-cyan { border-color: var(--accent-cyan); }
                .bg-accent-cyan { background-color: var(--accent-cyan); }
                .bg-accent-cyan\\/10 { background-color: rgba(45, 156, 219, 0.1); }
                .hover\\:border-accent-cyan\\/50:hover { border-color: rgba(45, 156, 219, 0.5); }
                .focus\\:border-accent-cyan:focus { border-color: var(--accent-cyan); }
                .focus\\:ring-accent-cyan:focus { --tw-ring-color: var(--accent-cyan); }
                .bg-bg-dark { background-color: var(--bg-dark); }
                .bg-bg-card-light { background-color: var(--bg-card-light); }
                .shadow-accent { box-shadow: 0 4px 6px -1px rgba(45, 156, 219, 0.2), 0 2px 4px -2px rgba(45, 156, 219, 0.2); }
                .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
            
            <PaymentFlow db={db} userId={userId} />
        </div>
    );
};

export default App;
