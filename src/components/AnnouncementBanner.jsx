import React, { useState, useEffect, useMemo } from 'react';
import { Container, Badge } from 'react-bootstrap'; // Removed Tooltip, OverlayTrigger
import { Link } from 'react-router-dom';
import { doc, getDoc, collection, query, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase.js'; 
import { onAuthStateChanged } from 'firebase/auth'; 

// --- SVG ICONS ---
// Benefit: High quality, scalable, and styled with CSS

const ClipboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
    <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
    <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
    <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022z"/>
  </svg>
);


const AnnouncementBanner = () => {
  const [saleData, setSaleData] = useState(null);
  const [couponData, setCouponData] = useState(null);
  const [isSaleActive, setIsSaleActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [hasSaleEnded, setHasSaleEnded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchBannerData = async () => {
      try {
        const saleDocRef = doc(db, 'sales', 'currentSale');
        const saleSnap = await getDoc(saleDocRef);

        if (saleSnap.exists() && saleSnap.data().isActive) {
          setSaleData(saleSnap.data());
        } else {
          setHasSaleEnded(true);
        }

        const couponsQuery = query(collection(db, 'coupons'), limit(1));
        const couponsSnapshot = await getDocs(couponsQuery);
        if (!couponsSnapshot.empty) {
          setCouponData(couponsSnapshot.docs[0].data());
        }

      } catch (error) {
        console.error("Error fetching banner data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBannerData();
  }, []);

  useEffect(() => {
    if (!saleData) return;

    let timer;

    const checkSaleStatus = () => {
        const now = new Date();
        const saleStartDate = new Date(saleData.startDate);
        const saleEndDate = new Date(saleData.endDate);

        if (now >= saleStartDate && now <= saleEndDate) {
            setIsSaleActive(true); setHasSaleEnded(false); if (timer) clearInterval(timer);
        } else if (now > saleEndDate) {
            setIsSaleActive(false); setHasSaleEnded(true); if (timer) clearInterval(timer);
        } else {
            setIsSaleActive(false); setHasSaleEnded(false);
            const difference = saleStartDate - now;
            setTimeLeft({
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            });
        }
    };

    checkSaleStatus();

    if (new Date() < new Date(saleData.startDate)) {
        timer = setInterval(checkSaleStatus, 1000);
    }

    return () => { if (timer) clearInterval(timer); };
  }, [saleData]);

  const handleCopy = () => {
      if (!couponData || isCopied) return;
      navigator.clipboard.writeText(couponData.code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); 
  };

  const animatedThreads = useMemo(() => (
    <div className="thread-animation">
      {[...Array(15)].map((_, i) => <div key={i} className="thread" style={{'--i': i}}></div>)}
    </div>
  ), []);

  if (loading || hasSaleEnded || !saleData) {
    return null;
  }

  return (
    <section id="sale-banner" className="embroidery-banner-section" data-aos="fade-up">
      {animatedThreads}
      <Container className="text-center position-relative">
        <h2 className="font-cormorant display-4 stitched-text" data-text={saleData.saleName}>
          {saleData.saleName}
        </h2>
        
        <p className="lead banner-subtitle">
          {isSaleActive ? "The wait is over! Our exclusive offers are now live." : "An artisanal celebration begins soon. Get ready!"}
        </p>

        {isSaleActive ? (
          <Link to="/creations" className="btn-custom festive-btn-v2 mb-4">
            Shop The Collection
          </Link>
        ) : (
          <div className="embroidery-countdown mt-4">
            <div className="countdown-block"><span className="countdown-number">{String(timeLeft.days).padStart(2, '0')}</span><span className="countdown-label">Days</span></div>
            <div className="countdown-block"><span className="countdown-number">{String(timeLeft.hours).padStart(2, '0')}</span><span className="countdown-label">Hours</span></div>
            <div className="countdown-block"><span className="countdown-number">{String(timeLeft.minutes).padStart(2, '0')}</span><span className="countdown-label">Minutes</span></div>
            <div className="countdown-block"><span className="countdown-number">{String(timeLeft.seconds).padStart(2, '0')}</span><span className="countdown-label">Seconds</span></div>
          </div>
        )}
        
        {saleData.discountTiers?.length > 0 && (
            <div className="mt-4">
                <h5 className="text-white mb-3">{isSaleActive ? 'Live Offers:' : 'Offers to Look Forward To:'}</h5>
                <div className="d-flex justify-content-center flex-wrap gap-2">
                    {saleData.discountTiers.map((tier, index) => (
                        <Badge key={index} pill bg="light" text="dark" className="p-2 px-3 fs-6">
                            {tier.discountPercent}% OFF on orders above ₹{tier.minSpend}
                        </Badge>
                    ))}
                </div>
            </div>
        )}

        {/* --- NEW CSS & SVG DRIVEN COUPON DESIGN --- */}
        {currentUser && couponData && (
          <div className="mt-4">
            <p className="text-white mb-2" style={{ opacity: 0.9 }}>
              Exclusive offer for you!
            </p>
            <div
                className={`coupon-badge ${isCopied ? 'copied' : ''}`}
                onClick={handleCopy}
                role="button"
                tabIndex="0"
                aria-label="Copy coupon code"
                onKeyPress={(e) => e.key === 'Enter' && handleCopy()}
            >
                <div className="coupon-text">
                    CODE: <strong>{couponData.code}</strong>
                </div>
                <div className="coupon-icon">
                    {isCopied ? <CheckIcon /> : <ClipboardIcon />}
                </div>
                <div className="copy-tooltip">{isCopied ? 'Copied!' : 'Copy'}</div>
            </div>
          </div>
        )}

      </Container>
    </section>
  );
};

export default AnnouncementBanner;
