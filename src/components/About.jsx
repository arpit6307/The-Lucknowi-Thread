import React from 'react';
import { Container, Row, Col, Image } from 'react-bootstrap';

// Simple SVG icon components for features
const HandIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
        <path d="M11.5,4.062C11.5,2.923,10.577,2,9.438,2H4.5A2.5,2.5,0,0,0,2,4.5v7A2.5,2.5,0,0,0,4.5,14h5.188c1.138,0,2.062-0.923,2.062-2.062V9.438c1.138,0,2.062-0.923,2.062-2.062S12.638,5.312,11.5,5.312V4.062z M4.5,3h4.938C10.021,3,10.5,3.479,10.5,4.062V5.312h-6V4.5C4.5,3.673,4.327,3,4.5,3z M9.688,13H4.5C3.122,13,3,11.878,3,11.5v-7C3,3.122,3.122,2,4.5,2h4.938C10.878,2,12,3.122,12,4.5v.188C10.862,4.688,10,5.612,10,6.75v2.5c0,1.138,0.862,2.062,2,2.062h.188C12.188,12.878,11.067,13,9.688,13z M13,6.75c0,0.584-0.478,1.062-1.062,1.062H11.5V5.688h0.438C12.522,5.688,13,6.166,13,6.75z"/>
    </svg>
);
const PinIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 0a5.53 5.53 0 0 1 5.53 5.53c0 4.1-5.53 10.47-5.53 10.47S2.47 9.63 2.47 5.53A5.53 5.53 0 0 1 8 0m0 2C4.97 2 4.47 4.97 4.47 5.53c0 .56.5 3.53 3.53 7.74 3.03-4.21 3.53-7.18 3.53-7.74C11.53 4.97 11.03 2 8 2m0 2.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3"/>
    </svg>
);
const FabricIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
        <path d="M1.375.375A.375.375 0 0 0 1 0v1a.375.375 0 0 0 .375.375h13.25A.375.375 0 0 0 15 1V0a.375.375 0 0 0-.375-.375zM15 15.375a.375.375 0 0 0 .375.375V16a.375.375 0 0 0-.375-.375H1.375A.375.375 0 0 0 1 16v-1a.375.375 0 0 0 .375.375z"/><path d="M12 1.558V3.5h1.5v3h-1.5V8.5h1.5v3h-1.5v1.942l-2-1.155v-2.58l-2-1.154v-2.58l2-1.155v-2.58zM4 3.5v5h1.5v-5zm2 1.155L8 3.5v2.58l-2 1.154zM8 8.5l-2 1.155V7.07l2-1.155zm-2 2.308L8 11.962v2.58l-2-1.155z"/>
    </svg>
);


const About = () => (
  <section id="about" className="about-section">
    <Container>
      {/* Section 1: What is Chikankari? */}
      <Row className="align-items-center g-5">
        <Col lg={6} data-aos="fade-right">
          <Image src="https://i.postimg.cc/6QPxQbyH/Gemini-Generated-Image-drnyetdrnyetdrny.jpg" alt="Chikankari hand embroidery close-up" rounded fluid className="shadow-lg about-main-image" />
        </Col>
        <Col lg={6} data-aos="fade-left">
          <h2 className="font-cormorant display-4 mb-4">The Soul of Lucknow</h2>
          <p className="lead text-muted mb-4">
            Chikankari is not just an embroidery; it's a centuries-old art form whispered through threads of cotton and silk. Originating from Lucknow, this delicate and masterfully handcrafted embroidery is celebrated for its elegance and the story it tells of Mughal-era royalty and timeless Indian heritage.
          </p>
          <p>
            Each piece from The Lucknowi Thread is a testament to the artisan's skill, featuring a variety of intricate stitches that create a beautiful, shadow-like effect on fine fabrics.
          </p>
        </Col>
      </Row>

      {/* Section 2: Our Promise */}
      <div className="about-features-section">
        <Row className="text-center">
            <Col><h3 className="font-cormorant display-5">Our Promise to You</h3></Col>
        </Row>
        <Row className="mt-5">
          {/* Feature 1 */}
          <Col md={4} className="mb-4" data-aos="fade-up">
            <div className="feature-item text-center">
                <div className="feature-icon-wrapper"><HandIcon /></div>
                <h4 className="font-cormorant mt-3">Purely Handcrafted</h4>
                <p className="text-muted">Every stitch is made by hand by skilled artisans, ensuring no two pieces are exactly alike. We celebrate the beauty of imperfection and human touch.</p>
            </div>
          </Col>
          {/* Feature 2 */}
          <Col md={4} className="mb-4" data-aos="fade-up" data-aos-delay="200">
             <div className="feature-item text-center">
                <div className="feature-icon-wrapper"><PinIcon /></div>
                <h4 className="font-cormorant mt-3">Authentic Lucknowi Art</h4>
                <p className="text-muted">Our craft is rooted in the heart of Lucknow. We work directly with local artisans to preserve the authentic techniques passed down through generations.</p>
            </div>
          </Col>
          {/* Feature 3 */}
          <Col md={4} className="mb-4" data-aos="fade-up" data-aos-delay="400">
             <div className="feature-item text-center">
                <div className="feature-icon-wrapper"><FabricIcon /></div>
                <h4 className="font-cormorant mt-3">Premium Quality Fabrics</h4>
                <p className="text-muted">We believe that exquisite embroidery deserves the finest canvas. We carefully select soft, breathable, and durable fabrics like muslin, silk, and georgette.</p>
            </div>
          </Col>
        </Row>
      </div>
    </Container>
  </section>
);

export default About;
