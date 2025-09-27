import React, { useState, useEffect } from 'react';
import { Badge, Nav, NavDropdown } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

// Icons
const CartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16"><path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l1.313 7h8.17l1.313-7H3.102zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>
);
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/></svg>
);
const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/></svg>
);
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.647 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
);


const AppNavbar = ({ user, userRole, cartCount }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleScrollToSection = (targetId) => {
    setIsMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const NavLinks = () => (
    <>
      <Nav.Link onClick={() => handleScrollToSection('about')} className="drawer-link">About</Nav.Link>
      <Nav.Link onClick={() => handleScrollToSection('history')} className="drawer-link" style={{'--delay': '0.1s'}}>History</Nav.Link>
      <Nav.Link onClick={() => handleScrollToSection('gallery')} className="drawer-link" style={{'--delay': '0.2s'}}>Gallery</Nav.Link>
      <Nav.Link onClick={() => handleScrollToSection('contact')} className="drawer-link" style={{'--delay': '0.3s'}}>Contact</Nav.Link>
    </>
  );

  return (
    <>
      {/* Mobile Bottom Drawer Menu */}
      <div className={`mobile-bottom-drawer ${isMenuOpen ? 'open' : ''}`}>
          <div className="drawer-handle-wrapper" onClick={() => setIsMenuOpen(false)}>
            <div className="drawer-handle"></div>
          </div>
          <div className="drawer-content">
              <Nav className="flex-column text-center">
                  <NavLinks />
              </Nav>
          </div>
      </div>
      {isMenuOpen && <div className="overlay" onClick={() => setIsMenuOpen(false)}></div>}

      {/* Main Navbar */}
      <div className={`navbar-wrapper ${isScrolled ? 'scrolled' : ''}`}>
          {/* Mobile View Toggle */}
          <button className="d-lg-none menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <MenuIcon />
          </button>
          
          <Link to="/" className="navbar-brand-desktop">
              The Lucknowi Thread
          </Link>

          {/* Desktop View Links */}
          <div className="d-none d-lg-block">
            <Nav className="mx-auto">
              <Nav.Link onClick={() => handleScrollToSection('about')}>About</Nav.Link>
              <Nav.Link onClick={() => handleScrollToSection('history')}>History</Nav.Link>
              <Nav.Link onClick={() => handleScrollToSection('gallery')}>Gallery</Nav.Link>
              <Nav.Link onClick={() => handleScrollToSection('contact')}>Contact</Nav.Link>
            </Nav>
          </div>

          <div className="navbar-icons">
          {user ? (
              <>
                <Nav.Link as={Link} to="/cart" className="nav-icon-link">
                  <CartIcon />
                  {cartCount > 0 && <Badge pill bg="danger" className="cart-badge">{cartCount}</Badge>}
                </Nav.Link>
                <NavDropdown 
                    title={<UserIcon />} 
                    id="user-nav-dropdown" 
                    className="user-nav-dropdown"
                    align="end"
                >
                  <NavDropdown.Header>
                    Signed in as:<br/>
                    <strong>{user.displayName || user.email}</strong>
                  </NavDropdown.Header>
                  <NavDropdown.Divider />
                  {userRole === 'admin' && (
                    <NavDropdown.Item as={Link} to="/admin/dashboard">Admin Panel</NavDropdown.Item>
                  )}
                  <NavDropdown.Item as={Link} to="/profile">My Profile</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/order-history">Order History</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/wishlist">My Wishlist</NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              <Nav.Link as={Link} to="/login" className="btn btn-primary btn-login">
                Login
              </Nav.Link>
            )}
          </div>
      </div>
    </>
  );
};

export default AppNavbar;

