import React from 'react';
import { Container, Nav } from 'react-bootstrap';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

// Sidebar mein behtar visuals ke liye SVG Icon Components.
// Yeh simple functional components hain jo SVG elements return karte hain.
const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
    <path d="M4 11H2V4h2zM8 11H6V1h2zm4 0h-2V7h2zM12 3V0H0v16h16V3zM1 15V1h10v3h4v11z"/>
  </svg>
);
const ProductsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1m3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4zM2 5h12v9a.5.5 0 0 1-.5.5H2.5a.5.5 0 0 1-.5-.5z"/>
  </svg>
);
const OrdersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-box-seam" viewBox="0 0 16 16">
        <path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5l2.404.961L10.404 2l-2.218-.887zm3.564 1.426L5.596 5 8 5.961 14.154 3.5l-2.404-.961zm3.25 1.7-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923l6.5 2.6zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464L7.443.184z"/>
    </svg>
);
const CouponsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
    <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"/>
    <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6m0-1a2 2 0 1 1 0-4 2 2 0 0 1 0 4"/>
  </svg>
);

const AdminPage = () => {
  // useLocation hook se current URL path milta hai, jisse active link ko highlight kar sakte hain.
  const location = useLocation();

  return (
    <Container fluid style={{ paddingTop: '5rem', paddingBottom: '5rem', background: '#f9fafb' }}>
      <h2 className="font-cormorant display-4 text-center mb-5">Admin Panel</h2>
      
      {/* admin-wrapper ek flex container hai jo sidebar aur main content ko side-by-side rakhta hai. */}
      <div className="admin-wrapper">
        
        {/* Sidebar Navigation */}
        <aside className="admin-sidebar">
          {/* LinkContainer ko NavLink se replace kar diya gaya hai error theek karne ke liye */}
          <Nav className="flex-column">
            <NavLink to="/admin/dashboard" className="nav-link">
              <DashboardIcon /> 
              <span>Dashboard</span>
            </NavLink>
            
            <NavLink to="/admin/products" className="nav-link">
              <ProductsIcon /> 
              <span>Products</span>
            </NavLink>
            
            <NavLink to="/admin/orders" className="nav-link">
              <OrdersIcon /> 
              <span>Manage Orders</span>
            </NavLink>
            
            <NavLink to="/admin/coupons" className="nav-link">
              <CouponsIcon /> 
              <span>Coupons</span>
            </NavLink>
          </Nav>
        </aside>
        
        {/* Main Content Area */}
        <main className="admin-content">
          {/* Outlet component yahan par nested routes (jaise AdminDashboard, ProductManagement, etc.) ko render karta hai. */}
          <Outlet />
        </main>
      </div>
    </Container>
  );
};

export default AdminPage;

