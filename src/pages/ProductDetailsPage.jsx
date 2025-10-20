import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Image, Button, Spinner, Alert, Tabs, Tab, Modal, Form, Card } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '/src/firebase.js';
import CustomLoader from '/src/components/CustomLoader.jsx';
import StarRating from '/src/components/StarRating.jsx';

// --- ICONS (User Provided & Standard) ---
const WishlistIconFill = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor"  viewBox="0 0 16 16"><path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/></svg>;
const WishlistIconOutline = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor"  viewBox="0 0 16 16"><path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-1.114 2.175-.229 4.842 2.226 7.031l3.585 3.585a1 1 0 0 0 1.414 0l3.585-3.585c2.455-2.189 3.34-4.856 2.226-7.031-1.114-2.175-4.2-2.772-5.883-.737L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z"/></svg>;

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" viewBox="0 0 16 16">
      <path fill="#4CAF50" d="M8.002 0h-.004C3.587 0 0 3.588 0 8a7.94 7.94 0 0 0 1.523 4.689l-.997 2.972 3.075-.983A7.93 7.93 0 0 0 8.002 16C12.413 16 16 12.411 16 8s-3.587-8-7.998-8z"></path>
      <path fill="#FAFAFA" d="M12.657 11.297c-.193.545-.959.997-1.57 1.129-.418.089-.964.16-2.802-.602-2.351-.974-3.865-3.363-3.983-3.518-.113-.155-.95-1.265-.95-2.413s.583-1.707.818-1.947c.193-.197.512-.287.818-.287.099 0 .188.005.268.009.235.01.353.024.508.395.193.465.663 1.613.719 1.731.057.118.114.278.034.433-.075.16-.141.231-.259.367-.118.136-.23.24-.348.386-.108.127-.23.263-.094.498.136.23.606.997 1.298 1.613.893.795 1.617 1.049 1.876 1.157.193.08.423.061.564-.089.179-.193.4-.513.625-.828.16-.226.362-.254.574-.174.216.075 1.359.64 1.594.757.235.118.39.174.447.273.056.099.056.564-.137 1.11z"></path>
    </svg>
);

const FacebookIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
      <path fill="#1877f2" d="M1024,512C1024,229.23016,794.76978,0,512,0S0,229.23016,0,512c0,255.554,187.231,467.37012,432,505.77777V660H302V512H432V399.2C432,270.87982,508.43854,200,625.38922,200,681.40765,200,740,210,740,210V336H675.43713C611.83508,336,592,375.46667,592,415.95728V512H734L711.3,660H592v357.77777C836.769,979.37012,1024,767.554,1024,512Z"></path>
      <path fill="#fff" d="M711.3,660,734,512H592V415.95728C592,375.46667,611.83508,336,675.43713,336H740V210s-58.59235-10-114.61078-10C508.43854,200,432,270.87982,432,399.2V512H302V660H432v357.77777a517.39619,517.39619,0,0,0,160,0V660Z"></path>
    </svg>
);

const InstagramIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" viewBox="0 0 16 16">
        <linearGradient id="a" x1="1.464" x2="14.536" y1="14.536" y2="1.464" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFC107"></stop>
            <stop offset=".507" stopColor="#F44336"></stop>
            <stop offset=".99" stopColor="#9C27B0"></stop>
        </linearGradient>
        <path fill="url(#a)" d="M11 0H5a5 5 0 0 0-5 5v6a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5V5a5 5 0 0 0-5-5zm3.5 11c0 1.93-1.57 3.5-3.5 3.5H5c-1.93 0-3.5-1.57-3.5-3.5V5c0-1.93 1.57-3.5 3.5-3.5h6c1.93 0 3.5 1.57 3.5 3.5v6z"></path>
        <linearGradient id="b" x1="5.172" x2="10.828" y1="10.828" y2="5.172" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFC107"></stop>
            <stop offset=".507" stopColor="#F44336"></stop>
            <stop offset=".99" stopColor="#9C27B0"></stop>
        </linearGradient>
        <path fill="url(#b)" d="M8 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 6.5A2.503 2.503 0 0 1 5.5 8c0-1.379 1.122-2.5 2.5-2.5s2.5 1.121 2.5 2.5c0 1.378-1.122 2.5-2.5 2.5z"></path>
        <linearGradient id="c" x1="11.923" x2="12.677" y1="4.077" y2="3.323" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFC107"></stop>
            <stop offset=".507" stopColor="#F44336"></stop>
            <stop offset=".99" stopColor="#9C27B0"></stop>
        </linearGradient>
        <circle cx="12.3" cy="3.7" r=".533" fill="url(#c)"></circle>
    </svg>
);


