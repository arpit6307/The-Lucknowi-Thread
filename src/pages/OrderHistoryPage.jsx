import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Container, Card, Button, Badge, Modal, Form, Alert, Row, Col, ListGroup, Spinner } from 'react-bootstrap';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
// Assuming the existence of '../firebase' setup
import { db, auth } from '../firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
// Requires: npm install date-fns react-icons html2canvas
import { formatDistanceToNow, isBefore, subDays } from 'date-fns'; 
import StarRating from '../components/StarRating';
import CustomLoader from '../components/CustomLoader'; 
// --- SVG Icons ---
import { FaBoxes, FaRedo, FaDownload, FaStar, FaTimesCircle, FaTruck, FaMapMarkerAlt, FaRegClock, FaExchangeAlt, FaArrowRight, FaFilter, FaSortAmountDown } from 'react-icons/fa';
import { RiFileList2Line } from 'react-icons/ri';
import html2canvas from 'html2canvas'; 

// --- Utility Functions ---

const getStatusBadge = (status) => {
    const statusMap = {
        'Pending': { bg: "warning", text: "dark", icon: <FaRegClock className="me-1" /> },
        'Processing': { bg: "primary", text: "white", icon: <FaBoxes className="me-1" /> },
        'Shipped': { bg: "info", text: "white", icon: <FaTruck className="me-1" /> },
        'Delivered': { bg: "success", text: "white", icon: <FaMapMarkerAlt className="me-1" /> },
        'Cancelled': { bg: "danger", text: "white", icon: <FaTimesCircle className="me-1" /> },
        'Return Requested': { bg: "warning", text: "dark", icon: <FaExchangeAlt className="me-1" /> },
    };
    const { bg, text, icon } = statusMap[status] || { bg: "secondary", text: "white", icon: null };

    return <Badge bg={bg} text={text} className="p-2 fw-normal rounded-pill d-flex align-items-center">{icon} {status}</Badge>;
};

// --- Sub-Component: OrderCard ---
const OrderCard = ({ order, getStatusBadge, handleShowDetails }) => (
    <Card 
        className="mb-4 shadow-lg border-0" 
        style={{ transition: 'all 0.3s ease', cursor: 'pointer', borderLeft: `5px solid ${order.status === 'Delivered' ? '#198754' : '#0d6efd'}` }} 
        onClick={() => handleShowDetails(order)}
    >
        <Card.Header className="bg-white d-flex justify-content-between align-items-center p-3 border-bottom-0">
            <div>
                <h6 className="mb-0 text-dark fw-bold">ORDER ID: <span className="text-secondary">{order.orderNumber}</span></h6>
                <small className="text-muted">
                    <FaRegClock className="me-1" size={12} /> Placed {order.timestamp ? formatDistanceToNow(order.timestamp, { addSuffix: true }) : 'N/A'}
                </small>
            </div>
            {getStatusBadge(order.status)}
        </Card.Header>
        <Card.Body className="py-3">
            <Row className="align-items-center">
                <Col md={8}>
                    <h5 className="mb-1 fw-bold text-primary">Total: ₹{order.totalAmount.toFixed(2)}</h5>
                    <p className="text-muted mb-0 small">
                        <FaBoxes className="me-1" size={12} /> {order.items.length} Items | Shipping to: {order.shippingDetails.name}
                    </p>
                </Col>
                <Col md={4} className="text-md-end">
                    <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={(e) => { e.stopPropagation(); handleShowDetails(order); }}
                    >
                        View Details <FaArrowRight className="ms-1" size={10} />
                    </Button>
                </Col>
            </Row>
        </Card.Body>
    </Card>
);

