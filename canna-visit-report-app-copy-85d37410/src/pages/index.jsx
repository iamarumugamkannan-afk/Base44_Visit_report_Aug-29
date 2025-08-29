import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import NewVisit from "./NewVisit";

import Reports from "./Reports";

import Settings from "./Settings";

import Admin from "./Admin";

import Customers from "./Customers";

import Configuration from "./Configuration";

import Analytics from "./Analytics";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    NewVisit: NewVisit,
    
    Reports: Reports,
    
    Settings: Settings,
    
    Admin: Admin,
    
    Customers: Customers,
    
    Configuration: Configuration,
    
    Analytics: Analytics,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/NewVisit" element={<NewVisit />} />
                
                <Route path="/Reports" element={<Reports />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/Admin" element={<Admin />} />
                
                <Route path="/Customers" element={<Customers />} />
                
                <Route path="/Configuration" element={<Configuration />} />
                
                <Route path="/Analytics" element={<Analytics />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}