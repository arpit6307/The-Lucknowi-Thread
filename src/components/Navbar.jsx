import React, { useState, useEffect } from 'react';
import { Badge, Container, Nav, NavDropdown, Navbar } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

// Inline SVG Icons
const CartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
        <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l1.313 7h8.17l1.313-7H3.102zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
    </svg>
);
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
    </svg>
);


const AppNavbar = ({ user, userRole, cartCount }) => {
  const [expanded, setExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
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
    setExpanded(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Navbar
      expand="lg"
      sticky="top"
      className={`navbar-redesigned ${isScrolled ? 'navbar-scrolled' : ''}`}
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
    >
      <Container>
        <Navbar.Brand as={Link} to="/" onClick={() => setExpanded(false)}>
          The Lucknowi Thread
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="ms-auto align-items-center">
            <Nav.Link onClick={() => handleScrollToSection('about')}>About</Nav.Link>
            <Nav.Link onClick={() => handleScrollToSection('history')}>History</Nav.Link>
            <Nav.Link onClick={() => handleScrollToSection('gallery')}>Gallery</Nav.Link>
            <Nav.Link onClick={() => handleScrollToSection('contact')}>Contact</Nav.Link>

            {user ? (
              <>
                <Nav.Link as={Link} to="/cart" onClick={() => setExpanded(false)} className="nav-icon-link">
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
                    <NavDropdown.Item as={Link} to="/admin/dashboard" onClick={() => setExpanded(false)}>
                      Admin Panel
                    </NavDropdown.Item>
                  )}
                  <NavDropdown.Item as={Link} to="/profile" onClick={() => setExpanded(false)}>
                    My Profile
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/order-history" onClick={() => setExpanded(false)}>
                    Order History
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/wishlist" onClick={() => setExpanded(false)}>
                    My Wishlist
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={() => { handleLogout(); setExpanded(false); }}>
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              <Nav.Link as={Link} to="/login" className="btn btn-primary btn-login ms-lg-2 mt-2 mt-lg-0">
                Login
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;
