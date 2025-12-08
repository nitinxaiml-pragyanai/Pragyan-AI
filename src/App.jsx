import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

// Import all your page components
import LandingPage from './LandingPage'; // Holds the content of your original index.html
import PaymentFlow from './Payment';     // Your contribution component
import Admin from './Admin';             // Your secret page component

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Route for the main landing page */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Route for the payment/contribution page */}
        <Route path="/payment" element={<PaymentFlow />} />

        {/* Route for the secret admin page */}
        <Route path="/admin" element={<Admin />} />
        
        {/* Optional: Add a 404/Not Found route */}
        <Route path="*" element={<h1 className="text-center pt-32 text-2xl text-white">404: Page Not Found</h1>} />
      </Routes>
    </Router>
  );
};

export default App;
