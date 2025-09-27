import React, { useState, useEffect } from 'react';
import { Container, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const AnnouncementBanner = () => {
  const [isSaleActive, setIsSaleActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState({});
  const [hasSaleEnded, setHasSaleEnded] = useState(false);

  // Sale kee taareekhen yahaan set karen
  const saleStartDate = new Date('2025-09-22T00:00:00');
  const saleEndDate = new Date('2025-10-02T23:59:59');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      
      if (now >= saleStartDate && now <= saleEndDate) {
        // Sale chal rahee hai
        setIsSaleActive(true);
        setHasSaleEnded(false);
        clearInterval(timer);
      } else if (now > saleEndDate) {
        // Sale khatm ho chukee hai
        setIsSaleActive(false);
        setHasSaleEnded(true);
        clearInterval(timer);
      } else {
        // Sale shuroo hone vaalee hai (countdown)
        const difference = saleStartDate - now;
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds });
        setIsSaleActive(false);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Agar sale khatm ho chukee hai to banner na dikhaen
  if (hasSaleEnded) {
    return null;
  }

  return (
    <section id="navratri-sale" className="announcement-banner" data-aos="fade-up">
        <Container className="text-center position-relative">
            <h2 className="font-cormorant display-4">Navratri Festive Sale</h2>
            
            {isSaleActive ? (
                <p className="lead">The wait is over! Our exclusive Navratri offers are now live. Shop your favorites now!</p>
            ) : (
                <p className="lead">Get ready for exclusive offers on our most beautiful Chikankari collection. The celebration begins soon!</p>
            )}

            {isSaleActive ? (
                <Link to="/creations" className="btn-custom festive-btn">
                  Shop Now
                </Link>
            ) : (
                <div className="countdown-timer mt-4">
                    <div className="countdown-item">
                        <span>{timeLeft.days || 0}</span> Days
                    </div>
                    <div className="countdown-item">
                        <span>{timeLeft.hours || 0}</span> Hours
                    </div>
                    <div className="countdown-item">
                        <span>{timeLeft.minutes || 0}</span> Minutes
                    </div>
                    <div className="countdown-item">
                        <span>{timeLeft.seconds || 0}</span> Seconds
                    </div>
                </div>
            )}
        </Container>
    </section>
  );
};

export default AnnouncementBanner;

