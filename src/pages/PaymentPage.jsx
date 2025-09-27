import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, ListGroup, Modal, Image, Spinner, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase.js';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { countryCodes } from '../components/countryCodes.js';

// --- Icons for UI enhancement ---
const CartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .49.598l-1 5a.5.5 0 0 1-.49.402h-9.995a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.14 4l.94 4.708a.5.5 0 0 0 .491.408h7.88a.5.5 0 0 0 .49-.408l.94-4.708H3.14zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>;
const DetailsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/></svg>;
const PaymentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1H2zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7z"/><path d="M2 10a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1z"/></svg>;

const PaymentPage = ({ cartItems, clearCart, isSaleActive, appliedCoupon }) => {
  const navigate = useNavigate();

  const [shippingDetails, setShippingDetails] = useState({
    name: '',
    phone: '',
    countryCode: '+91',
    address: '',
    landmark: '',
    pincode: '',
    city: '',
    state: '',
  });
  const [validated, setValidated] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [showQRModal, setShowQRModal] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAddress = async () => {
      if (auth.currentUser) {
        const addressRef = doc(db, 'users', auth.currentUser.uid, 'shippingAddress', 'default');
        const addressSnap = await getDoc(addressRef);
        if (addressSnap.exists()) {
          setShippingDetails(prevDetails => ({...prevDetails, ...addressSnap.data()}));
        }
      }
    };
    fetchAddress();
  }, []);

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
  
  const freeShippingThreshold = 1000;
  const shippingCost = totalAfterDiscounts >= freeShippingThreshold ? 0 : 20;
  const finalTotal = totalAfterDiscounts + shippingCost;
  
  const remainingForFreeShipping = freeShippingThreshold - totalAfterDiscounts;
  const progress = Math.min((totalAfterDiscounts / freeShippingThreshold) * 100, 100);

  const yourWhatsAppNumber = '918887547804';
  const yourQRCodeImageUrl = 'https://i.postimg.cc/rs2z2jM6/images.png';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingDetails({ ...shippingDetails, [name]: value });
  };

  const handleProceed = (e) => {
    const form = e.currentTarget;
    e.preventDefault();
    if (form.checkValidity() === false) {
      e.stopPropagation();
    } else {
      if (paymentMethod === 'QR') {
        setShowQRModal(true);
      } else {
        handlePlaceOrder();
      }
    }
    setValidated(true);
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'orders'), {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        shippingDetails,
        items: cartItems,
        subtotal,
        saleDiscount: saleDiscountPercent,
        couponDiscount: couponDiscountPercent,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        shippingCost,
        totalAmount: finalTotal,
        paymentMethod,
        status: 'Pending',
        timestamp: serverTimestamp(),
      });

      let orderDetails = `*New Chikankari Order*\n\n` +
                         `*Customer Details:*\n` +
                         `Name: ${shippingDetails.name}\n` +
                         `Phone: ${shippingDetails.countryCode} ${shippingDetails.phone}\n`+
                         `Address: ${shippingDetails.address}, ${shippingDetails.landmark}, ${shippingDetails.city}, ${shippingDetails.state} - ${shippingDetails.pincode}\n\n` +
                         `*Order Items:*\n` +
                         cartItems.map(item =>
                           `--------------------\n` +
                           `Product: ${item.name}\n` +
                           `Size: ${item.size}\n` +
                           `Quantity: ${item.quantity}\n`
                         ).join('') +
                         `--------------------\n` +
                         `*Subtotal: ₹${subtotal.toFixed(2)}*\n` +
                         (saleDiscountPercent > 0 ? `*Sale Discount (${saleDiscountPercent}%): -₹${saleDiscountAmount.toFixed(2)}*\n` : '') +
                         (couponDiscountPercent > 0 ? `*Coupon (${appliedCoupon.code}): -₹${couponDiscountAmount.toFixed(2)}*\n` : '') +
                         `*Shipping: ₹${shippingCost.toFixed(2)}*\n` +
                         `*Total Amount: ₹${finalTotal.toFixed(2)}*\n` +
                         `Payment Method: ${paymentMethod}`;

      const whatsappUrl = `https://wa.me/${yourWhatsAppNumber}?text=${encodeURIComponent(orderDetails)}`;
      window.open(whatsappUrl, '_blank');

      alert('Order placed successfully!');
      clearCart();
      navigate('/order-history');
    } catch (err) {
      alert('Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Container className="payment-page-container">
        <div className="text-center mb-5">
            <h2 className="font-cormorant display-4">Secure Checkout</h2>
            <div className="checkout-stepper">
                <div className="step-item completed"><CartIcon /><span className='d-none d-md-inline'>Cart</span></div>
                <div className="step-divider"></div>
                <div className="step-item active"><DetailsIcon /><span className='d-none d-md-inline'>Details</span></div>
                <div className="step-divider"></div>
                <div className="step-item"><PaymentIcon /><span className='d-none d-md-inline'>Payment</span></div>
            </div>
        </div>
        <Row className="g-5">
          <Col lg={7}>
            <div className="checkout-form-wrapper">
              <Form noValidate validated={validated} onSubmit={handleProceed}>
                <h3 className="font-cormorant display-6 mb-4">Contact Information</h3>
                <Row>
                  <Col md={12} className="mb-4">
                    <Form.Group className="form-group-v2">
                      <Form.Control name="name" placeholder=" " value={shippingDetails.name} onChange={handleInputChange} required />
                      <Form.Label>Full Name</Form.Label>
                      <Form.Control.Feedback type="invalid">Please enter your full name.</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={12} className="mb-4">
                    <InputGroup className="form-group-v2">
                        <Form.Select name="countryCode" value={shippingDetails.countryCode} onChange={handleInputChange} className="country-code-select">
                            {countryCodes.map(c => <option key={c.name} value={c.code}>{c.code} ({c.name})</option>)}
                        </Form.Select>
                        <Form.Control name="phone" placeholder=" " value={shippingDetails.phone} onChange={handleInputChange} required pattern="\d{10}" className="phone-input"/>
                        <Form.Label className="phone-label">10-Digit Phone Number</Form.Label>
                        <Form.Control.Feedback type="invalid">Please provide a valid 10-digit phone number.</Form.Control.Feedback>
                    </InputGroup>
                  </Col>
                </Row>
                <hr className="my-4"/>
                <h3 className="font-cormorant display-6 mb-4">Shipping Address</h3>
                <Row>
                  <Col md={12} className="mb-4">
                     <Form.Group className="form-group-v2">
                      <Form.Control name="address" placeholder=" " value={shippingDetails.address} onChange={handleInputChange} required />
                      <Form.Label>Address (House No, Street, Area)</Form.Label>
                      <Form.Control.Feedback type="invalid">Please enter your address.</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                   <Col md={6} className="mb-4">
                    <Form.Group className="form-group-v2">
                      <Form.Control name="city" placeholder=" " value={shippingDetails.city} onChange={handleInputChange} required />
                      <Form.Label>City</Form.Label>
                      <Form.Control.Feedback type="invalid">Please enter your city.</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mb-4">
                    <Form.Group className="form-group-v2">
                      <Form.Control name="state" placeholder=" " value={shippingDetails.state} onChange={handleInputChange} required />
                      <Form.Label>State</Form.Label>
                      <Form.Control.Feedback type="invalid">Please enter your state.</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mb-4">
                    <Form.Group className="form-group-v2">
                      <Form.Control name="pincode" placeholder=" " value={shippingDetails.pincode} onChange={handleInputChange} required pattern="\d{6}" />
                      <Form.Label>Pincode</Form.Label>
                      <Form.Control.Feedback type="invalid">Please provide a valid 6-digit pincode.</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                   <Col md={6} className="mb-4">
                    <Form.Group className="form-group-v2">
                      <Form.Control name="landmark" placeholder=" " value={shippingDetails.landmark} onChange={handleInputChange} />
                      <Form.Label>Landmark (Optional)</Form.Label>
                    </Form.Group>
                  </Col>
                </Row>
                <hr className="my-4"/>
                <h3 className="font-cormorant display-6 mb-4">Payment Method</h3>
                <div className="payment-method-selector">
                  <Form.Check type="radio" id="cod" name="paymentMethod" value="COD" checked={paymentMethod === 'COD'} onChange={(e) => setPaymentMethod(e.target.value)} label={
                    <div className="payment-option">
                      <strong>Cash on Delivery (COD)</strong>
                      <small>Pay with cash upon delivery of your order.</small>
                    </div>
                  } />
                   <Form.Check type="radio" id="qr" name="paymentMethod" value="QR" checked={paymentMethod === 'QR'} onChange={(e) => setPaymentMethod(e.target.value)} label={
                    <div className="payment-option">
                      <strong>Pay with UPI / QR Code</strong>
                      <small>Scan the QR code on the next step to pay.</small>
                    </div>
                  } />
                </div>
                 <div className="d-grid mt-5">
                    <Button type="submit" variant="primary" className="btn-custom py-3 fs-5" disabled={loading}>
                      {loading ? <><Spinner as="span" size="sm"/> Placing Order...</> : (paymentMethod === 'COD' ? 'Place Order & Pay on Delivery' : 'Proceed to Pay with QR')}
                    </Button>
                  </div>
              </Form>
            </div>
          </Col>

          <Col lg={5}>
            <div className="order-summary-wrapper">
              <h3 className="font-cormorant display-6 mb-4">Order Summary</h3>
              <Card className="order-summary-card">
                 <div className="p-3">
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
                  {cartItems.map(item => (
                    <ListGroup.Item key={`${item.id}-${item.size}`} className="d-flex align-items-center summary-item">
                      <Image src={item.src} alt={item.name} className="summary-item-img" />
                      <div className="flex-grow-1 ms-3">
                        <p className="mb-0 fw-bold">{item.name}</p>
                        <small className="text-muted">Size: {item.size} | Qty: {item.quantity}</small>
                      </div>
                      <p className="mb-0 fw-bold">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
                <Card.Body className="summary-totals">
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
                        <ListGroup.Item className="d-flex justify-content-between fw-bold fs-5 total-amount">
                            <span>Total to Pay</span>
                            <span>₹{finalTotal.toFixed(2)}</span>
                        </ListGroup.Item>
                    </ListGroup>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </Container>
      <Modal show={showQRModal} onHide={() => setShowQRModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="font-cormorant">Pay with QR Code</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {!showQRCode ? (
            <>
              <p>You will be shown a QR code for payment. Please complete the payment to confirm your order.</p>
              <Button variant="primary" className="btn-custom" onClick={() => setShowQRCode(true)}>Show QR Code</Button>
            </>
          ) : (
            <>
              <Image src={yourQRCodeImageUrl} alt="QR Code" fluid rounded className="mb-3" />
              <h5>Scan and Pay: ₹{finalTotal.toFixed(2)}</h5>
              <p className="text-muted small">After payment, click below to place your order.</p>
              <Button variant="success" className="btn-custom" onClick={handlePlaceOrder} disabled={loading}>
                {loading ? 'Processing...' : 'I Have Paid, Place Order'}
              </Button>
            </>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default PaymentPage;

