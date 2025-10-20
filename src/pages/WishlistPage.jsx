import React, { useState, useEffect, useCallback } from 'react';
import { 
    Container, Row, Col, Card, Button, Alert, Spinner, Form, Modal, Dropdown, Badge, ListGroup
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
    collection, getDocs, deleteDoc, doc, getDoc, setDoc, updateDoc 
} from 'firebase/firestore'; // Note: updateDoc added for priority toggle
import { db, auth } from '../firebase';
import CustomLoader from '../components/CustomLoader';
import StarRating from '../components/StarRating'; // Assuming StarRating component exists

// --- Price Drop/Change Utility Function ---
const getPriceStatus = (currentPrice, wishlistPrice) => {
    const cp = parseFloat(currentPrice);
    const wp = parseFloat(wishlistPrice);

    if (isNaN(cp) || isNaN(wp) || cp === wp) {
        return { text: 'Stable Price', variant: 'secondary' };
    }
    
    const difference = cp - wp;
    const percentage = ((difference / wp) * 100).toFixed(1);

    if (difference < 0) {
        return { 
            text: `🔥 Dropped by ₹${Math.abs(difference).toFixed(0)} (${Math.abs(percentage)}%)`, 
            variant: 'success' 
        };
    } else {
        return { 
            text: `📈 Increased by ₹${difference.toFixed(0)} (${percentage}%)`, 
            variant: 'warning' 
        };
    }
};

