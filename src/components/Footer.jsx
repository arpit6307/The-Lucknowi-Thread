import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, InputGroup, Modal } from 'react-bootstrap';

// Inline SVG Icons for social media
const InstagramIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417 1.417c-.198.507-.333 1.09-.372 1.942C.01 5.556 0 5.829 0 8s.01 2.444.048 3.297c.04.852.174 1.435.372 1.942.272.692.63 1.148 1.417 1.417.507.198 1.09.333 1.942.372C5.556 15.99 5.829 16 8 16s2.444-.01 3.297-.048c.852-.04 1.435-.174 1.942-.372a3.9 3.9 0 0 0 1.417-1.417c.198-.507.333-1.09.372-1.942C15.99 10.444 16 10.171 16 8s-.01-2.444-.048-3.297c-.04-.852-.174-1.435-.372-1.942a3.9 3.9 0 0 0-1.417-1.417c-.507-.198-1.09-.333-1.942-.372C10.444.01 10.171 0 8 0zm0 1.442c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.599.92c.11.282.24.705.275 1.486.039.843.047 1.096.047 3.232s-.008 2.389-.047 3.232c-.035.78-.166 1.204-.275 1.486a2.5 2.5 0 0 1-.599.92 2.5 2.5 0 0 1-.92.599c-.282.11-.705.24-1.486.275-.843.039-1.096.047-3.232.047s-2.389-.008-3.232-.047c-.78-.035-1.204-.166-1.486-.275a2.5 2.5 0 0 1-.92-.599 2.5 2.5 0 0 1-.599-.92c-.11-.282-.24-.705-.275-1.486-.039-.843-.047-1.096-.047-3.232s.008-2.389.047-3.232c.035-.78.166-1.204.275-1.486.145-.373.319-.64.599-.92s.546-.453.92-.599c.282-.11.705-.24 1.486-.275.843-.039 1.096-.047 3.232-.047zM8 4.865a3.135 3.135 0 1 0 0 6.27 3.135 3.135 0 0 0 0-6.27zM8 6.31a1.69 1.69 0 1 1 0 3.38 1.69 1.69 0 0 1 0-3.38z"/>
        <path d="M12.5 4.865a.9.9 0 1 0 0-1.8.9.9 0 0 0 0 1.8z"/>
    </svg>
);

const FacebookIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
        <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05S0 3.603 0 8.049c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951"/>
    </svg>
);

const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
        <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z"/>
    </svg>
);

