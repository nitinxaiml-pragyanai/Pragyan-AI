import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, query } from 'firebase/firestore';

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

// --- Security Configuration ---
const ADMIN_ACCESS_CODE = 'samriddhi'; 
// ------------------------------

// Define custom colors for Tailwind globally here
const customStyle = {
    '--accent-cyan': '#2D9CDB',
    '--samrion-red': '#E11D48',
    '--pragyan-blue': '#0EA5E9',
    '--bg-dark': '#151c26',
    '--bg-card-light': '#1E293B'
};

// --- Utility Components ---

const LoadingIndicator = ({ text = "Loading..." }) => (
    <div className="flex flex-col items-center justify-center p-8 bg-bg-dark text-white min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-cyan"></div>
        <p className="mt-4 text-accent-cyan text-lg font-semibold">{text}</p>
    </div>
);

const SamrionLogo = () => (
    <div className="h-8 w-8 bg-samrion-red rounded-lg flex items-center justify-center shadow-lg shadow-red-900/50">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16.5 12.75a4.5 4.5 0 11-9 0m9 0H3m14.5 0H21m-2.5 0a4.5 4.5 0 00-9 0" />
        </svg>
    </div>
);

// --- Printable Receipt Component (Hidden unless printing) ---
const PrintableReceipt = ({ transaction, printingId }) => {
    // Check if this specific receipt should be visible for printing
    const isPrinting = printingId === transaction.id;

    return (
        <div 
            id={`receipt-${transaction.id}`} 
            className={`p-8 bg-white text-slate-900 w-full mx-auto ${isPrinting ? 'print-active' : 'hidden'}`} 
            style={{maxWidth: '800px'}}
        >
            <div className="flex justify-between items-center border-b border-gray-300 pb-4 mb-6">
                <div className="flex items-center space-x-3">
                    <SamrionLogo />
                    <div>
                        <p className="text-sm uppercase tracking-widest text-samrion-red">VERIFIED RECEIPT</p>
                        <h3 className="font-extrabold text-3xl text-accent-cyan">Pragyan AI</h3>
                    </div>
                </div>
                <p className="text-lg font-mono text-slate-600">Issued: {new Date().toLocaleDateString('en-IN')}</p>
            </div>

            <h4 className="text-4xl font-extrabold mb-8 text-center text-green-700">₹{transaction.amount?.toLocaleString('en-IN')}</h4>
            
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-left mb-8 border border-slate-200 p-4 rounded-lg">
                <div className="col-span-2">
                    <p className="text-sm text-slate-500">Transaction ID (Firestore Ref):</p>
                    <p className="font-mono text-base font-bold text-slate-800 break-all">{transaction.id}</p>
                </div>
                <div>
                    <p className="text-sm text-slate-500">Reported By:</p>
                    <p className="font-semibold text-slate-700">{transaction.contributorName}</p>
                </div>
                <div>
                    <p className="text-sm text-slate-500">Contributor Email:</p>
                    <p className="font-semibold text-slate-700">{transaction.contributorEmail}</p>
                </div>
                <div>
                    <p className="text-sm text-slate-500">UPI Ref. Number (UTR):</p>
                    <p className="font-mono text-slate-700">{transaction.upiRefNumber}</p>
                </div>
                <div>
                    <p className="text-sm text-slate-500">Status:</p>
                    <p className={`font-bold ${transaction.status?.includes('Verified') ? 'text-green-600' : 'text-red-600'}`}>{transaction.status}</p>
                </div>
                <div className="col-span-2">
                    <p className="text-sm text-slate-500">Date Reported:</p>
                    <p className="text-slate-700">{transaction.timestamp.toLocaleDateString('en-IN')} {transaction.timestamp.toLocaleTimeString('en-IN')}</p>
                </div>
            </div>

            <div className="text-center mt-10">
                <p className="text-sm text-slate-600">
                    This receipt confirms the reported contribution to Project Pragyan.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                    Note: This document can be used for internal record-keeping. Generated by Admin Dashboard.
                </p>
            </div>
        </div>
    );
};


