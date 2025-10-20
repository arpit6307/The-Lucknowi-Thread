/**
 * =================================================================
 * AdminPage.jsx - FINAL VERSION with Recycle Bin & AI Assistant
 * =================================================================
 * PURPOSE:
 * - Admin panel ka main layout.
 * - Desktop par ek collapsible (open/close) sidebar hai.
 * - Mobile par ek functional, slide-in hamburger menu hai.
 * - NEW: AI Assistant ka link aur icon add kiya gaya hai.
 * =================================================================
 */

import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';

// --- Section 1: SVG Icons for Navigation ---
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10M18 20V4M6 20V16" /></svg>;
const StoreIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>;
const OrdersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>;
const ReviewsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
const CustomersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const AbandonedCartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /><path d="M12 12h.01" /><path d="M16 12h.01" /><path d="M20 12h.01" /></svg>;
const MarketingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.2-3.4" /></svg>;
const CouponsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 7.56a2 2 0 0 1 2-2h15a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2z" /><path d="M7 16v-2.5a2.5 2.5 0 1 0 0-5V6" /><path d="M15 8h2" /><path d="M15 12h2" /><path d="M15 16h2" /></svg>;
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const SidebarToggleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="9" y1="3" x2="9" y2="21" /></svg>;
const RecycleBinIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
// NEW: AI Assistant Icon - updated to match image and other icons' style
const AiAssistantIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <rect x="7" y="7" width="10" height="5" rx="1"></rect>
        <line x1="7" y1="15" x2="17" y2="15"></line>
        <line x1="10" y1="7" x2="10" y2="15"></line>
        <line x1="14" y1="7" x2="14" y2="15"></line>
    </svg>
);


const AdminPage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const location = useLocation();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const SidebarContent = ({ isMobile }) => (
    <>
      <div className="sidebar-header">
        <Link to="/" className="admin-brand-v4">
          <span className="brand-logo-char">T</span>
          <span className="brand-text"><span className="brand-text-inner">The Artisan's Desk</span></span>
        </Link>
        {isMobile && (
          <button className="sidebar-close-btn" onClick={() => setIsMobileMenuOpen(false)}>
            <CloseIcon />
          </button>
        )}
      </div>
      <nav className="admin-sidebar-nav">
        <NavLink to="/admin/dashboard" className="admin-sidebar-link" data-tooltip="Dashboard"><DashboardIcon /><span>Dashboard</span></NavLink>
        <hr />
        <NavLink to="/admin/products" className="admin-sidebar-link" data-tooltip="Products"><StoreIcon /><span>Products</span></NavLink>
        <NavLink to="/admin/orders" className="admin-sidebar-link" data-tooltip="Orders"><OrdersIcon /><span>Orders</span></NavLink>
        <NavLink to="/admin/reviews" className="admin-sidebar-link" data-tooltip="Reviews"><ReviewsIcon /><span>Reviews</span></NavLink>
        <hr />
        <NavLink to="/admin/customers" className="admin-sidebar-link" data-tooltip="Customers"><CustomersIcon /><span>Customers</span></NavLink>
        <NavLink to="/admin/abandoned-carts" className="admin-sidebar-link" data-tooltip="Abandoned Carts"><AbandonedCartIcon /><span>Abandoned Carts</span></NavLink>
        <hr />
        <NavLink to="/admin/sales" className="admin-sidebar-link" data-tooltip="Sales"><MarketingIcon /><span>Sales</span></NavLink>
        <NavLink to="/admin/coupons" className="admin-sidebar-link" data-tooltip="Coupons"><CouponsIcon /><span>Coupons</span></NavLink>
        {/* NEW: AI Assistant Link */}
        <NavLink to="/admin/ai-assistant" className="admin-sidebar-link" data-tooltip="AI Assistant"><AiAssistantIcon /><span>AI Assistant</span></NavLink>
        <hr />
        <NavLink to="/admin/recycle-bin" className="admin-sidebar-link" data-tooltip="Recycle Bin"><RecycleBinIcon /><span>Recycle Bin</span></NavLink>
      </nav>
      <div className="sidebar-footer">
        <Link to="/" className="back-to-home-btn-sidebar" data-tooltip="Back to Home">
          <HomeIcon />
          <span>Back to Home</span>
        </Link>
         <button className="sidebar-toggle-btn" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} data-tooltip="Toggle Menu">
            <SidebarToggleIcon />
        </button>
      </div>
    </>
  );

  return (
    <div className={`admin-container-v4 ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className={`admin-sidebar-v4 ${isMobileMenuOpen ? 'open' : ''}`}>
        <SidebarContent isMobile={isMobileMenuOpen} />
      </aside>
      {isMobileMenuOpen && <div className="admin-backdrop" onClick={() => setIsMobileMenuOpen(false)}></div>}

      <main className="admin-main-content">
        <header className="admin-mobile-header">
          <button className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(true)}>
            <MenuIcon />
          </button>
          
          <Link to="/" className="admin-brand-v4-mobile">
            <span className="brand-text mobile-brand-text">Admin Panel Dashboard</span>
          </Link>

          <div style={{ width: '40px' }}></div>
        </header>

        <div className="admin-page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminPage;