const Footer = ({ showToast }) => {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [email, setEmail] = useState('');
  const [validated, setValidated] = useState(false);

  const handleSubscribe = (event) => {
    const form = event.currentTarget;
    event.preventDefault();
    if (form.checkValidity() === false) {
      event.stopPropagation();
    } else {
      showToast('Thank you for subscribing!', 'success');
      setEmail('');
      setValidated(false);
    }
    setValidated(true);
  };

  return (
    <>
      <footer className="footer-redesigned">
        <Container>
          <div className="footer-main">
            <Row className="gy-4">
              <Col lg={4} md={12} className="footer-col-brand">
                <h5 className="font-cormorant">The Lucknowi Thread</h5>
                <p className="small">Celebrating the timeless beauty and heritage of traditional Indian embroidery passed down through generations.</p>
                <div className="footer-social-icons-v2">
                    <a href="https://www.instagram.com/the_lucknowi_thread?igsh=dDJsOHhqNnBrMDlr&utm_source=qr" aria-label="Instagram"><InstagramIcon/></a>
                    <a href="https://www.facebook.com/share/1AmBNXRop5/" aria-label="Facebook"><FacebookIcon/></a>
                    <a href="https://x.com/LucknowiThe?t=sdggOfRGP5so5SeUsYhfyA&s=09" aria-label="Twitter X"><XIcon/></a>
                </div>
              </Col>
              
              <Col lg={2} md={4} xs={6}>
                <h5>Quick Links</h5>
                <ul className="list-unstyled">
                  <li><a href="/#about">About Us</a></li>
                  <li><a href="/#gallery">Gallery</a></li>
                  <li><a href="/#contact">Contact</a></li>
                  <li><a href="/creations">Shop</a></li>
                </ul>
              </Col>
              
              <Col lg={2} md={4} xs={6}>
                <h5>Support</h5>
                <ul className="list-unstyled">
                  <li><Button variant="link" onClick={() => setShowPrivacy(true)}>Privacy Policy</Button></li>
                  <li><Button variant="link" onClick={() => setShowTerms(true)}>Terms of Service</Button></li>
                  <li><a href="#faq">FAQs</a></li>
                </ul>
              </Col>

              <Col lg={4} md={4}>
                <h5>Stay Connected</h5>
                <p className="small">Subscribe to our newsletter for updates and exclusive offers.</p>
                <Form noValidate validated={validated} onSubmit={handleSubscribe}>
                  <InputGroup className="footer-subscribe-group-v2">
                    <Form.Control
                      type="email"
                      placeholder="Your email address"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="footer-input-v2"
                    />
                    <Button type="submit" className="footer-btn-v2">Subscribe</Button>
                  </InputGroup>
                </Form>
              </Col>
            </Row>
          </div>
          <div className="footer-sub">
             <p className="small mb-0">&copy; {new Date().getFullYear()} The Lucknowi Thread. All rights reserved.</p>
             <p className="small mb-0">Developed with ❤️ by Arpit Singh Yadav & Rituraj srivastava</p>
          </div>
        </Container>
      </footer>

      {/* Privacy Policy Modal */}
      <Modal show={showPrivacy} onHide={() => setShowPrivacy(false)} centered size="lg" scrollable>
        <Modal.Header closeButton>
          <Modal.Title className="font-cormorant">Privacy Policy</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p><strong>Effective Date:</strong> September 25, 2025</p>
          <h5>1. Introduction</h5>
          <p>Welcome to The Lucknowi Thread. We are committed to protecting your privacy and ensuring that your personal information is handled in a safe and responsible manner. This Privacy Policy outlines how we collect, use, and protect your information when you visit our website.</p>
          
          <h5>2. Information We Collect</h5>
          <ul>
            <li><strong>Personal Information:</strong> We collect personal information you provide to us when you create an account, place an order, or subscribe to our newsletter. This includes your name, email address, shipping address, and phone number.</li>
            <li><strong>Non-Personal Information:</strong> We automatically collect non-personal information like your IP address, browser type, and browsing patterns to improve our website and services.</li>
          </ul>

          <h5>3. How We Use Your Information</h5>
          <p>Your information is used to:</p>
          <ul>
            <li>Process and fulfill your orders.</li>
            <li>Communicate with you about your orders and our new products.</li>
            <li>Improve our website and customer experience.</li>
            <li>Send you promotional materials, if you have opted in.</li>
          </ul>
          
          <h5>4. Data Sharing</h5>
          <p>We do not sell or trade your personal information. We may share your information with trusted third parties who assist us in operating our website, such as shipping partners and payment processors, only for the purpose of providing services to you.</p>

          <h5>5. Data Security</h5>
          <p>We implement a variety of security measures to maintain the safety of your personal information. However, no method of transmission over the Internet is 100% secure.</p>

          <h5>6. Your Rights</h5>
          <p>You have the right to access, correct, or delete your personal information at any time by contacting us.</p>

          <h5>7. Contact Us</h5>
          <p>If you have any questions regarding this privacy policy, you may contact us at: <a href="mailto:riturajswaroop2527@gmail.com">riturajswaroop2527@gmail.com</a>.</p>
        </Modal.Body>
      </Modal>

      {/* Terms of Service Modal */}
      <Modal show={showTerms} onHide={() => setShowTerms(false)} centered size="lg" scrollable>
        <Modal.Header closeButton>
          <Modal.Title className="font-cormorant">Terms of Service</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p><strong>Last Updated:</strong> September 25, 2025</p>
          <h5>1. Agreement to Terms</h5>
          <p>By accessing or using our website, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, then you may not access the website.</p>
          
          <h5>2. User Accounts</h5>
          <p>When you create an account with us, you must provide information that is accurate and complete. You are responsible for safeguarding your password and for any activities or actions under your password.</p>

          <h5>3. Products and Pricing</h5>
          <p>We make every effort to display as accurately as possible the colors and images of our products. We cannot guarantee that your computer monitor's display of any color will be accurate. Prices for our products are subject to change without notice.</p>

          <h5>4. Intellectual Property</h5>
          <p>The Service and its original content, features, and functionality are and will remain the exclusive property of The Lucknowi Thread. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of The Lucknowi Thread.</p>

          <h5>5. Limitation of Liability</h5>
          <p>In no event shall The Lucknowi Thread, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages arising out of your use of the website.</p>
          
          <h5>6. Governing Law</h5>
          <p>These Terms shall be governed and construed in accordance with the laws of India, with exclusive jurisdiction in the courts of Lucknow, Uttar Pradesh.</p>

          <h5>7. Contact Us</h5>
          <p>If you have any questions about these Terms, please contact us at: <a href="mailto:riturajswaroop2527@gmail.com">riturajswaroop2527@gmail.com</a>.</p>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Footer;

