import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import CustomLoader from '../components/CustomLoader';

// addToCart function ko props se receive karen
const WishlistPage = ({ addToCart }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (auth.currentUser) {
        const wishlistColRef = collection(db, 'users', auth.currentUser.uid, 'wishlist');
        const wishlistSnapshot = await getDocs(wishlistColRef);
        const savedWishlist = wishlistSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setWishlistItems(savedWishlist);
      }
      setLoading(false);
    };

    fetchWishlist();
  }, []);

  const handleRemoveFromWishlist = async (productId) => {
    await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'wishlist', productId));
    setWishlistItems(wishlistItems.filter(item => item.id !== productId));
  };

  const handleAddToCart = (product) => {
    // Default size 'M' aur quantity 1 ke saath add karen
    addToCart({ ...product, size: 'M', quantity: 1 }); 
    // Wishlist se item remove kar den
    handleRemoveFromWishlist(product.id);
  };


  if (loading) {
    return <CustomLoader message="Loading your Wishlist..." />;
  }

  return (
    <Container style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
      <h2 className="font-cormorant display-4 text-center mb-5">My Wishlist</h2>
      
      {wishlistItems.length === 0 ? (
        <div className="text-center empty-wishlist">
            <div className="empty-icon">♡</div>
            <h3>Your Wishlist is Empty</h3>
            <p className="text-muted">Looks like you haven’t added anything to your wishlist yet.</p>
            <Button as={Link} to="/creations" variant="primary" className="btn-custom mt-3">
                Explore Products
            </Button>
        </div>
      ) : (
        <Row className="justify-content-center">
            <Col lg={8}>
                {wishlistItems.map(product => (
                    <Card key={product.id} className="mb-3 wishlist-card">
                        <Row className="g-0">
                            <Col md={3} className="wishlist-img-col">
                                <Card.Img src={product.src} alt={product.name} className="wishlist-item-img" />
                            </Col>
                            <Col md={9}>
                                <Card.Body className="wishlist-details-col">
                                    <div>
                                        <Card.Title as="h5">{product.name}</Card.Title>
                                        <Card.Text className="product-price fs-5">₹{product.price}</Card.Text>
                                    </div>
                                    <div className="wishlist-actions">
                                        <Button variant="primary" className="btn-custom btn-sm" onClick={() => handleAddToCart(product)}>
                                            Add to Cart
                                        </Button>
                                        <Button variant="outline-danger" size="sm" onClick={() => handleRemoveFromWishlist(product.id)}>
                                            Remove
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Col>
                        </Row>
                    </Card>
                ))}
            </Col>
        </Row>
      )}
    </Container>
  );
};

export default WishlistPage;
