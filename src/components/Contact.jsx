import React from 'react';
import { Container, Row, Col, Button, Form } from "react-bootstrap";
import emailjs from "emailjs-com";

// --- Icons ---
const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
        <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z"/>
    </svg>
);
const PhoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
    </svg>
);

const Contact = ({ showToast }) => {

  const sendEmail = (e) => {
    e.preventDefault();

    // --- DEBUGGING: Browser console mein check karein ki keys aa rahi hain ya nahi ---
    const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    console.log("Checking Environment Variables...");
    console.log("Service ID:", SERVICE_ID ? "Loaded" : "MISSING!");
    console.log("Template ID:", TEMPLATE_ID ? "Loaded" : "MISSING!");
    console.log("Public Key:", PUBLIC_KEY ? "Loaded" : "MISSING!");
    // --- End of Debugging ---

    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
        console.error("EmailJS credentials .env file mein nahi mil rahi hain. Server restart karein.");
        showToast('Configuration error. Please contact support.', 'danger');
        return;
    }

    // Ismein 'e.target' form ka poora data bhejta hai
    emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, e.target, PUBLIC_KEY)
      .then((result) => {
          console.log("SUCCESS!", result.status, result.text);
          showToast('Message sent successfully!', 'success');
          e.target.reset();
      }, (error) => {
          // YEH SABSE ZAROORI HAI: Browser console mein asli error yahan dikhegi
          console.error("EMAILJS FAILED...", error);
          showToast(`Error: ${error.text || 'Failed to send message.'}`, 'danger');
      });
  };

  return (
    <section id="contact" className="contact-section-unique">
      <Container>
        <div className="contact-artistic-card" data-aos="fade-up" data-aos-duration="1000">
            <Row className="g-0">
                <Col lg={5} className="info-side">
                    {/* ... (baaki ka design code waisa hi hai) ... */}
                    <div className="info-content">
                        <h2 className="font-cormorant display-5">Let's Weave a Story</h2>
                        <p className="lead-text">
                            Your thoughts and queries are the threads that help us grow. We are here to listen and assist you in every way possible.
                        </p>
                        <div className="contact-details-unique">
                            <div className="contact-item">
                                <PhoneIcon />
                                <a href="tel:+918887547804">+91 88875 47804</a>
                            </div>
                            <div className="contact-item">
                                <MailIcon />
                                <a href="mailto:contact@thelucknowithread.co.in">contact@thelucknowithread.co.in</a>
                            </div>
                        </div>
                    </div>
                </Col>
                <Col lg={7} className="form-side">
                    <div className="form-content">
                        <h3 className="font-cormorant mb-4">Send a Message</h3>
                        <Form onSubmit={sendEmail}>
                            <Row>
                                <Col md={6} className="mb-4">
                                <Form.Group className="form-group-v2">
                                        {/* IMPORTANT: 'name' attribute EmailJS ke liye zaroori hai */}
                                        <Form.Control type="text" name="user_name" placeholder=" " required />
                                        <Form.Label>Your Name</Form.Label>
                                    </Form.Group>
                                </Col>
                                <Col md={6} className="mb-4">
                                    <Form.Group className="form-group-v2">
                                        <Form.Control type="email" name="user_email" placeholder=" " required />
                                        <Form.Label>Your Email</Form.Label>
                                    </Form.Group>
                                </Col>
                                <Col md={12} className="mb-4">
                                    <Form.Group className="form-group-v2">
                                        <Form.Control as="textarea" name="message" placeholder=" " style={{ height: '150px' }} required />
                                        <Form.Label>Your Message</Form.Label>
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Button type="submit" className="btn-custom w-100 mt-3 py-3 fs-5">
                                Send Message
                            </Button>
                        </Form>
                    </div>
                </Col>
            </Row>
        </div>
      </Container>
    </section>
  );
};

export default Contact;