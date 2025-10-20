import React, { useState } from 'react';
import { Container } from 'react-bootstrap';

// Yeh ek custom icon hai jo hum CSS se banayenge
const ChevronIcon = () => (
  <svg className="faq-chevron-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
    <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
  </svg>
);

const FAQ = () => {
  const faqData = [
    {
      question: "What is the art of Chikankari?",
      answer: "Chikankari is a traditional and delicate hand embroidery style from Lucknow, India. Known for its intricate and elegant thread work, it's an art form passed down through generations, weaving stories into fabric."
    },
    {
      question: "How should I care for these garments?",
      answer: "We recommend a gentle hand wash in cold water with a mild detergent. Avoid harsh scrubbing. Dry the garment in the shade to prevent fading and iron on the reverse side to protect the delicate embroidery."
    },
    {
      question: "Are all your products genuinely handmade?",
      answer: "Yes, absolutely. Every piece at The Lucknowi Thread is a testament to craftsmanship, handcrafted by skilled artisans. This means each item is unique and may have slight variations, which is the soul of handmade products."
    },
    {
      question: "What is your shipping promise?",
      answer: "We ship all over India. Orders are typically dispatched within 2-3 business days. Delivery times vary from 5-7 business days depending on your location. We offer complimentary shipping on all orders above ₹1000."
    },
    {
      question: "Can I return or exchange a product?",
      answer: "We offer a 7-day return and exchange policy for unused and undamaged products with original tags intact. Please visit our 'Terms of Service' for more details or contact our support team for a seamless process."
    }
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  const handleToggle = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-5 faq-masterpiece-section">
      <Container data-aos="fade-up">
        <div className="text-center mb-5">
          <h2 className="font-cormorant display-4">Answers Unveiled</h2>
          <p className="lead-text-muted">A tapestry of information, woven for you.</p>
        </div>
        
        <div className="faq-unfolding-container">
          {faqData.map((item, index) => (
            <div 
              key={index}
              className={`faq-fabric-roll ${activeIndex === index ? 'unfolded' : ''}`}
              onClick={() => handleToggle(index)}
            >
              <div className="faq-question-layer">
                <span className="question-text">{item.question}</span>
                <ChevronIcon />
              </div>
              <div className="faq-answer-layer">
                <div className="answer-content">
                  {item.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default FAQ;