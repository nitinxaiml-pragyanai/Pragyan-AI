import React from 'react';
// Use HashRouter for better compatibility with GitHub Pages (non-server routing)
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom'; 

// --- Import All Pages ---
import LandingPage from './LandingPage'; // Holds the content of your original index.html
import PaymentFlow from './payment';     // Your contribution component

// Rename the imported component to avoid conflict with the surrounding App component
import AdminPanel from './admin';        // Your fully functional Admin Dashboard

// A simple header/nav that appears on all pages (Optional but useful for context)
const SiteHeader = () => (
    <header className="fixed top-0 left-0 right-0 z-50 p-4 bg-bg-dark bg-opacity-90 backdrop-blur-sm shadow-lg text-white">
        <nav className="flex justify-between items-center max-w-7xl mx-auto">
            <Link to="/" className="text-xl font-bold text-pragyan-blue hover:text-samrion-red transition">
                Pragyan AI
            </Link>
            <div className="flex space-x-4">
                <Link 
                    to="/" 
                    className="text-slate-300 hover:text-white transition hidden md:block"
                >
                    Home
                </Link>
                <Link 
                    to="/payment" 
                    className="text-samrion-red hover:text-white font-semibold transition"
                >
                    Contribute Now
                </Link>
                {/* *** SECRET ROUTE FOR ADMIN ***
                  Users won't see this, but navigating to /admin will load the login screen.
                */}
            </div>
        </nav>
    </header>
);

const AppRouter = () => {
    return (
        // Note: The custom styles from Admin.jsx should be kept in index.html or 
        // Admin.jsx for consistency, but the AppRouter ensures the routing works.
        <Router>
            {/* The SiteHeader can be placed here if you want it on ALL pages */}
            {/* <SiteHeader /> */}

            <Routes>
                {/* 1. Landing Page (Default Route) */}
                {/* The LandingPage component will contain the full HTML structure 
                   (including its own nav) that you moved from index.html. */}
                <Route path="/" element={<LandingPage />} />
                
                {/* 2. Payment/Contribution Page */}
                <Route path="/payment" element={<PaymentFlow />} />

                {/* 3. Secret Admin Page - Now correctly routed */}
                <Route path="/admin" element={<AdminPanel />} />
                
                {/* Optional: 404/Not Found route */}
                <Route 
                    path="*" 
                    element={
                        <div className="w-full min-h-screen bg-bg-dark text-white pt-32 text-center">
                            <h1 className="text-4xl font-bold text-samrion-red">404</h1>
                            <p className="text-xl text-slate-400 mt-2">Page Not Found</p>
                            <Link to="/" className="mt-4 inline-block text-pragyan-blue hover:text-white transition">
                                Go to Home
                            </Link>
                        </div>
                    } 
                />
            </Routes>
        </Router>
    );
};

export default AppRouter;
