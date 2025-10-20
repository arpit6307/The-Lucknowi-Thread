import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, ListGroup, Image, Spinner, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { db, auth, functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { countryCodes } from '../components/countryCodes';

// --- Icons for UI enhancement ---
const CartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .49.598l-1 5a.5.5 0 0 1-.49.402h-9.995a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.14 4l.94 4.708a.5.5 0 0 0 .491.408h7.88a.5.5 0 0 0 .49-.408l.94-4.708H3.14zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>;
const DetailsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/></svg>;
const PaymentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1H2zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7z"/><path d="M2 10a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1z"/></svg>;

const PaymentPage = ({ cartItems, clearCart, isSaleActive, appliedCoupon, saleDetails }) => {
  const navigate = useNavigate();

  const [shippingDetails, setShippingDetails] = useState({ name: '', phone: '', countryCode: '+91', address: '', landmark: '', pincode: '', city: '', state: '' });
  const [validated, setValidated] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        let userDetails = {};
        if (userSnap.exists()) {
          const userData = userSnap.data();
          userDetails = { name: userData.name || auth.currentUser.displayName || '', phone: userData.phone || '', countryCode: userData.countryCode || '+91' };
        }
        const addressRef = doc(db, 'users', auth.currentUser.uid, 'shippingAddress', 'default');
        const addressSnap = await getDoc(addressRef);
        if (addressSnap.exists()) {
          setShippingDetails({ ...userDetails, ...addressSnap.data() });
        } else {
          setShippingDetails(prev => ({ ...prev, ...userDetails }));
        }
      }
    };
    fetchUserData();
  }, []);

  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  let saleDiscountPercent = 0;
  if (isSaleActive && saleDetails && saleDetails.discountTiers) {
    const applicableTier = saleDetails.discountTiers.slice().sort((a, b) => b.minSpend - a.minSpend).find(tier => subtotal >= tier.minSpend);
    if (applicableTier) saleDiscountPercent = applicableTier.discountPercent;
  }
  const saleDiscountAmount = (subtotal * saleDiscountPercent) / 100;
  const couponDiscountPercent = appliedCoupon ? appliedCoupon.discountPercent : 0;
  const couponDiscountAmount = (subtotal * couponDiscountPercent) / 100;
  const totalAfterDiscounts = subtotal - saleDiscountAmount - couponDiscountAmount;
  const shippingCost = totalAfterDiscounts >= 1000 ? 0 : 20;
  const finalTotal = totalAfterDiscounts + shippingCost;
  
  const handleInputChange = (e) => setShippingDetails({ ...shippingDetails, [e.target.name]: e.target.value });

  const handleRazorpayPayment = async () => {
    setLoading(true);
    if (finalTotal < 1) {
        alert("The total amount must be at least ₹1 to proceed with payment.");
        setLoading(false);
        return;
    }
    try {
      const createOrderFunction = httpsCallable(functions, 'createRazorpayOrder');
      const orderResponse = await createOrderFunction({ amount: Math.round(finalTotal * 100) });
      const order = orderResponse.data;
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "The Lucknowi Thread",
        description: `Order for ${shippingDetails.name}`,
        order_id: order.id,
        handler: async (response) => {
          setLoading(true); // Re-set loading to true for verification
          const verifySignatureFunction = httpsCallable(functions, 'verifyRazorpaySignature');
          await verifySignatureFunction({ order_id: response.razorpay_order_id, payment_id: response.razorpay_payment_id, signature: response.razorpay_signature });
          await handlePlaceOrder('Online (Razorpay)', response.razorpay_payment_id);
        },
        prefill: { name: shippingDetails.name, email: auth.currentUser.email, contact: `${shippingDetails.countryCode}${shippingDetails.phone}` },
        theme: { color: "#4b3e34" },
        // --- THIS IS THE FIX ---
        modal: {
          ondismiss: function() {
            console.log('Checkout form closed by user');
            setLoading(false); // Reset the button state
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        alert("Payment failed. Please try again or choose another payment method.");
        console.error("Razorpay Payment Failed:", response.error);
        setLoading(false);
      });
      rzp.open();
    } catch (error) {
      console.error("Could not initiate payment. Full error:", error);
      alert("Could not initiate payment. Please check your internet connection and try again.");
      setLoading(false);
    }
  };

  const handleProceed = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.stopPropagation();
    } else {
      if (paymentMethod === 'Razorpay') {
        handleRazorpayPayment();
      } else {
        handlePlaceOrder('COD');
      }
    }
    setValidated(true);
  };
  
  const handlePlaceOrder = async (method, paymentId = null) => {
    if(!loading) setLoading(true);
    try {
      await addDoc(collection(db, 'orders'), { userId: auth.currentUser.uid, userEmail: auth.currentUser.email, shippingDetails, items: cartItems, subtotal, saleDiscount: saleDiscountPercent, couponDiscount: couponDiscountPercent, couponCode: appliedCoupon ? appliedCoupon.code : null, shippingCost, totalAmount: finalTotal, paymentMethod: method, paymentId: paymentId, status: 'Pending', timestamp: serverTimestamp() });
      const firstItemName = cartItems.length > 0 ? cartItems[0].name : 'an item';
      await addDoc(collection(db, 'activityFeed'), { type: 'newOrder', message: `${shippingDetails.name} placed an order for '${firstItemName}' worth ₹${finalTotal.toFixed(2)}.`, timestamp: serverTimestamp() });
      alert('Order placed successfully!');
      clearCart();
      navigate('/order-history');
    } catch (err) {
      console.error("Error placing order: ", err);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Container className="payment-page-container my-5">
        <div className="text-center mb-5">
            <h2 className="font-cormorant display-4">Secure Checkout</h2>
            <div className="checkout-stepper">
                <div className="step-item completed"><CartIcon /><span className='d-none d-md-inline'>Cart</span></div>
                <div className="step-divider"></div>
                <div className="step-item active"><DetailsIcon /><span className='d-none d-md-inline'>Details & Payment</span></div>
            </div>
        </div>
        <Form noValidate validated={validated} onSubmit={handleProceed}>
          <Row className="g-5">
            <Col lg={7}>
              <div className="checkout-form-wrapper">
                  <h3 className="font-cormorant display-6 mb-4">Contact & Shipping</h3>
                  <Row>
                    <Col md={12} className="mb-3"><Form.Group><Form.Label>Full Name</Form.Label><Form.Control type="text" name="name" value={shippingDetails.name} onChange={handleInputChange} required /></Form.Group></Col>
                    <Col md={12} className="mb-3"><Form.Group><Form.Label>Mobile Number</Form.Label><InputGroup><Form.Select value={shippingDetails.countryCode} onChange={handleInputChange} name="countryCode" style={{ flex: '0 0 120px' }}>{countryCodes.map(c => <option key={c.name} value={c.code}>{c.code}</option>)}</Form.Select><Form.Control type="tel" name="phone" value={shippingDetails.phone} onChange={handleInputChange} required pattern="\d{10}" /><Form.Control.Feedback type="invalid">Please provide a valid 10-digit phone number.</Form.Control.Feedback></InputGroup></Form.Group></Col>
                    <Col md={12} className="mb-3"><Form.Group><Form.Label>Address (House No, Building, Street, Area)</Form.Label><Form.Control as="textarea" rows={2} name="address" value={shippingDetails.address} onChange={handleInputChange} required /></Form.Group></Col>
                    <Col md={12} className="mb-3"><Form.Group><Form.Label>Landmark (Optional)</Form.Label><Form.Control type="text" name="landmark" value={shippingDetails.landmark} onChange={handleInputChange} /></Form.Group></Col>
                    <Col md={4} className="mb-3"><Form.Group><Form.Label>Pincode</Form.Label><Form.Control type="text" name="pincode" value={shippingDetails.pincode} onChange={handleInputChange} required pattern="\d{6}" /><Form.Control.Feedback type="invalid">Please provide a valid 6-digit pincode.</Form.Control.Feedback></Form.Group></Col>
                    <Col md={4} className="mb-3"><Form.Group><Form.Label>City</Form.Label><Form.Control type="text" name="city" value={shippingDetails.city} onChange={handleInputChange} required /></Form.Group></Col>
                    <Col md={4} className="mb-3"><Form.Group><Form.Label>State</Form.Label><Form.Control type="text" name="state" value={shippingDetails.state} onChange={handleInputChange} required /></Form.Group></Col>
                  </Row>
              </div>
            </Col>
            <Col lg={5}>
              <div className="order-summary-wrapper">
                <h3 className="font-cormorant display-6 mb-4">Your Order</h3>
                <Card className="order-summary-card">
                  <Card.Header className="py-3"><h5 className="mb-0">Order Summary</h5></Card.Header>
                  <div style={{maxHeight: '250px', overflowY: 'auto'}}>{cartItems.map(item => (<ListGroup.Item key={`${item.id}-${item.size}`} className="d-flex justify-content-between align-items-center summary-item"><Image src={item.src} alt={item.name} className="summary-item-img me-3" /><div className="flex-grow-1"><h6 className="mb-0">{item.name}</h6><small className="text-muted">Size: {item.size} | Qty: {item.quantity}</small></div><span>₹{(item.price * item.quantity).toFixed(2)}</span></ListGroup.Item>))}</div>
                  <div className="summary-totals"><ListGroup variant="flush"><ListGroup.Item className="d-flex justify-content-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></ListGroup.Item>{saleDiscountAmount > 0 && (<ListGroup.Item className="d-flex justify-content-between text-success"><span>Sale Discount ({saleDiscountPercent}%)</span><span>- ₹{saleDiscountAmount.toFixed(2)}</span></ListGroup.Item>)}{couponDiscountAmount > 0 && (<ListGroup.Item className="d-flex justify-content-between text-success"><span>Coupon Discount</span><span>- ₹{couponDiscountAmount.toFixed(2)}</span></ListGroup.Item>)}<ListGroup.Item className="d-flex justify-content-between"><span>Shipping</span>{shippingCost === 0 ? <span className="text-success fw-bold">FREE</span> : <span>₹{shippingCost.toFixed(2)}</span>}</ListGroup.Item><ListGroup.Item className="d-flex justify-content-between fw-bold fs-5 total-amount"><span>Total to Pay</span><span>₹{finalTotal.toFixed(2)}</span></ListGroup.Item></ListGroup></div>
                </Card>
                <hr className="my-4"/>
                <h3 className="font-cormorant display-6 mb-4">Payment Method</h3>
                <div className="payment-method-selector"><Form.Check type="radio" id="cod" name="paymentMethod" value="COD" checked={paymentMethod === 'COD'} onChange={(e) => setPaymentMethod(e.target.value)} label={<div className="payment-option"><strong>Cash on Delivery (COD)</strong><small>Pay with cash when your order is delivered.</small></div>} /><Form.Check type="radio" id="razorpay" name="paymentMethod" value="Razorpay" checked={paymentMethod === 'Razorpay'} onChange={(e) => setPaymentMethod(e.target.value)} label={<div className="payment-option"><strong>Pay Online</strong><small>Card, UPI, Netbanking, and Wallets</small></div>} /></div>
                <div className="d-grid mt-4"><Button type="submit" variant="primary" className="btn-custom py-3 fs-5" disabled={loading || cartItems.length === 0}>{loading ? <><Spinner as="span" size="sm"/> Processing...</> : (paymentMethod === 'COD' ? 'Place Order & Pay on Delivery' : 'Proceed to Pay ₹' + finalTotal.toFixed(2))}</Button></div>
              </div>
            </Col>
          </Row>
        </Form>
      </Container>
    </>
  );
};

export default PaymentPage;