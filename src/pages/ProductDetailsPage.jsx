import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Image, Button, Spinner, Alert, Tabs, Tab, Modal, Form, Card } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, setDoc, deleteDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import CustomLoader from '../components/CustomLoader';
import StarRating from '../components/StarRating';

// Icons
const WishlistIconFill = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-heart-fill" viewBox="0 0 16 16"><path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/></svg>;
const WishlistIconOutline = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-heart" viewBox="0 0 16 16"><path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-1.114 2.175-.229 4.842 2.226 7.031l3.585 3.585a1 1 0 0 0 1.414 0l3.585-3.585c2.455-2.189 3.34-4.856 2.226-7.031-1.114-2.175-4.2-2.772-5.883-.737L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z"/></svg>;


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
      if (productId) {
        setLoading(true);
        try {
          const productDocRef = doc(db, 'products', productId);
          const productDocSnap = await getDoc(productDocRef);
          
          if (productDocSnap.exists()) {
            const productData = { id: productDocSnap.id, ...productDocSnap.data() };
            setProduct(productData);

            if (auth.currentUser) {
              const wishlistRef = doc(db, 'users', auth.currentUser.uid, 'wishlist', productId);
              const wishlistSnap = await getDoc(wishlistRef);
              setIsInWishlist(wishlistSnap.exists());
            }

            const reviewsQuery = query(collection(db, 'products', productId, 'reviews'), orderBy('timestamp', 'desc'));
            const reviewsSnapshot = await getDocs(reviewsQuery);
            const reviewsList = reviewsSnapshot.docs.map(doc => doc.data());
            setReviews(reviewsList);

            if (reviewsList.length > 0) {
              const totalRating = reviewsList.reduce((sum, review) => sum + review.rating, 0);
              setAvgRating(totalRating / reviewsList.length);
            }
          } else {
            setError('Sorry, this product could not be found.');
          }
        } catch (err) {
          setError('Failed to load product details.');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchData();
  }, [productId, auth.currentUser]);

  const handleAddToCart = () => {
    if (!isLoggedIn) {
      navigate('/login');
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
    }
  };

  const renderButtonContent = () => {
    switch (buttonState) {
      case 'adding': return <><Spinner as="span" animation="border" size="sm" /> Adding...</>;
      case 'added': return '✓ Added!';
      default: return 'Add to Cart';
    }
  };

  if (loading) return <CustomLoader message="Loading Product..." />;
  if (error) return <Container className="text-center py-5"><Alert variant="danger">{error}</Alert></Container>;
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
                  <Button className="qty-btn" onClick={() => setQuantity(prev => prev + 1)}>+</Button>
                </div>
              </div>

              <div className="d-grid gap-2 mt-auto">
                <Button 
                  variant={buttonState === 'added' ? 'success' : 'primary'}
                  className="btn-custom py-3 fs-5"
                  onClick={handleAddToCart}
                  disabled={buttonState !== 'default'}
                >
                  {renderButtonContent()}
                </Button>
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