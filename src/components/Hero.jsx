import React from 'react';
import { Container, Carousel, Button } from 'react-bootstrap';

// Slider ke liye images
const slides = [
  {
    src: "https://i.postimg.cc/8PtP5hxJ/unnamed.png",
    alt: "Elegant Chikankari Kurti",
    title: "Threads of Tradition, Stitches of Style",
    description: "Discover the timeless elegance of authentic Lucknowi Chikankari, handcrafted with love."
  },
  {
    src: "https://i.postimg.cc/Gp9dN9gJ/Gemini-Generated-Image-czoibtczoibtczoi.jpg",
    alt: "Detailed Chikankari Embroidery",
    title: "Threads of Tradition, Stitches of Style",
    description: "Discover the timeless elegance of authentic Lucknowi Chikankari, handcrafted with love."
  },
  {
    src: "https://i.postimg.cc/xd7nSYWr/Gemini-Generated-Image-dtx1xldtx1xldtx1.jpg",
    alt: "Artisan working on Chikankari",
    title: "Threads of Tradition, Stitches of Style",
    description: "Discover the timeless elegance of authentic Lucknowi Chikankari, handcrafted with love."
  }
];

const Hero = () => {
  return (
    <Carousel fade controls={false} indicators={true} interval={3000} pause={false} className="hero-carousel">
      {slides.map((slide, index) => (
        <Carousel.Item key={index}>
          <div className="carousel-image-container">
            <img
              className="d-block w-100"
              src={slide.src}
              alt={slide.alt}
            />
            <div className="hero-overlay"></div>
          </div>
          <Carousel.Caption className="hero-caption-content text-start">
            <h1 className="display-2 font-cormorant mb-4" data-aos="fade-down">{slide.title}</h1>
            <p className="lead fs-4 mb-5" data-aos="fade-up" data-aos-delay="200">
              {slide.description}
            </p>
            <Button 
              variant="custom" 
              className="btn-custom" 
              data-aos="fade-up" 
              data-aos-delay="400"
              onClick={(e) => { e.preventDefault(); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }); }}>
              Explore Our Collection
            </Button>
          </Carousel.Caption>
        </Carousel.Item>
      ))}
    </Carousel>
  );
};

export default Hero;
