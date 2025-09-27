import React, { useState } from 'react';
import { Container, Row, Col, Button, Card, ListGroup, Form, InputGroup, Image } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.js';

// --- Icons for UI enhancement ---
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
        <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3V2h11v1z"/>
    </svg>
);

const EmptyCartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="currentColor" className="bi bi-cart3" viewBox="0 0 16 16">
        <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .49.598l-1 5a.5.5 0 0 1-.49.402h-9.995a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.14 4l.94 4.708a.5.5 0 0 0 .491.408h7.88a.5.5 0 0 0 .49-.408l.94-4.708H3.14zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
    </svg>
);

const CartPage = ({ cartItems, removeFromCart, updateCartQuantity, isLoggedIn, isSaleActive, appliedCoupon, setAppliedCoupon }) => {
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  
  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  
  let saleDiscountPercent = 0;
  if (isSaleActive) {
    if (subtotal >= 2000) saleDiscountPercent = 20;
    else if (subtotal >= 1000) saleDiscountPercent = 15;
    else if (subtotal >= 500) saleDiscountPercent = 10;
  }

  const saleDiscountAmount = (subtotal * saleDiscountPercent) / 100;
  
  const couponDiscountPercent = appliedCoupon ? appliedCoupon.discountPercent : 0;
  const couponDiscountAmount = (subtotal * couponDiscountPercent) / 100;

  const totalAfterDiscounts = subtotal - saleDiscountAmount - couponDiscountAmount;
  const shippingCost = totalAfterDiscounts >= 1000 ? 0 : 20;
  const finalTotal = totalAfterDiscounts + shippingCost;
  
  const freeShippingThreshold = 1000;
  const remainingForFreeShipping = freeShippingThreshold - totalAfterDiscounts;
  const progress = Math.min((totalAfterDiscounts / freeShippingThreshold) * 100, 100);

  const handleApplyCoupon = async () => {
    if (!couponCode) {
      setCouponError('Please enter a coupon code.');
      return;
    }
    const couponRef = doc(db, 'coupons', couponCode);
    const couponSnap = await getDoc(couponRef);
    if (couponSnap.exists()) {
      setAppliedCoupon(couponSnap.data());
      setCouponError('');
    } else {
      setCouponError('Invalid coupon code.');
      setAppliedCoupon(null);
    }
  };

  return (
    <Container className="cart-page-container-v2">
      <div className="text-center mb-5">
        <h2 className="font-cormorant display-4">Shopping Cart</h2>
      </div>
      
      {cartItems.length === 0 ? (
        <div className="text-center empty-cart-container-v2">
            <div className="empty-cart-icon"><EmptyCartIcon/></div>
            <h3>Your Cart is Currently Empty</h3>
            <p className="text-muted">Looks like you haven't added anything to your cart yet.</p>
            <Button as={Link} to="/creations" variant="primary" className="btn-custom mt-3">
                Continue Shopping
            </Button>
        </div>
      ) : (
        <Row className="g-5">
          <Col lg={8}>
            <div className="cart-items-wrapper-v2">
              <div className="d-none d-md-grid cart-header">
                  <div>Product</div>
                  <div className="header-quantity">Quantity</div>
                  <div className="header-total">Total</div>
                  <div></div>
              </div>
              {cartItems.map((item) => (
                <div key={`${item.id}-${item.size}`} className="cart-item-card-v2">
                    <div className="item-product-info">
                        <Image src={item.src} alt={item.name} fluid className="item-img-v2" />
                        <div>
                            <h5 className="font-cormorant item-name-v2">{item.name}</h5>
                            <p className="text-muted mb-0">Size: {item.size}</p>
                        </div>
                    </div>
                    <div className="item-quantity-v2">
                        <div className="quantity-selector-v2">
                            <Button className="qty-btn" onClick={() => updateCartQuantity(item.id, item.size, item.quantity - 1)}>-</Button>
                            <span className="qty-display">{item.quantity}</span>
                            <Button className="qty-btn" onClick={() => updateCartQuantity(item.id, item.size, item.quantity + 1)}>+</Button>
                        </div>
                    </div>
                    <div className="item-total-v2">
                        <strong>₹{(item.price * item.quantity).toFixed(2)}</strong>
                    </div>
                    <div className="item-remove-v2">
                         <Button variant="link" className="remove-btn-v2" onClick={() => removeFromCart(item.id, item.size)}>
                            <TrashIcon />
                        </Button>
                    </div>
                </div>
              ))}
            </div>
          </Col>

          <Col lg={4}>
            <div className="order-summary-wrapper-v2">
                <Card className="summary-card-v2">
                  <h3 className="font-cormorant mb-4">Order Summary</h3>
                  <div className="mb-4">
                      {remainingForFreeShipping > 0 ? (
                        <p className="shipping-message text-center">
                          Add <strong>₹{remainingForFreeShipping.toFixed(2)}</strong> more to get <strong>FREE Shipping</strong>!
                        </p>
                      ) : (
                        <p className="shipping-message text-center text-success">
                          🎉 Yay! You've got FREE Shipping!
                        </p>
                      )}
                      <div className="shipping-progress-bar">
                        <div className="shipping-progress" style={{ width: `${progress}%` }}></div>
                      </div>
                  </div>
                    <ListGroup variant="flush">
                        <ListGroup.Item className="d-flex justify-content-between">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </ListGroup.Item>
                         {isSaleActive && saleDiscountAmount > 0 && (
                            <ListGroup.Item className="d-flex justify-content-between text-success">
                                <span>Sale Discount ({saleDiscountPercent}%)</span>
                                <span>- ₹{saleDiscountAmount.toFixed(2)}</span>
                            </ListGroup.Item>
                        )}
                        {appliedCoupon && (
                            <ListGroup.Item className="d-flex justify-content-between text-success">
                                <span>Coupon '{appliedCoupon.code}'</span>
                                <span>- ₹{couponDiscountAmount.toFixed(2)}</span>
                            </ListGroup.Item>
                        )}
                        <ListGroup.Item className="d-flex justify-content-between">
                            <span>Shipping</span>
                            {shippingCost === 0 ? (
                                <span className="text-success fw-bold">FREE</span>
                            ) : (
                                <span>₹{shippingCost.toFixed(2)}</span>
                            )}
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between fw-bold fs-5 total-amount-v2">
                            <span>Total</span>
                            <span>₹{finalTotal.toFixed(2)}</span>
                        </ListGroup.Item>
                    </ListGroup>
                    
                    {!appliedCoupon && (
                    <div className="coupon-section-v2">
                        <InputGroup>
                        <Form.Control placeholder="Coupon Code" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} className="coupon-input"/>
                        <Button variant="outline-secondary" onClick={handleApplyCoupon} className="coupon-apply-btn">Apply</Button>
                        </InputGroup>
                        {couponError && <small className="text-danger d-block mt-1">{couponError}</small>}
                    </div>
                    )}

                    <Button as={Link} to={isLoggedIn ? "/payment" : "/login"} variant="primary" className="w-100 btn-custom mt-3 py-2 fs-5">
                        Proceed to Checkout
                    </Button>
                </Card>
            </div>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default CartPage;