const WishlistPage = ({ addToCart, showToast }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States for Modals
  const [showCartModal, setShowCartModal] = useState(false);
  const [showPriceHistoryModal, setShowPriceHistoryModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);

  // States for selected product/data
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isSubscribing, setIsSubscribing] = useState(false);


  // --- Date Added Utility (Firestore Timestamp to String) ---
  const getAddedDate = (timestamp) => {
    if (timestamp && timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return 'N/A';
  }


  // --- Fetch Product Details and Live Price (Includes Rating and Category) ---
  const fetchProductDetails = async (product) => {
    const productRef = doc(db, 'products', product.id);
    const productSnap = await getDoc(productRef);
    
    const wishlistPrice = product.wishlistPrice || product.price || 0; 
    const dateAdded = product.timestamp || null;

    if (productSnap.exists()) {
        const liveData = productSnap.data();
        const priceStatus = getPriceStatus(liveData.price, wishlistPrice);

        return {
            ...product,
            currentPrice: liveData.price,
            wishlistPrice: wishlistPrice,
            dateAdded: dateAdded,
            inStock: liveData.stock > 0, 
            priceStatus,
            sizes: Array.isArray(liveData.sizes) && liveData.sizes.length > 0 ? liveData.sizes : ['S', 'M', 'L', 'XL'], 
            liveStock: liveData.stock || 0,
            category: liveData.category || 'General', // NAYA: Category
            rating: liveData.rating || 0, // NAYA: Rating (Assuming you store aggregate rating here)
            isHighPriority: product.isHighPriority || false, // NAYA: Priority Flag
        };
    }
    
    // If original product is deleted/unavailable
    return { 
        ...product, 
        currentPrice: product.price || wishlistPrice,
        wishlistPrice: wishlistPrice,
        dateAdded: dateAdded,
        inStock: false, 
        priceStatus: { text: 'Item Unavailable', variant: 'danger' },
        sizes: ['M'], 
        liveStock: 0,
        category: product.category || 'General',
        rating: product.rating || 0,
        isHighPriority: product.isHighPriority || false,
    };
  };


  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    if (!auth.currentUser) {
        setLoading(false);
        return;
    }
    try {
        const wishlistColRef = collection(db, 'users', auth.currentUser.uid, 'wishlist');
        const wishlistSnapshot = await getDocs(wishlistColRef);
        
        const rawWishlist = wishlistSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const detailedPromises = rawWishlist.map(item => fetchProductDetails(item));
        const detailedWishlist = await Promise.all(detailedPromises);

        setWishlistItems(detailedWishlist);

    } catch (error) {
        console.error("Error fetching wishlist: ", error);
        showToast('Failed to load wishlist items.', 'danger');
    } finally {
        setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleRemoveFromWishlist = async (productId) => {
    try {
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'wishlist', productId));
        setWishlistItems(wishlistItems.filter(item => item.id !== productId));
        showToast('Item removed from Wishlist.', 'warning');
    } catch (error) {
        showToast('Failed to remove item.', 'danger');
    }
  };

  // --- NAYA FEATURE: Priority Toggle ---
  const handlePriorityToggle = async (productId, currentPriority) => {
      const newPriority = !currentPriority;
      
      // Optimistic UI Update
      setWishlistItems(prev => prev.map(item => 
          item.id === productId ? { ...item, isHighPriority: newPriority } : item
      ));

      try {
          const docRef = doc(db, 'users', auth.currentUser.uid, 'wishlist', productId);
          await updateDoc(docRef, { isHighPriority: newPriority });

          showToast(`Priority ${newPriority ? 'set to HIGH' : 'removed'} for item.`, newPriority ? 'info' : 'warning');
      } catch (error) {
          console.error("Failed to update priority:", error);
          showToast('Failed to update priority.', 'danger');
          // Rollback UI on failure
          setWishlistItems(prev => prev.map(item => 
              item.id === productId ? { ...item, isHighPriority: currentPriority } : item
          ));
      }
  }


  const handleOpenAddToCartModal = (product) => {
    setSelectedProduct(product);
    setSelectedSize(product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'M'); 
    setQuantity(1);
    setShowCartModal(true);
  };
  
  const handleAddToCart = () => {
    if (!selectedProduct || !selectedSize || quantity <= 0) return;
    
    if (selectedProduct.liveStock < quantity) {
        showToast('Requested quantity is more than available stock.', 'danger');
        return;
    }

    try {
        addToCart({ 
            ...selectedProduct, 
            price: selectedProduct.currentPrice, 
            size: selectedSize, 
            quantity: quantity 
        }); 
        
        handleRemoveFromWishlist(selectedProduct.id);

        showToast(`${quantity} x ${selectedProduct.name} (Size: ${selectedSize}) moved to Cart!`, 'success');
        setShowCartModal(false);
        setSelectedProduct(null);

    } catch (error) {
        console.error("Error adding to cart:", error);
        showToast('Failed to add item to cart.', 'danger');
    }
  };
  
  // --- Price/Stock Alert Subscription ---
  const handleNotifySubscription = async (product) => {
    if (!auth.currentUser) {
        showToast('Please log in to set alerts.', 'warning');
        return;
    }
    
    setSelectedProduct(product);
    setShowNotifyModal(true);
  }
  
  const submitNotificationSubscription = async (e) => {
      e.preventDefault();
      if (!selectedProduct) return;
      
      setIsSubscribing(true);
      try {
          const subscriptionData = {
              productId: selectedProduct.id,
              userId: auth.currentUser.uid,
              userEmail: auth.currentUser.email,
              productName: selectedProduct.name,
              alertType: selectedProduct.inStock ? 'PriceDrop' : 'StockAvailable', 
              currentPrice: selectedProduct.currentPrice,
              subscribedAt: new Date(),
          };

          const alertRef = doc(db, 'price_alerts', `${auth.currentUser.uid}_${selectedProduct.id}`);
          await setDoc(alertRef, subscriptionData, { merge: true });

          showToast('Alert subscribed! We will notify you of price/stock changes.', 'success');
          setShowNotifyModal(false);
      } catch (error) {
          console.error("Error subscribing to alert:", error);
          showToast('Failed to set alert. Please try again.', 'danger');
      } finally {
          setIsSubscribing(false);
      }
  }


  if (loading) {
    return <CustomLoader message="Loading your Wishlist..." />;
  }

  return (
    <>
    <Container style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
      <h2 className="font-cormorant display-4 text-center mb-5">My Wishlist</h2>
      
      {wishlistItems.length === 0 ? (
        <div className="text-center empty-wishlist p-5">
            <div className="empty-icon text-danger fs-1">💔</div>
            <h3>Your Wishlist is Empty</h3>
            <p className="text-muted">Looks like you haven’t added anything to your wishlist yet.</p>
            <Button as={Link} to="/creations" variant="primary" className="btn-custom mt-3">
                Explore Products
            </Button>
        </div>
      ) : (
        <Row className="justify-content-center">
            <Col lg={9}>
                {/* NAYA: High Priority items ko pehle dikhayen */}
                {[...wishlistItems].sort((a, b) => (b.isHighPriority ? 1 : 0) - (a.isHighPriority ? 1 : 0)).map(product => (
                    <Card 
                        key={product.id} 
                        className={`mb-4 wishlist-card shadow-lg border ${product.isHighPriority ? 'border-primary' : 'border-light'}`}
                        style={{ borderLeft: product.isHighPriority ? '6px solid var(--bs-primary)' : 'none' }} // Priority highlight
                    >
                        <Row className="g-0 align-items-center">
                            <Col xs={4} md={3} className="wishlist-img-col">
                                <Link to={`/product/${product.id}`}>
                                    <Card.Img src={product.src} alt={product.name} className="wishlist-item-img" />
                                </Link>
                            </Col>
                            <Col xs={8} md={5}>
                                <Card.Body className="wishlist-details-col py-3 py-md-4">
                                    <Card.Title as="h5" className="mb-1">
                                        <Link to={`/product/${product.id}`} className="text-decoration-none text-dark">{product.name}</Link>
                                    </Card.Title>
                                    
                                    {/* NAYA: Product Metadata & Rating */}
                                    <div className='d-flex align-items-center mb-1'>
                                        <Badge bg="dark" className='me-2'>{product.category}</Badge>
                                        <small className='text-muted me-2'>Rating:</small>
                                        {/* Assuming StarRating component takes a 'rating' prop */}
                                        {product.rating > 0 ? (
                                             <span className='text-warning fw-bold'>{product.rating.toFixed(1)}/5</span>
                                        ) : (
                                            <span className='text-muted small'>N/A</span>
                                        )}
                                    </div>
                                    
                                    {/* Price and Price Status */}
                                    <div className="d-flex align-items-center mb-2">
                                        <Card.Text className="product-price fs-5 mb-0 me-3">
                                            ₹{product.currentPrice?.toFixed(2) || product.price?.toFixed(2)}
                                        </Card.Text>
                                        <Badge bg={product.priceStatus.variant} className="fw-normal">
                                            {product.priceStatus.text}
                                        </Badge>
                                    </div>
                                    
                                    {/* Stock Status & Date Added */}
                                    <p className="text-muted small mb-1">
                                        Added on: {getAddedDate(product.dateAdded)}
                                    </p>
                                    <Badge 
                                        bg={product.inStock ? 'success' : 'danger'} 
                                        className="fw-bold"
                                    >
                                        {product.inStock ? `✅ IN STOCK (${product.liveStock})` : '❌ OUT OF STOCK'}
                                    </Badge>
                                    <p className="text-muted small mt-2 mb-0">Initial Price: ₹{product.wishlistPrice?.toFixed(2) || 'N/A'}</p>
                                    
                                </Card.Body>
                            </Col>
                            <Col xs={12} md={4} className="text-md-end p-3 d-grid gap-2">
                                
                                {/* NAYA FEATURE: Priority Toggle Button */}
                                <Button
                                    variant={product.isHighPriority ? 'warning' : 'outline-secondary'}
                                    size="sm"
                                    onClick={() => handlePriorityToggle(product.id, product.isHighPriority)}
                                >
                                    {product.isHighPriority ? '⭐ High Priority' : 'Set as High Priority'}
                                </Button>

                                {/* Primary Action Button */}
                                <Button 
                                    variant={product.inStock ? 'primary' : 'secondary'}
                                    className="btn-custom" 
                                    onClick={() => product.inStock ? handleOpenAddToCartModal(product) : handleNotifySubscription(product)}
                                    disabled={!product.inStock && product.priceStatus.variant === 'danger'} // Item Unavailable
                                >
                                    {product.inStock ? 'Move to Cart' : 'Notify Me'}
                                </Button>
                                
                                {/* Secondary Action Buttons */}
                                <div className='d-flex gap-2 justify-content-end'>
                                    <Button 
                                        variant="outline-info" 
                                        size="sm"
                                        onClick={() => {setSelectedProduct(product); setShowPriceHistoryModal(true);}}
                                    >
                                        Price History 📊
                                    </Button>
                                    <Button 
                                        variant="outline-danger" 
                                        size="sm"
                                        onClick={() => handleRemoveFromWishlist(product.id)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </Card>
                ))}
            </Col>
        </Row>
      )}
    </Container>

    {/* --- Modal 1: Add to Cart Modal for Size/Quantity Selection (Working) --- */}
    <Modal show={showCartModal} onHide={() => setShowCartModal(false)} centered>
        <Modal.Header closeButton>
            <Modal.Title>Move "{selectedProduct?.name}" to Cart</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            {selectedProduct && selectedProduct.sizes && selectedProduct.sizes.length > 0 ? (
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Select Size</Form.Label>
                        <Dropdown>
                            <Dropdown.Toggle variant="outline-secondary" id="dropdown-basic" className="w-100">
                                Size: {selectedSize}
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="w-100">
                                {selectedProduct.sizes.map(size => (
                                    <Dropdown.Item key={size} onClick={() => setSelectedSize(size)}>
                                        {size}
                                    </Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        </Dropdown>
                        <Form.Text className="text-muted">Available sizes: {selectedProduct.sizes.join(', ')}</Form.Text>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                        <Form.Label>Quantity</Form.Label>
                        <Form.Control 
                            type="number" 
                            min="1" 
                            max={selectedProduct.liveStock || 1} 
                            value={quantity}
                            onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                const max = selectedProduct.liveStock || 1;
                                setQuantity(Math.min(val, max));
                            }}
                            required
                        />
                        <Form.Text className="text-muted">Max available: {selectedProduct.liveStock || 0}</Form.Text>
                    </Form.Group>
                </Form>
            ) : (
                <Alert variant="warning">Product data is incomplete or has no size options. Cannot add to cart.</Alert>
            )}
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCartModal(false)}>
                Cancel
            </Button>
            <Button 
                variant="primary" 
                onClick={handleAddToCart} 
                disabled={quantity <= 0 || !selectedSize || !selectedProduct}
            >
                Move to Cart (₹{(selectedProduct?.currentPrice * quantity || 0).toFixed(2)})
            </Button>
        </Modal.Footer>
    </Modal>

    {/* --- Modal 2: Notify Me Alert Subscription (Working) --- */}
    <Modal show={showNotifyModal} onHide={() => setShowNotifyModal(false)} centered>
        <Modal.Header closeButton>
            <Modal.Title>Set Alert for "{selectedProduct?.name}"</Modal.Title>
        </Modal.Header>
        <Form onSubmit={submitNotificationSubscription}>
        <Modal.Body>
            <Alert variant={selectedProduct?.inStock ? 'warning' : 'danger'}>
                {selectedProduct?.inStock 
                    ? `This item's price is currently ${selectedProduct?.priceStatus?.text}. Subscribe to be notified if the price drops!` 
                    : "This item is currently out of stock. Subscribe to be notified when it is available again."}
            </Alert>
            
            <ListGroup variant='flush'>
                <ListGroup.Item>
                    **Product:** {selectedProduct?.name}
                </ListGroup.Item>
                <ListGroup.Item>
                    **Current Price:** ₹{selectedProduct?.currentPrice?.toFixed(2)}
                </ListGroup.Item>
                <ListGroup.Item>
                    **Your Email:** {auth.currentUser?.email}
                </ListGroup.Item>
            </ListGroup>
            
            <Form.Text className="text-muted mt-3 d-block">
                You will receive a one-time email alert when the price drops below ₹{selectedProduct?.wishlistPrice?.toFixed(2)} or when stock is replenished.
            </Form.Text>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowNotifyModal(false)} disabled={isSubscribing}>
                Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubscribing}>
                {isSubscribing ? <><Spinner as="span" size="sm" /> Subscribing...</> : 'Subscribe to Alert'}
            </Button>
        </Modal.Footer>
        </Form>
    </Modal>

    {/* --- Modal 3: Price History Visualization (Simulated UI) --- */}
    <Modal show={showPriceHistoryModal} onHide={() => setShowPriceHistoryModal(false)} centered size="lg">
        <Modal.Header closeButton>
            <Modal.Title>Price History for "{selectedProduct?.name}"</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <Alert variant="info" className="text-center">
                📊 **NOTE:** This is a simulated visualization. In a professional setup, this would display a line chart based on historical price data stored in Firestore/Analytics.
            </Alert>
            <Card className='p-4 text-center'>
                <h5 className='mb-3'>Price Trend (Last 30 Days)</h5>
                <img 
                    src="https://via.placeholder.com/700x300/4CAF50/FFFFFF?text=Simulated+Price+Line+Chart+Here" 
                    alt="Price Chart Placeholder" 
                    className="img-fluid rounded" 
                    style={{ border: '1px solid #ccc' }}
                />
                <ListGroup horizontal className='mt-4 justify-content-center'>
                    <ListGroup.Item variant='light'>**Added Price:** ₹{selectedProduct?.wishlistPrice?.toFixed(2)}</ListGroup.Item>
                    <ListGroup.Item variant='light'>**Current Price:** ₹{selectedProduct?.currentPrice?.toFixed(2)}</ListGroup.Item>
                    <ListGroup.Item variant={selectedProduct?.priceStatus?.variant}>**Status:** {selectedProduct?.priceStatus?.text}</ListGroup.Item>
                </ListGroup>
            </Card>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPriceHistoryModal(false)}>Close</Button>
        </Modal.Footer>
    </Modal>
    {/* --- END OF MODALS --- */}
    </>
  );
};

export default WishlistPage;