// --- Admin Dashboard Core Component ---
const AdminDashboard = ({ db, userId, printingId, handlePrintReceipt }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db) return;

        // Fetching public data from Firestore
        const transactionsColRef = collection(db, 'artifacts', appId, 'public', 'data', 'pragyan_transactions');
        const q = query(transactionsColRef);

        // Real-time listener for contributions
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedTransactions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Convert Firestore Timestamp to Date object for sorting/display
                timestamp: doc.data().timestamp?.toDate() || new Date() 
            }));

            // Sort by latest report first
            fetchedTransactions.sort((a, b) => b.timestamp - a.timestamp); 
            setTransactions(fetchedTransactions);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching transactions:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db, userId]); 

    const totalReported = useMemo(() => {
        // Calculate the total amount reported (sum of 'amount' field)
        return transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    }, [transactions]);

    return (
        <div className="w-full max-w-5xl mx-auto p-4 md:p-6 bg-bg-card-light rounded-xl shadow-2xl border border-slate-700 text-white min-h-[80vh] animate-fade-in">
            <h2 className="text-3xl font-bold text-samrion-red mb-2 border-b border-slate-700 pb-2">Contribution Reports Dashboard</h2>
            <p className="text-sm text-slate-500 mb-4">Viewed by User ID: {userId}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 text-slate-300">
                <div className="bg-bg-dark p-3 rounded-lg border border-slate-800">
                    <p className="text-xs text-slate-500">Total Reports</p>
                    <p className="text-xl font-semibold text-accent-cyan">{transactions.length}</p>
                </div>
                <div className="bg-bg-dark p-3 rounded-lg border border-slate-800 col-span-2 md:col-span-1">
                    <p className="text-xs text-slate-500">Total Reported Amount</p>
                    <p className="text-xl font-semibold text-green-400">₹{totalReported.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-bg-dark p-3 rounded-lg border border-slate-800 col-span-2 md:col-span-1">
                    <p className="text-xs text-slate-500">Admin Code</p>
                    <p className="text-xl font-semibold text-red-400">{ADMIN_ACCESS_CODE}</p>
                </div>
            </div>


            {loading ? (
                <LoadingIndicator text="Loading Transactions..." />
            ) : transactions.length === 0 ? (
                <p className="text-center text-slate-500 py-10">No contributions reported yet.</p>
            ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {transactions.map(t => (
                        <React.Fragment key={t.id}>
                            <div className="bg-bg-dark p-4 rounded-lg border border-slate-800 flex flex-col md:flex-row justify-between items-center print:hidden">
                                
                                {/* Left: Details */}
                                <div className="min-w-0 flex-1 space-y-1">
                                    <p className="text-lg font-bold text-accent-cyan">₹{t.amount?.toLocaleString('en-IN') || 'N/A'}</p>
                                    <p className="text-sm text-white truncate">{t.contributorName} ({t.contributorEmail})</p>
                                    <p className="text-xs text-slate-500 font-mono">UTR: {t.upiRefNumber}</p>
                                </div>
                                
                                {/* Right: Status and Actions */}
                                <div className="text-right mt-3 md:mt-0 md:pl-4 flex-shrink-0 flex flex-col items-end space-y-2">
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full 
                                        ${t.status?.includes('Verified') ? 'bg-green-700 text-green-200' : 'bg-red-700 text-red-200'}`}>
                                        {t.status || 'Unknown'}
                                    </span>
                                    <p className="text-xs text-slate-600">Reported: {t.timestamp.toLocaleDateString('en-IN')}</p>
                                    
                                    {/* PDF/Print Button - uses the prop function */}
                                    <button 
                                        onClick={() => handlePrintReceipt(t.id)}
                                        className="mt-2 text-sm px-3 py-1 bg-pragyan-blue hover:bg-blue-500 text-white rounded font-medium transition flex items-center gap-2"
                                    >
                                        <i className="fa-solid fa-file-pdf"></i> Print/PDF
                                    </button>
                                </div>
                            </div>
                            
                            {/* Render the printable component */}
                            <PrintableReceipt transaction={t} printingId={printingId} />

                        </React.Fragment>
                    ))}
                </div>
            )}
            <footer className="text-center mt-6 text-xs text-slate-700 border-t border-slate-800 pt-3">
                Data is refreshed in real-time using Firestore.
            </footer>
        </div>
    );
};

// --- Admin Dashboard Security Wrapper (Main Component) ---
const App = () => {
    // Firebase States
    const [db, setDb] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    
    // Security State
    const [accessCode, setAccessCode] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [error, setError] = useState(null);

    // Printing State (LIFTED UP)
    const [printingId, setPrintingId] = useState(null); // State to control which receipt to print

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

    // 2. Security Check Handler
    const handleCodeSubmit = (e) => {
        e.preventDefault();
        setError(null);
        if (accessCode.toLowerCase() === ADMIN_ACCESS_CODE) {
            setIsAuthorized(true);
        } else {
            setError("Incorrect access code. Access Denied.");
            setAccessCode('');
        }
    };
    
    // 3. PDF/Print Handler (LIFTED UP)
    const handlePrintReceipt = useCallback((id) => {
        setPrintingId(id);
        // We set a small delay to ensure React has rendered the PrintableReceipt component 
        // with the specific ID before triggering print.
        setTimeout(() => {
            window.print();
            setPrintingId(null); // Reset the state after printing
        }, 100);
    }, []);


    if (!isAuthReady) {
        return <LoadingIndicator text="Initializing Secure Session..." />;
    }

    return (
        <div 
            className="w-full min-h-screen bg-bg-dark text-white font-sans pb-10 flex flex-col justify-center items-center p-4"
            style={customStyle}
        >
            {/* The style block is now outside the conditional rendering and 
                uses a regular <style> tag to ensure it's a valid React child 
            */}
            <style>
                {`
                .text-accent-cyan { color: var(--accent-cyan, #2D9CDB); }
                .text-samrion-red { color: var(--samrion-red, #E11D48); }
                .text-pragyan-blue { color: var(--pragyan-blue, #0EA5E9); }
                .bg-pragyan-blue { background-color: var(--pragyan-blue, #0EA5E9); }
                .border-accent-cyan { border-color: var(--accent-cyan, #2D9CDB); }
                .bg-bg-dark { background-color: var(--bg-dark, #151c26); }
                .bg-bg-card-light { background-color: var(--bg-card-light, #1E293B); }
                .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* Print Styles for the PDF Receipt */
                @media print {
                    /* Hide everything by default */
                    body > * {
                        display: none !important;
                    }
                    /* Ensure the root element of the App is the only one visible */
                    #root > div {
                        display: block !important;
                    }
                    /* Hide the admin dashboard content itself */
                    .print-hidden-container {
                        display: none !important;
                    }
                    /* Ensure body/print area is white */
                    body { 
                        background: white !important; 
                        padding: 0; 
                        margin: 0;
                    }
                    /* Show only the active receipt */
                    .print-active {
                        display: block !important;
                    }
                }
                `}
            </style>
            
            {isAuthorized ? (
                // Pass printing state and handler to the dashboard
                <AdminDashboard 
                    db={db} 
                    userId={userId} 
                    printingId={printingId} 
                    handlePrintReceipt={handlePrintReceipt}
                />
            ) : (
                <div className="w-full max-w-lg mx-auto p-6 md:p-10 bg-bg-card-light rounded-xl shadow-2xl border border-slate-700 text-white flex flex-col justify-center items-center">
                    <div className="text-center mb-8">
                        <i className="fa-solid fa-user-lock text-samrion-red text-5xl mb-4"></i>
                        <h2 className="text-2xl font-bold text-white">Pragyan Admin Portal</h2>
                        <p className="text-slate-400 mt-2">Enter the secret code to view reported transactions.</p>
                    </div>
                    
                    <form onSubmit={handleCodeSubmit} className="w-full max-w-xs space-y-4">
                        <input 
                            type="password" 
                            placeholder="Enter Access Code" 
                            value={accessCode}
                            onChange={(e) => setAccessCode(e.target.value)}
                            className="w-full bg-bg-dark border border-slate-700 rounded-lg py-3 px-4 text-white text-lg focus:border-samrion-red transition"
                        />
                        
                        {error && (
                            <p className="text-red-400 text-sm font-semibold">{error}</p>
                        )}

                        <button
                            type="submit"
                            className="w-full py-3 bg-samrion-red hover:bg-red-700 text-white rounded-lg font-bold text-lg transition-all shadow-lg shadow-red-900/50"
                        >
                            Unlock Dashboard
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default App;