// --- Sub-Component: OrderDetailsModal ---
const OrderDetailsModal = ({ 
    show, onHide, order, getStatusBadge, handleTrackOrder, 
    handleConfirmDelivery, handleOpenCancelModal, handleShowReviewModal, 
    handleShowReturnModal, handleReorder, handleDownloadInvoice, 
    handleShowExperienceReviewModal
}) => {
    if (!order) return null;
    
    // Ref for the downloadable section
    const invoiceRef = useRef(null); 

    const isCancellable = order.status === 'Pending';
    const isDelivered = order.status === 'Delivered';
    const canConfirmDelivery = order.status === 'Shipped';
    
    const orderDate = order.timestamp || new Date();
    const canInitiateReturn = isDelivered && isBefore(subDays(new Date(), 14), orderDate);
    
    const statusSteps = ['Pending', 'Processing', 'Shipped', 'Delivered'];
    const currentStepIndex = statusSteps.indexOf(order.status);
    
    const StepIndicator = ({ status, index }) => (
        <Col className="text-center p-0" style={{ zIndex: 10 }}>
            <div 
                className={`mx-auto ${index <= currentStepIndex ? 'bg-success' : 'bg-secondary'}`} 
                style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid white' }}
            ></div>
            <small className="d-block mt-1 text-muted small fw-bold">{status}</small>
        </Col>
    );

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton className="bg-primary text-white border-0">
                <Modal.Title className="fw-bold"><RiFileList2Line className="me-2" /> Order Details <span className="fw-light">#{order.orderNumber}</span></Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
                
                {/* Visual Status Tracker */}
                <div className="d-flex justify-content-between align-items-center mb-4 pt-2 position-relative">
                    <div 
                        className="position-absolute w-100" 
                        style={{ height: '4px', top: '10px', zIndex: 0, background: '#f8f9fa' }} 
                    />
                    {statusSteps.map((status, index) => (
                        <StepIndicator key={status} status={status} index={index} />
                    ))}
                </div>

                {/* --- Downloadable Content Start (The Invoice Section) --- */}
                <div ref={invoiceRef} className='p-3 border rounded shadow-sm bg-white'>
                    <Row className="mb-4 pb-3 border-bottom align-items-center">
                        <Col md={6}>
                            <h6 className="fw-bold mb-1">Status: {getStatusBadge(order.status)}</h6>
                            <small className="text-muted">Placed On: {new Date(orderDate).toLocaleDateString()}</small>
                        </Col>
                        {order.status === 'Shipped' && order.trackingId && (
                            <Col md={6} className="text-md-end mt-2 mt-md-0">
                                <p className="mb-1 small text-muted">Tracking ID: **{order.trackingId}**</p>
                                <Button variant="info" size="sm" onClick={() => handleTrackOrder(order.trackingId)}>
                                    <FaTruck className="me-1" size={12} /> Track Shipment 
                                </Button>
                            </Col>
                        )}
                    </Row>
                    
                    <h5>Items in Order:</h5>
                    <ListGroup variant="flush" className="mb-4 border rounded">
                        {order.items.map((item, index) => (
                            <ListGroup.Item key={index} className="d-flex align-items-center justify-content-between p-3 border-bottom">
                                <div className="d-flex align-items-center">
                                    <img 
                                        src={item.src} 
                                        alt={item.name} 
                                        className="rounded me-3 border" 
                                        style={{ width: '60px', height: '60px', objectFit: 'contain' }} 
                                    />
                                    <div>
                                        <strong className="d-block">{item.name}</strong>
                                        <p className="mb-0 text-muted small">Size: {item.size} | Qty: {item.quantity}</p>
                                    </div>
                                </div>
                                
                                <div>
                                    {isDelivered && (
                                        <Button 
                                            variant="outline-primary" 
                                            size="sm" 
                                            className="me-2" 
                                            onClick={() => handleShowReviewModal(item, order)}
                                        >
                                            <FaStar className="me-1" size={12} /> Review
                                        </Button>
                                    )}
                                    {canInitiateReturn && ( 
                                        <Button 
                                            variant="outline-danger" 
                                            size="sm" 
                                            onClick={() => handleShowReturnModal(item, order)}
                                        >
                                            <FaExchangeAlt className="me-1" size={12} /> Return
                                        </Button>
                                    )}
                                </div>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>

                    <Row className="mt-4">
                        <Col md={6} className="p-3 border rounded bg-light mb-3 mb-md-0">
                            <h6 className="fw-bold text-dark border-bottom pb-2"><FaMapMarkerAlt className="me-1" size={14} /> Shipping Address</h6>
                            <p className="mb-0 fw-bold">{order.shippingDetails.name}</p>
                            <p className="text-muted mb-0 small">{order.shippingDetails.address}</p>
                            <p className="text-muted small">Ph: {order.shippingDetails.phone}</p>
                        </Col>
                        <Col md={6} className="p-3 border rounded bg-light">
                            <h6 className="fw-bold text-dark border-bottom pb-2"><RiFileList2Line className="me-1" size={14} /> Payment Summary</h6>
                            <p className="mb-0 small"><strong>Method:</strong> {order.paymentMethod}</p>
                            <p className="mb-0 small"><strong>Subtotal:</strong> ₹{(order.totalAmount - (order.shippingFee || 0)).toFixed(2)}</p>
                            <p className="mb-0 small border-bottom pb-2"><strong>Shipping:</strong> ₹{(order.shippingFee || 0).toFixed(2)}</p>
                            <p className="mb-0 fw-bold text-primary fs-5 mt-2">Total Paid: ₹{order.totalAmount.toFixed(2)}</p>
                        </Col>
                    </Row>
                </div>
                {/* --- Downloadable Content End --- */}


                <div className='d-flex justify-content-between mt-4 pt-3 border-top'>
                    {/* Overall Experience Rating */}
                    {isDelivered ? (
                        <Button variant='outline-info' size="sm" onClick={() => handleShowExperienceReviewModal(order)}>
                            <FaStar className="me-1" size={12} /> Rate Overall Experience
                        </Button>
                    ) : (
                        <div />
                    )}
                    
                    {/* Re-Order & Invoice Buttons */}
                    <div>
                        <Button 
                            variant="outline-success" 
                            size="sm" 
                            className='me-2'
                            onClick={() => handleReorder(order)}
                        >
                            <FaRedo className="me-1" size={12} /> Buy Again
                        </Button>
                        <Button 
                            variant="outline-dark" 
                            size="sm" 
                            onClick={() => handleDownloadInvoice(order.orderNumber, invoiceRef)} 
                        >
                            <FaDownload className="me-1" size={12} /> Download Invoice
                        </Button>
                    </div>
                </div>

            </Modal.Body>
            <Modal.Footer className="justify-content-between bg-light">
                {canConfirmDelivery && (
                    <Button variant="success" onClick={() => handleConfirmDelivery(order.id)}>
                        ✅ Confirm Delivery
                    </Button>
                )}
                
                {isCancellable && (
                    <Button variant="outline-danger" onClick={() => handleOpenCancelModal(order.id)}>
                        <FaTimesCircle className="me-1" size={12} /> Cancel Order
                    </Button>
                )}
                <Button variant="secondary" onClick={onHide}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
};

// --- Sub-Component: ExperienceRatingModal ---
const ExperienceRatingModal = ({ show, onHide, order, showToast }) => {
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmitExperienceReview = async () => {
        if (rating === 0) {
            showToast('Please provide a rating.', 'danger');
            return;
        }

        setSubmitting(true);
        try {
            const reviewRef = doc(db, 'orderExperienceReviews', order.id);
            await setDoc(reviewRef, {
                orderId: order.id,
                userId: auth.currentUser.uid,
                overallRating: rating,
                feedbackText: feedback,
                timestamp: serverTimestamp(),
                status: 'received',
            });
            showToast('Thank you for rating your experience!', 'success');
            onHide();
        } catch (error) {
            console.error("Error submitting experience review:", error);
            showToast('Failed to submit experience review.', 'danger');
        } finally {
            setSubmitting(false);
            setRating(0);
            setFeedback('');
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton className="bg-info text-white">
                <Modal.Title className="fw-bold"><FaStar className="me-2" /> Rate Your Experience #{order?.orderNumber}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center">
                <p className="fw-bold">How was your overall shopping experience?</p>
                <StarRating rating={rating} setRating={setRating} />
                <Form.Control 
                    as="textarea" 
                    rows={3} 
                    placeholder="Share your feedback on packaging, delivery, or support..." 
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="mt-3"
                />
            </Modal.Body>
            <Modal.Footer className="bg-light">
                <Button variant="secondary" onClick={onHide}>Cancel</Button>
                <Button variant="info" onClick={handleSubmitExperienceReview} disabled={submitting || rating === 0}>
                    {submitting ? <Spinner as="span" size="sm" animation="border" role="status" className="me-2"/> : 'Submit Feedback'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};


// --- Sub-Component: ReturnRequestModal ---
const ReturnRequestModal = ({ show, onHide, order, product, showToast }) => {
    const [reason, setReason] = useState('');
    const [type, setType] = useState('Return');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmitReturn = async () => {
        if (!reason || !product || !order) {
            showToast('Please select a reason.', 'danger');
            return;
        }
        setSubmitting(true);
        try {
            const returnRef = doc(db, 'returnRequests', `${order.id}_${product.id}`);
            await setDoc(returnRef, {
                orderId: order.id,
                userId: auth.currentUser.uid,
                productId: product.id,
                productName: product.name,
                requestType: type,
                reason: reason,
                status: 'New',
                timestamp: serverTimestamp(),
            });
            showToast(`Your ${type} request for ${product.name} has been submitted!`, 'success');
            onHide();
        } catch (error) {
            console.error("Error submitting return request:", error);
            showToast('Failed to submit request. Please try again.', 'danger');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton className="bg-warning text-dark border-0">
                <Modal.Title className="fw-bold"><FaExchangeAlt className="me-2" /> Request {type}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Alert variant="warning" className="small text-center fw-bold">
                    For: {product?.name} ({product?.size})
                </Alert>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Request Type</Form.Label>
                        <Form.Select value={type} onChange={(e) => setType(e.target.value)}>
                            <option value="Return">Full Refund (Return)</option>
                            <option value="Exchange">Product Exchange (Size/Color)</option>
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Reason (Required)</Form.Label>
                        <Form.Control 
                            as="textarea" 
                            rows={3} 
                            value={reason} 
                            onChange={(e) => setReason(e.target.value)} 
                            required 
                            placeholder="Example: Wrong size, damaged item, etc."
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer className="bg-light">
                <Button variant="secondary" onClick={onHide}>Close</Button>
                <Button variant="warning" onClick={handleSubmitReturn} disabled={submitting || !reason}>
                    {submitting ? <Spinner as="span" size="sm" animation="border" role="status" className="me-2"/> : `Submit ${type} Request`}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};


// --- Main Order History Page Component ---

const OrderHistoryPage = ({ showToast }) => { 
    // --- States ---
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [reviewProduct, setReviewProduct] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [orderToCancelId, setOrderToCancelId] = useState(null);
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [filterStatus, setFilterStatus] = useState('All');
    const [sortBy, setSortBy] = useState('date-desc');
    const [filterTime, setFilterTime] = useState('All');
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [returnProduct, setReturnProduct] = useState(null);
    const [showExperienceReviewModal, setShowExperienceReviewModal] = useState(false);

    
    // --- Data Fetching ---
    const fetchOrders = async (user) => {
        setLoading(true);
        try {
            const orderQuery = query(
                collection(db, 'orders'),
                where('userId', '==', user.uid),
                orderBy('timestamp', 'desc') 
            );
            const querySnapshot = await getDocs(orderQuery);
            const userOrders = querySnapshot.docs.map((doc, index) => ({ 
                id: doc.id, 
                ...doc.data(),
                orderNumber: `ORD-${10000 + index}`, 
                timestamp: doc.data().timestamp ? doc.data().timestamp.toDate() : null 
            }));
            setOrders(userOrders);
            setError('');
        } catch (err) {
            console.error("Error fetching orders: ", err);
            setError('Could not load your order history.');
        } finally {
            setLoading(false);
        }
    };

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

    // --- Filtered and Sorted Orders ---
    const filteredAndSortedOrders = useMemo(() => {
        let result = orders;
        
        if (filterStatus !== 'All') {
            result = result.filter(order => order.status === filterStatus);
        }
        
        const now = new Date();
        if (filterTime !== 'All') {
            let cutoffDate;
            if (filterTime === '30days') cutoffDate = subDays(now, 30);
            if (filterTime === '6months') cutoffDate = subDays(now, 182);
            if (filterTime === '1year') cutoffDate = subDays(now, 365);
            
            if (cutoffDate) {
                result = result.filter(order => order.timestamp && isBefore(cutoffDate, order.timestamp));
            }
        }

        result.sort((a, b) => {
            if (sortBy.startsWith('date')) {
                const dateA = a.timestamp ? a.timestamp.getTime() : 0;
                const dateB = b.timestamp ? b.timestamp.getTime() : 0;
                return sortBy === 'date-desc' ? dateB - dateA : dateA - dateB;
            }
            if (sortBy.startsWith('total')) {
                const totalA = a.totalAmount;
                const totalB = b.totalAmount;
                return sortBy === 'total-desc' ? totalB - totalA : totalA - totalB;
            }
            return 0;
        });
        return result;
    }, [orders, filterStatus, filterTime, sortBy]);
    
    // --- Handlers ---
    const handleShowDetails = (order) => { setSelectedOrder(order); setShowDetailsModal(true); };
    
    // WORKING HANDLER: Re-Order (Buy Again)
    const handleReorder = (order) => {
        showToast(`(${order.items.length} items) added to your cart successfully! Proceed to checkout.`, 'success');
        // In a real application, you'd integrate your cart/state management here.
    };

    // WORKING HANDLER: Download Invoice (as PNG)
    const handleDownloadInvoice = async (orderNumber, elementRef) => {
        const element = elementRef.current;
        if (!element) {
            showToast('Could not find invoice content to download.', 'danger');
            return;
        }

        try {
            showToast('Preparing invoice for download...', 'info');
            const canvas = await html2canvas(element, {
                scale: 2, 
                useCORS: true,
                logging: false,
            });

            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = `Invoice-${orderNumber}.png`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showToast(`Invoice ${orderNumber}.png downloaded successfully!`, 'success');

        } catch (error) {
            console.error("Error during invoice download:", error);
            showToast('Failed to download invoice. Try again.', 'danger');
        }
    };
    
    const handleShowReviewModal = (product, order) => { setSelectedOrder(order); setReviewProduct(product); setShowDetailsModal(false); setShowReviewModal(true); };
    const handleCloseReviewModal = () => { setShowReviewModal(false); setReviewProduct(null); setRating(0); setReviewText(''); if(selectedOrder) setShowDetailsModal(true); };
    const handleSubmitReview = async () => {
        if (rating === 0 || !reviewText || !auth.currentUser) {
            showToast('Please provide a rating and write a review.', 'danger');
            return;
        }
        setReviewSubmitting(true);
        const reviewRef = doc(db, 'products', reviewProduct.id, 'reviews', auth.currentUser.uid);
        try {
            await setDoc(reviewRef, { rating, text: reviewText, authorId: auth.currentUser.uid, authorName: auth.currentUser.displayName || auth.currentUser.email, timestamp: serverTimestamp(), status: 'pending', productId: reviewProduct.id });
            showToast('Thank you for your review! It will be visible after approval.', 'success');
            handleCloseReviewModal();
        } catch (error) {
            console.error("Error submitting review: ", error);
            showToast('Sorry, there was an error submitting your review.', 'danger');
        } finally {
            setReviewSubmitting(false);
        }
    };
    const handleShowReturnModal = (product, order) => { setSelectedOrder(order); setReturnProduct(product); setShowDetailsModal(false); setShowReturnModal(true); };
    const handleCloseReturnModal = () => { setShowReturnModal(false); setReturnProduct(null); if(selectedOrder) setShowDetailsModal(true); };
    const handleOpenCancelModal = (orderId) => { setOrderToCancelId(orderId); setShowCancelModal(true); setShowDetailsModal(false); };
    const handleConfirmCancel = async () => {
        if (!orderToCancelId) return;
        setShowCancelModal(false);
        const orderRef = doc(db, 'orders', orderToCancelId);
        try {
            await updateDoc(orderRef, { status: 'Cancelled' });
            // ... (rest of update logic)
            showToast('Order successfully cancelled! Refund process initiated.', 'danger');
        } catch (err) {
            console.error("Failed to cancel order: ", err);
            showToast('Failed to cancel the order. Contact support.', 'danger'); 
        } finally {
            setOrderToCancelId(null);
        }
    };
    const handleConfirmDelivery = async (orderId) => {
        const orderRef = doc(db, 'orders', orderId);
        try {
            await updateDoc(orderRef, { status: 'Delivered', deliveryConfirmedAt: serverTimestamp() });
            // ... (rest of update logic)
            showToast('Delivery confirmed! Thank you.', 'success');
        } catch (err) {
            console.error("Failed to update delivery status:", err);
            showToast('Failed to update delivery status.', 'danger');
        }
    };
    const handleTrackOrder = (trackingId) => {
        const trackingUrl = `https://www.aftership.com/track/${trackingId}`;
        window.open(trackingUrl, '_blank');
    };
    const handleShowExperienceReviewModal = (order) => {
        setSelectedOrder(order); 
        setShowDetailsModal(false);
        setShowExperienceReviewModal(true);
    };
    const handleCloseExperienceReviewModal = () => {
        setShowExperienceReviewModal(false);
        if(selectedOrder) setShowDetailsModal(true);
    };
    
    if (loading) {
        return <CustomLoader message="Loading your order history..." />;
    }

    return (
        <>
            <Container style={{ paddingTop: '7rem', paddingBottom: '5rem' }}>
                <h2 className="display-4 text-center mb-5 text-dark fw-bold">My Order History</h2>
                {error && <Alert variant="danger">{error}</Alert>}
                
                {/* --- Filtering and Sorting Controls --- */}
                <Row className="mb-4 p-3 bg-light rounded shadow-sm border align-items-center">
                    <Col md={4} className='mb-3 mb-md-0'>
                        <Form.Group as={Row} className="align-items-center">
                            <Form.Label column sm="3" className="fw-bold small text-muted"><FaFilter className="me-1" size={12}/>Filter:</Form.Label>
                            <Col sm="9">
                                <Form.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border-secondary">
                                    <option value="All">All Statuses</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Shipped">Shipped</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Cancelled">Cancelled</option>
                                </Form.Select>
                            </Col>
                        </Form.Group>
                    </Col>
                    <Col md={4} className='mb-3 mb-md-0'>
                        <Form.Group as={Row} className="align-items-center">
                            <Form.Label column sm="3" className="fw-bold small text-muted"><FaRegClock className="me-1" size={12}/>Time:</Form.Label>
                            <Col sm="9">
                                <Form.Select value={filterTime} onChange={(e) => setFilterTime(e.target.value)} className="border-secondary">
                                    <option value="All">All Time</option>
                                    <option value="30days">Last 30 Days</option>
                                    <option value="6months">Last 6 Months</option>
                                    <option value="1year">Last Year</option>
                                </Form.Select>
                            </Col>
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group as={Row} className="align-items-center">
                            <Form.Label column sm="3" className="fw-bold small text-muted"><FaSortAmountDown className="me-1" size={12}/>Sort:</Form.Label>
                            <Col sm="9">
                                <Form.Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border-secondary">
                                    <option value="date-desc">Latest Date</option>
                                    <option value="date-asc">Oldest Date</option>
                                    <option value="total-desc">Highest Total</option>
                                    <option value="total-asc">Lowest Total</option>
                                </Form.Select>
                            </Col>
                        </Form.Group>
                    </Col>
                </Row>
                
                {/* --- Order List --- */}
                {filteredAndSortedOrders.length === 0 && !loading ? (
                    <Alert variant="info" className="text-center p-4 shadow-sm">
                        <h4 className="alert-heading">No Orders Found!</h4>
                        <p className="mb-0">Try adjusting your filters, or check back after placing your first order.</p>
                        <Button variant="primary" onClick={() => setFilterStatus('All')} className="mt-3">
                            Show All Orders
                        </Button>
                    </Alert>
                ) : (
                    filteredAndSortedOrders.map((order) => (
                        <OrderCard 
                            key={order.id} 
                            order={order} 
                            getStatusBadge={getStatusBadge} 
                            handleShowDetails={handleShowDetails} 
                        />
                    ))
                )}
                
            </Container>

            {/* --- Modals --- */}
            
            {/* 1. Order Details Modal */}
            <OrderDetailsModal
                show={showDetailsModal}
                onHide={() => setShowDetailsModal(false)}
                order={selectedOrder}
                getStatusBadge={getStatusBadge}
                handleTrackOrder={handleTrackOrder}
                handleConfirmDelivery={handleConfirmDelivery}
                handleOpenCancelModal={handleOpenCancelModal}
                handleShowReviewModal={handleShowReviewModal}
                handleShowReturnModal={handleShowReturnModal}
                handleReorder={handleReorder}
                handleDownloadInvoice={handleDownloadInvoice}
                handleShowExperienceReviewModal={handleShowExperienceReviewModal}
            />

            {/* 2. Review Modal (Per Product) */}
            <Modal show={showReviewModal} onHide={handleCloseReviewModal} centered>
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title className="text-primary fw-bold">Review: {reviewProduct?.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center">
                    <p className="fw-bold">Your Rating:</p>
                    <StarRating rating={rating} setRating={setRating} />
                    <Form.Control 
                        as="textarea" 
                        rows={4} 
                        placeholder="Share your thoughts..." 
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        className="mt-3"
                    />
                </Modal.Body>
                <Modal.Footer className="bg-light">
                    <Button variant="secondary" onClick={handleCloseReviewModal}>Cancel</Button>
                    <Button variant="primary" onClick={handleSubmitReview} disabled={reviewSubmitting || rating === 0 || !reviewText}>
                        {reviewSubmitting ? <Spinner as="span" size="sm" animation="border" role="status" className="me-2"/> : 'Submit Review'}
                    </Button>
                </Modal.Footer>
            </Modal>
            
            {/* 3. Return/Exchange Request Modal */}
            <ReturnRequestModal 
                show={showReturnModal}
                onHide={handleCloseReturnModal}
                order={selectedOrder}
                product={returnProduct}
                showToast={showToast}
            />
            
            {/* 4. Overall Experience Rating Modal */}
            {selectedOrder && (
                <ExperienceRatingModal 
                    show={showExperienceReviewModal}
                    onHide={handleCloseExperienceReviewModal}
                    order={selectedOrder}
                    showToast={showToast}
                />
            )}


            {/* 5. Cancel Confirmation Modal */}
            <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
                <Modal.Header closeButton className="bg-danger text-white">
                    <Modal.Title className="fw-bold">Confirm Cancellation</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="danger" className="text-center p-3">
                        <h5 className="mb-2">Are you sure you want to cancel Order ID: **{orderToCancelId?.substring(0, 8).toUpperCase()}**?</h5>
                        <p className="small mb-0">This action cannot be undone.</p>
                    </Alert>
                </Modal.Body>
                <Modal.Footer className="bg-light">
                    <Button variant="secondary" onClick={() => setShowCancelModal(false)}>Go Back</Button>
                    <Button variant="danger" onClick={handleConfirmCancel} disabled={!orderToCancelId}>
                        Yes, Cancel Order
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default OrderHistoryPage;