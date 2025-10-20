import React from 'react';
import { Container, Row, Col, Card, Carousel } from 'react-bootstrap';
import { Link } from 'react-router-dom';

// Gallery data
const galleryImages = [
  { 
    src: "https://firebasestorage.googleapis.com/v0/b/the-lucknowi-thread.firebasestorage.app/o/1.jpg?alt=media&token=b1323976-0d2b-4376-9507-61c43f2675d7", 
    title: "Classic White", 
    aosDelay: "0" 
  },
  { 
    src: "https://firebasestorage.googleapis.com/v0/b/the-lucknowi-thread.firebasestorage.app/o/2.jpg?alt=media&token=a27f4913-b132-4486-8218-7f5c277771e7", 
    title: "Royal Blue", 
    aosDelay: "100" 
  },
  { 
    src: "https://firebasestorage.googleapis.com/v0/b/the-lucknowi-thread.firebasestorage.app/o/3.jpg?alt=media&token=acdf0b5b-ff16-451c-a026-3c89f4ab0409", 
    title: "Pastel Green", 
    aosDelay: "200" 
  },
  { 
    src: "https://firebasestorage.googleapis.com/v0/b/the-lucknowi-thread.firebasestorage.app/o/4.jpg?alt=media&token=ea5c7477-7d94-4663-b46a-7c1dd7245aca", 
    title: "Elegant Black", 
    aosDelay: "300" 
  }
];

const Gallery = () => {
  return (
    <section id="gallery" className="gallery-section">
      <Container>
        <div className="text-center" data-aos="fade-up">
            <h2 className="font-cormorant display-4">Our Collection</h2>
            <p className="lead text-muted mx-auto" style={{ maxWidth: '600px' }}>
                A glimpse into our curated collection where every piece is a work of art, handcrafted with passion.
            </p>
        </div>

        {/* Mobile View: Vertical Auto-sliding Carousel */}
        <Carousel 
          fade 
          controls={false} 
          indicators={true} 
          interval={3000} 
          className="d-lg-none mt-4 gallery-carousel-mobile-v2"
        >
          {galleryImages.map((item, idx) => (
            <Carousel.Item key={idx}>
              <Link to="/creations" className="gallery-card-link">
                <Card className="gallery-carousel-card-v2">
                  <Card.Img src={item.src} alt={item.title} className="carousel-card-img-v2" />
                </Card>
              </Link>
            </Carousel.Item>
          ))}
        </Carousel>

        {/* Desktop View: Grid Layout with Hover Effect */}
        <Row xs={1} sm={2} lg={4} className="g-4 mt-4 d-none d-lg-flex">
          {galleryImages.map((item, idx) => (
            <Col key={idx} data-aos="fade-up" data-aos-delay={item.aosDelay}>
              <Link to="/creations" className="gallery-card-link">
                <Card className="gallery-card-v2">
                  <div className="card-img-wrapper">
                      <Card.Img src={item.src} alt={item.title} className="card-img" />
                  </div>
                  <Card.ImgOverlay className="card-img-overlay">
                    <h4 className="overlay-title">{item.title}</h4>
                  </Card.ImgOverlay>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>

        <div className="text-center mt-4">
          <Link to="/creations" className="btn-custom">Explore All Creations</Link>
        </div>
      </Container>
    </section>
  );
};

export default Gallery;