const ProductDetailsPage = ({ addToCart, isLoggedIn }) => {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [buttonState, setButtonState] = useState('default');
  const [isInWishlist, setIsInWishlist] = useState(false);
  
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);

  const [showSizeGuide, setShowSizeGuide] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!productId) {
        setError("Product ID is missing.");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError('');
      try {
        const productDocRef = doc(db, 'products', productId);
        const productDocSnap = await getDoc(productDocRef);
        
        if (productDocSnap.exists()) {
          const productData = { id: productDocSnap.id, ...productDocSnap.data() };
          setProduct(productData);

          if (isLoggedIn && auth.currentUser) {
            const wishlistRef = doc(db, 'users', auth.currentUser.uid, 'wishlist', productId);
            const wishlistSnap = await getDoc(wishlistRef);
            setIsInWishlist(wishlistSnap.exists());
          } else {
            setIsInWishlist(false);
          }

          const reviewsQuery = query(
              collection(db, 'products', productId, 'reviews'),
              where('status', '==', 'approved'),
              orderBy('timestamp', 'desc')
          );

          const reviewsSnapshot = await getDocs(reviewsQuery);
          const reviewsList = reviewsSnapshot.docs.map(doc => doc.data());
          setReviews(reviewsList);

          if (reviewsList.length > 0) {
            const totalRating = reviewsList.reduce((sum, review) => sum + review.rating, 0);
            setAvgRating(totalRating / reviewsList.length);
          } else {
            setAvgRating(0);
          }
        } else {
          setError('Sorry, this product could not be found. It might have been removed.');
        }
      } catch (err) {
        console.error("Error fetching product details: ", err);
        setError(`Failed to load product details. Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [productId, isLoggedIn]);

  const handleAddToCart = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    // NEW: Check if requested quantity exceeds stock
    if (product && quantity > product.stock) {
        alert(`Sorry, you can only add up to ${product.stock} items.`);
        return;
    }
    setButtonState('adding');
    setTimeout(() => {
      addToCart({ ...product, size: selectedSize, quantity });
      setButtonState('added');
      setTimeout(() => setButtonState('default'), 1500);
    }, 500);
  };
  
  const handleToggleWishlist = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    const wishlistRef = doc(db, 'users', auth.currentUser.uid, 'wishlist', productId);
    if (isInWishlist) {
      await deleteDoc(wishlistRef);
      setIsInWishlist(false);
    } else if(product) {
      await setDoc(wishlistRef, product);
      setIsInWishlist(true);

      await addDoc(collection(db, 'activityFeed'), {
          type: 'wishlist',
          message: `A user added '${product.name}' to their wishlist.`,
          authorId: auth.currentUser.uid,
          timestamp: serverTimestamp()
      });
    }
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = `Check out this beautiful ${product.name} from The Lucknowi Thread!`;
    let shareUrl = '';

    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'instagram':
        navigator.clipboard.writeText(`${text} ${url}`);
        alert('Link copied to clipboard! You can now share it on Instagram.');
        return;
      default:
        return;
    }
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const renderButtonContent = () => {
    switch (buttonState) {
      case 'adding': return <><Spinner as="span" animation="border" size="sm" /> Adding...</>;
      case 'added': return '✓ Added!';
      default: return 'Add to Cart';
    }
  };

  if (loading) return <CustomLoader message="Loading Product..." />;
  
  if (error) {
    return (
      <Container className="text-center py-5">
        <Alert variant="danger">
          <h4>Something Went Wrong</h4>
          <p>{error}</p>
          <Button variant="primary" onClick={() => navigate('/creations')}>Back to Products</Button>
        </Alert>
      </Container>
    );
  }

  if (!product) return null;

  return (
    <>
      <Container className="product-details-section">
        <Row className="g-4 g-lg-5 mt-4">
          <Col lg={6} data-aos="fade-right">
            <Card className="product-image-card">
              <Card.Body className="p-2">
                  <Image src={product.src} alt={product.name} fluid className="product-main-image"/>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={6} data-aos="fade-left">
            <div className="product-info-card h-100">
              <div className="d-flex justify-content-between align-items-start">
                <h2 className="font-cormorant display-5">{product.name}</h2>
                <Button variant="link" onClick={handleToggleWishlist} className={`wishlist-btn-details ${isInWishlist ? 'active' : ''}`}>
                  {isInWishlist ? <WishlistIconFill/> : <WishlistIconOutline />}
                </Button>
              </div>
              
              {reviews.length > 0 && (
                <div className="d-flex align-items-center mb-2">
                  <StarRating rating={avgRating} readOnly={true} />
                  <span className="ms-2 text-muted">({reviews.length} reviews)</span>
                </div>
              )}
              
              <p className="product-price-details display-4">₹{product.price}</p>
              
              {/* NEW: Stock status display */}
              <div className="mb-3">
                {(product.stock > 0) ? (
                    <span className="badge bg-success fs-6">In Stock ({product.stock} left)</span>
                ) : (
                    <span className="badge bg-danger fs-6">Out of Stock</span>
                )}
              </div>
              
              <hr className="my-4" />

              <div className="my-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5>Select Size</h5>
                    <span className="size-guide-link" onClick={() => setShowSizeGuide(true)}>Size Guide</span>
                </div>
                <div className="size-selector-v2">
                  {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
                      <Form.Check key={size} type="radio" id={`size-${size}`}>
                          <Form.Check.Input 
                            type="radio" 
                            name="size" 
                            value={size} 
                            checked={selectedSize === size} 
                            onChange={(e) => setSelectedSize(e.target.value)}
                          />
                          <Form.Check.Label>{size}</Form.Check.Label>
                      </Form.Check>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <h5 className="mb-2">Quantity</h5>
                <div className="quantity-selector-v2">
                  <Button className="qty-btn" onClick={() => setQuantity(prev => Math.max(1, prev - 1))}>-</Button>
                  <span className="qty-display">{quantity}</span>
                  {/* NEW: Prevent quantity from exceeding stock */}
                  <Button className="qty-btn" onClick={() => setQuantity(prev => (product && product.stock ? Math.min(prev + 1, product.stock) : prev + 1))}>+</Button>
                </div>
              </div>

              <div className="d-grid gap-2 mt-auto">
                <Button 
                  variant={buttonState === 'added' ? 'success' : 'primary'}
                  className="btn-custom py-3 fs-5"
                  onClick={handleAddToCart}
                   // NEW: Disable button if out of stock
                  disabled={buttonState !== 'default' || !product.stock || product.stock <= 0}
                >
                  {(!product.stock || product.stock <= 0) ? 'Out of Stock' : renderButtonContent()}
                </Button>
              </div>

              {/* Redesigned Share Buttons */}
              <div className="social-share-container mt-4">
                <span className="share-text me-3">Share this product:</span>
                <div className="share-icons">
                  <a href="#!" className="share-icon-btn whatsapp-btn" onClick={() => handleShare('whatsapp')} aria-label="Share on WhatsApp">
                    <WhatsAppIcon />
                  </a>
                  <a href="#!" className="share-icon-btn facebook-btn" onClick={() => handleShare('facebook')} aria-label="Share on Facebook">
                    <FacebookIcon />
                  </a>
                  <a href="#!" className="share-icon-btn instagram-btn" onClick={() => handleShare('instagram')} aria-label="Share on Instagram">
                    <InstagramIcon />
                  </a>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        <Tabs defaultActiveKey="description" id="product-details-tabs" className="details-tabs mt-5">
          <Tab eventKey="description" title="Description">
            <div className="tab-content-wrapper">
              <p>{product.description}</p>
            </div>
          </Tab>
          <Tab eventKey="reviews" title={`Reviews (${reviews.length})`}>
            <div className="tab-content-wrapper">
              <h4 className="font-cormorant mb-4">Customer Reviews</h4>
              {reviews.length > 0 ? (
                reviews.map((review, index) => (
                  <div key={index} className="review-card">
                    <StarRating rating={review.rating} readOnly={true} />
                    <p className="mt-2 mb-1">{review.text}</p>
                    <small className="text-muted">- {review.authorName}</small>
                  </div>
                ))
              ) : (
                <p>No reviews yet. Be the first to write one!</p>
              )}
            </div>
          </Tab>
        </Tabs>
      </Container>

      {/* Size Guide Modal */}
      <Modal show={showSizeGuide} onHide={() => setShowSizeGuide(false)} centered>
        <Modal.Header closeButton>
            <Modal.Title className="font-cormorant">Size Guide (Kurti)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <p>All measurements are in inches.</p>
            <table className="table table-bordered text-center">
                <thead>
                    <tr>
                        <th>Size</th>
                        <th>Bust</th>
                        <th>Waist</th>
                        <th>Hip</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>S</td><td>36</td><td>32</td><td>38</td></tr>
                    <tr><td>M</td><td>38</td><td>34</td><td>40</td></tr>
                    <tr><td>L</td><td>40</td><td>36</td><td>42</td></tr>
                    <tr><td>XL</td><td>42</td><td>38</td><td>44</td></tr>
                    <tr><td>XXL</td><td>44</td><td>40</td><td>46</td></tr>
                </tbody>
            </table>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ProductDetailsPage;