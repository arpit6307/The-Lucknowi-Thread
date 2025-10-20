import React from 'react';
import { Container, Carousel, Button } from 'react-bootstrap';

// Slider ke liye images
const slides = [
  {
    src: "https://firebasestorage.googleapis.com/v0/b/the-lucknowi-thread.firebasestorage.app/o/hero%20section%2FGemini_Generated_Image_a89643a89643a896%20(1).png?alt=media&token=5d7b28c2-476a-43a4-a4c3-10d99093dae4",
    alt: "Elegant Chikankari Kurti",
    title: "Threads of Tradition, Stitches of Style",
    description: "Discover the timeless elegance of authentic Lucknowi Chikankari, handcrafted with love."
  },
  {
    src: "https://firebasestorage.googleapis.com/v0/b/the-lucknowi-thread.firebasestorage.app/o/hero%20section%2FGemini_Generated_Image_a89643a89643a896%20(2).png?alt=media&token=3ace51f7-8df1-47d7-8967-ca9ed6f97e72",
    alt: "Detailed Chikankari Embroidery",
    title: "Threads of Tradition, Stitches of Style",
    description: "Discover the timeless elegance of authentic Lucknowi Chikankari, handcrafted with love."
  },
  {
    src: "https://firebasestorage.googleapis.com/v0/b/the-lucknowi-thread.firebasestorage.app/o/hero%20section%2FGemini_Generated_Image_a89643a89643a896.png?alt=media&token=2ca10cd0-cd07-4fb9-97e2-88a0dd4b2189",
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
