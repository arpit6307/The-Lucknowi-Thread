import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Badge, Modal, Form, Alert, Row, Col, Image, ListGroup } from 'react-bootstrap';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import StarRating from '../components/StarRating';
import CustomLoader from '../components/CustomLoader';

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals ke liye state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reviewProduct, setReviewProduct] = useState(null);

  // Review form ke liye state
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchOrders(user);
      } else {
        setLoading(false);
        setOrders([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchOrders = async (user) => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const userOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(userOrders);
      setError('');
    } catch (err) {
      console.error("Error fetching orders: ", err);
      setError('Could not load your order history.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleShowDetails = (order) => {
      setSelectedOrder(order);
      setShowDetailsModal(true);
  }

  const handleConfirmDelivery = async (orderId) => {
    const orderRef = doc(db, 'orders', orderId);
    try {
      await updateDoc(orderRef, { status: 'Delivered' });
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: 'Delivered' } : order
        )
      );
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleShowReviewModal = (product) => {
    setReviewProduct(product);
    setShowReviewModal(true);
    setShowDetailsModal(false); // Details modal ko band kar dein
  };
  
  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
    setReviewProduct(null);
    setRating(0);
    setReviewText('');
  };
  
  const handleSubmitReview = async () => {
    if (rating === 0 || !reviewText) {
      alert('Please provide a rating and a review.');
      return;
    }
    const reviewRef = doc(db, 'products', reviewProduct.id, 'reviews', auth.currentUser.uid);
    await setDoc(reviewRef, {
      rating,
      text: reviewText,
      authorId: auth.currentUser.uid,
      authorName: auth.currentUser.displayName || auth.currentUser.email,
      timestamp: new Date(),
    });
    handleCloseReviewModal();
    alert('Thank you for your review!');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return <Badge bg="warning" className="order-status-badge">Pending</Badge>;
      case 'Shipped': return <Badge bg="info" className="order-status-badge">Shipped</Badge>;
      case 'Delivered': return <Badge bg="success" className="order-status-badge">Delivered</Badge>;
      default: return <Badge bg="secondary" className="order-status-badge">{status}</Badge>;
    }
  };

  if (loading) {
    return <CustomLoader message="Loading your order history..." />;
  }

  return (
    <>
      <Container style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
        <h2 className="font-cormorant display-4 text-center mb-5">My Orders</h2>
        {error && <Alert variant="danger">{error}</Alert>}
        
        {orders.length === 0 && !loading && (
          <Alert variant="info" className="text-center">You have not placed any orders yet.</Alert>
        )}

        {orders.map((order) => (
          <Card key={order.id} className="mb-4 order-history-card">
            <Card.Header className="order-card-header">
                <div>
                    <h6 className="mb-0">ORDER #{order.id.substring(0, 8).toUpperCase()}</h6>
                    <small className="text-muted">Placed on {order.timestamp ? new Date(order.timestamp.toDate()).toLocaleDateString() : 'N/A'}</small>
                </div>
                {getStatusBadge(order.status)}
            </Card.Header>
            <Card.Body className="order-card-body">
                <Row className="align-items-center">
                    <Col md={9}>
                        <p className="mb-1"><strong>Total Amount:</strong> ₹{order.totalAmount}</p>
                        <p className="text-muted mb-0"><strong>Shipping to:</strong> {order.shippingDetails.name}</p>
                    </Col>
                    <Col md={3} className="text-md-end mt-3 mt-md-0">
                        <Button variant="outline-primary" size="sm" onClick={() => handleShowDetails(order)}>
                            View Details
                        </Button>
                    </Col>
                </Row>
            </Card.Body>
          </Card>
        ))}
      </Container>

      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Order Details #{selectedOrder.id.substring(0, 8).toUpperCase()}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h5>Items in your order:</h5>
            <ListGroup variant="flush" className="mb-4">
              {selectedOrder.items.map((item, index) => (
                <ListGroup.Item key={index} className="order-item-row">
                  <Image src={item.src} alt={item.name} className="order-item-img" />
                  <div className="flex-grow-1">
                    <strong>{item.name}</strong>
                    <p className="mb-0 text-muted">Size: {item.size} | Qty: {item.quantity}</p>
                  </div>
                  {selectedOrder.status === 'Delivered' && (
                    <Button variant="outline-primary" size="sm" onClick={() => handleShowReviewModal(item)}>
                      Write a Review
                    </Button>
                  )}
                </ListGroup.Item>
              ))}
            </ListGroup>

            <Row>
                <Col md={6}>
                    <h6>Shipping Address</h6>
                    <p className="mb-0">{selectedOrder.shippingDetails.name}</p>
                    <p className="text-muted mb-0">{selectedOrder.shippingDetails.address}</p>
                    <p className="text-muted">Ph: {selectedOrder.shippingDetails.phone}</p>
                </Col>
                <Col md={6}>
                    <h6>Payment Summary</h6>
                    <p className="mb-0"><strong>Payment Method:</strong> {selectedOrder.paymentMethod}</p>
                    <p className="mb-0"><strong>Total Amount:</strong> ₹{selectedOrder.totalAmount}</p>
                </Col>
            </Row>

             {selectedOrder.status === 'Shipped' && (
                <div className="text-center mt-4">
                    <Button variant="success" onClick={() => handleConfirmDelivery(selectedOrder.id)}>
                        I have received my order
                    </Button>
                </div>
            )}
          </Modal.Body>
        </Modal>
      )}
      
      {/* Review Modal */}
      <Modal show={showReviewModal} onHide={handleCloseReviewModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Write a review for {reviewProduct?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-3">
            <StarRating rating={rating} setRating={setRating} />
          </div>
          <Form.Control 
            as="textarea" 
            rows={4} 
            placeholder="Share your thoughts..." 
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseReviewModal}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmitReview}>Submit Review</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default OrderHistoryPage;
