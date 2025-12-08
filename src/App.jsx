import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';

// Ensure these imports match the *LOWERCASE* filenames (admin.jsx and payment.jsx)
import LandingPage from './LandingPage.jsx';
import PaymentFlow from './payment.jsx';
import AdminPanel from './admin.jsx';

const AppRouter = () => {
    return (
        // Use HashRouter for compatibility with GitHub Pages routing
        <HashRouter>
            <Routes>
                {/* The main landing page */}
                <Route path="/" element={<LandingPage />} />
                
                {/* The payment/contribution page */}
                <Route path="/payment" element={<PaymentFlow />} />
                
                {/* The secured admin panel */}
                <Route path="/admin" element={<AdminPanel />} />
            </Routes>
        </HashRouter>
    );
};

export default AppRouter;
