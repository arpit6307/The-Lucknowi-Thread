// src/pages/admin/ReviewManagement.jsx (FULL CODE)

import React, { useState, useEffect, useCallback, useMemo } from 'react';
// Bootstrap Components
import { Container, Card, Alert, Table, Button, Badge, Row, Col, Form, InputGroup, Modal } from 'react-bootstrap';
// Firebase
import { collectionGroup, query, getDocs, doc, updateDoc, collection } from 'firebase/firestore'; 
import { db } from '../../firebase';
// Custom Components (assuming these exist and work)
import CustomLoader from '../../components/CustomLoader';
import StarRating from '../../components/StarRating';
// SVG Icons (Requires: npm install react-icons)
import { 
    FiSearch, FiCheckCircle, FiClock, FiTrash2, FiMessageSquare, 
    FiTrendingUp, FiLayers, FiStar, FiUser, FiPackage, FiEye, FiRotateCw 
} from 'react-icons/fi';

// --- Review Details Modal (Unchanged for View) ---
const ReviewDetailsModal = ({ review, show, onHide }) => {
    if (!review) return null;

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton className="bg-dark text-white">
                <Modal.Title><FiEye className="me-2" /> Complete Review Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Row className="mb-3">
                    <Col><strong>Product:</strong> {review.productName}</Col>
                    <Col><strong>Customer:</strong> {review.authorName}</Col>
                    <Col><strong>Rating:</strong> <StarRating rating={review.rating} readOnly /></Col>
                </Row>
                <Card className="shadow-sm mb-3">
                    <Card.Header className="bg-light fw-bold">Customer Review</Card.Header>
                    <Card.Body>
                        <p className="fst-italic">"{review.text}"</p>
                    </Card.Body>
                </Card>

                {/* Admin Reply Section */}
                <Card className="border-primary">
                    <Card.Header className="bg-primary text-white fw-bold">Admin Reply</Card.Header>
                    <Card.Body>
                        {review.adminReply ? (
                            <p className="text-success">{review.adminReply}</p>
                        ) : (
                            <Alert variant="warning" className="mb-0 small">No admin reply submitted yet.</Alert>
                        )}
                    </Card.Body>
                </Card>

            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
};
// ---------------------------------------------


const ReviewManagement = () => {
    // --- State Management ---
    const [allReviews, setAllReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // UI/Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [stats, setStats] = useState({ total: 0, pending: 0, averageRating: 0 });
    
    // Admin Reply Modal State
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [currentReview, setCurrentReview] = useState(null);
    const [replyText, setReplyText] = useState('');

    // State for View Details Modal
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);


    // --- Data Fetching Logic (Optimized) ---
    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            // Step 1: Fetch all products ONCE
            const productsRef = collection(db, 'products');
            const productsSnap = await getDocs(productsRef);
            const productsMap = new Map();
            productsSnap.forEach(doc => {
                productsMap.set(doc.id, doc.data().name);
            });

            // Step 2: Fetch all reviews
            const reviewsQuery = query(collectionGroup(db, 'reviews'));
            const reviewsSnapshot = await getDocs(reviewsQuery);
            
            let totalRating = 0;
            let pendingCount = 0;
            const reviewsList = reviewsSnapshot.docs.map(reviewDoc => {
                const reviewData = reviewDoc.data();
                const productId = reviewDoc.ref.parent.parent.id;

                totalRating += reviewData.rating || 0;
                // Count pending reviews (excluding deleted)
                if (reviewData.status === 'pending') {
                    pendingCount++;
                }

                return {
                    id: reviewDoc.id,
                    productId: productId,
                    productName: productsMap.get(productId) || 'Unknown Product (ID: ' + productId + ')',
                    ...reviewData
                };
            });
            
            reviewsList.sort((a, b) => (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0));
            setAllReviews(reviewsList);

            // Calculate stats
            const approvedReviews = reviewsList.filter(r => r.status === 'approved');
            const totalApprovedRating = approvedReviews.reduce((sum, r) => sum + r.rating, 0);

            setStats({
                total: reviewsList.length,
                pending: pendingCount,
                averageRating: approvedReviews.length > 0 ? (totalApprovedRating / approvedReviews.length) : 0
            });

        } catch (err) {
            console.error("Error fetching data:", err);
            setError('Could not load review data. Please check connection and permissions.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    // --- Memoized Filtering (Performance) ---
    const filteredReviews = useMemo(() => {
        return allReviews.filter(review => {
            // FIX: Agar filter 'all' hai, toh sirf 'approved' ya 'pending' dikhega.
            // Aur agar filter 'deleted' nahi hai, toh deleted reviews nahi dikhenge.
            const matchesStatus = filterStatus === 'all' 
                ? (review.status === 'approved' || review.status === 'pending') 
                : review.status === filterStatus && review.status !== 'deleted'; // Ensure 'deleted' is not viewed via filter
                
            const lowerSearch = searchTerm.toLowerCase();
            const matchesSearch = searchTerm === '' ||
                review.productName.toLowerCase().includes(lowerSearch) ||
                review.authorName.toLowerCase().includes(lowerSearch) ||
                (review.text?.toLowerCase().includes(lowerSearch));
            return matchesStatus && matchesSearch;
        });
    }, [allReviews, searchTerm, filterStatus]);


    // --- Action Handlers ---
    const handleApprove = async (review) => {
        try {
            const reviewRef = doc(db, 'products', review.productId, 'reviews', review.id);
            await updateDoc(reviewRef, { status: 'approved' });
            fetchAllData(); 
        } catch(e) {
            setError("Approval failed.");
        }
    };

    // **SOFT DELETE Feature (Diagnostic Alert Added)**
    const handleDelete = async (review) => {
        // Native browser confirm dialogue (guaranteed to appear)
        const confirmation = window.confirm(`CONFIRM: Move the review by ${review.authorName} to Recycle Bin (Soft Delete)?`);

        if (confirmation) {
            console.log(`ATTEMPTING SOFT DELETE FOR REVIEW ID: ${review.id}`); // Console log check
            try {
                const reviewRef = doc(db, 'products', review.productId, 'reviews', review.id);
                // Soft Delete: Change status to 'deleted'
                await updateDoc(reviewRef, { status: 'deleted' }); 
                
                window.alert("SUCCESS! Review successfully moved to Recycle Bin."); // Native Success Alert
                fetchAllData(); 
            } catch(e) {
                console.error("Soft Delete failed:", e);
                const msg = e.message && e.message.includes('permission denied') 
                    ? "FAILURE: PERMISSION DENIED! Check Firebase Admin Role setup." 
                    : `Soft Delete failed. Error: ${e.message}`;
                window.alert(msg); // Native Failure Alert
                setError("Soft Delete failed. Check console.");
            }
        }
    };
    
    // **RESTORE Feature** - NOTE: This function is not required here anymore, as it moves to RecycleBin.jsx
    const handleRestore = async (review) => {
         // This function remains but will only be used if filtering is broken, 
         // as restore logic primarily belongs to RecycleBin.jsx.
        if (window.confirm(`Are you sure you want to restore the review by ${review.authorName}? It will be set to Pending status.`)) {
            try {
                const reviewRef = doc(db, 'products', review.productId, 'reviews', review.id);
                // Restore: Change status back to 'pending'
                await updateDoc(reviewRef, { status: 'pending' }); 
                fetchAllData(); 
            } catch(e) {
                setError("Restore failed.");
            }
        }
    };
    
    // Admin Reply
    const handleReplyClick = (review) => {
        setCurrentReview(review);
        setReplyText(review.adminReply || ''); 
        setShowReplyModal(true);
    };

    const handleReplySubmit = async () => {
        if (!replyText || !currentReview) return;
        try {
            const reviewRef = doc(db, 'products', currentReview.productId, 'reviews', currentReview.id);
            await updateDoc(reviewRef, { adminReply: replyText });
            setShowReplyModal(false);
            setReplyText('');
            setCurrentReview(null);
            fetchAllData();
        } catch(e) {
            setError("Reply submission failed.");
        }
    };
    
    // View Details
    const handleViewReview = (review) => {
        setSelectedReview(review);
        setShowReviewModal(true);
    };
    
    // --- Utility Function for Status Badge ---
    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return <Badge bg="success" className="d-flex align-items-center"><FiCheckCircle className="me-1" size={14} /> Approved</Badge>;
            case 'pending':
                return <Badge bg="warning" text="dark" className="d-flex align-items-center"><FiClock className="me-1" size={14} /> Pending</Badge>;
            case 'deleted':
                return <Badge bg="secondary" className="d-flex align-items-center"><FiTrash2 className="me-1" size={14} /> Deleted</Badge>;
            default:
                return <Badge bg="secondary">{status}</Badge>;
        }
    };

    // --- Render Logic ---
    if (loading) return <CustomLoader message="Loading Review Dashboard..." />;
    if (error) return <Alert variant="danger" className="text-center mt-5">{error}</Alert>;

    return (
        <Container fluid className="p-4">
            <h2 className="mb-5 text-primary fw-bold">Product Review Management <FiLayers className="ms-2" /></h2>
            
            {/* --- 1. Analytics Dashboard Cards --- */}
            <Row className="mb-4 g-4">
                <Col lg={4} md={6}>
                    <Card className="shadow-sm border-0 h-100 bg-primary text-white">
                        <Card.Body className="d-flex justify-content-between align-items-center">
                            <div>
                                <Card.Title className="fs-1 fw-bold">{allReviews.length}</Card.Title>
                                <Card.Text className="text-opacity-75">All Reviews (Inc. Deleted)</Card.Text>
                            </div>
                            <FiTrendingUp size={36} />
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={4} md={6}>
                    <Card className="shadow-sm border-0 h-100 bg-warning text-dark">
                        <Card.Body className="d-flex justify-content-between align-items-center">
                            <div>
                                <Card.Title className="fs-1 fw-bold">{stats.pending}</Card.Title>
                                <Card.Text className="text-opacity-75">Reviews Pending Approval</Card.Text>
                            </div>
                            <FiClock size={36} />
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={4} md={6}>
                    <Card className="shadow-sm border-0 h-100 bg-info text-white">
                        <Card.Body className="d-flex justify-content-between align-items-center">
                            <div>
                                <Card.Title className="fs-1 fw-bold">{stats.averageRating.toFixed(2)}</Card.Title>
                                <Card.Text className="text-opacity-75"><FiStar className="me-1" /> Average Rating (Approved)</Card.Text>
                            </div>
                            <FiStar size={36} />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="shadow-lg border-0">
                <Card.Header className="bg-light border-bottom d-flex justify-content-between align-items-center">
                    <Card.Title className="mb-0 text-dark">
                        Live Review List 
                        ({filteredReviews.length} results)
                    </Card.Title>
                    <Badge bg="secondary" className="fs-6">Total Reviews: {allReviews.length}</Badge>
                </Card.Header>
                <Card.Body>
                    {/* --- 2. Search and Filter Controls (Updated Filter) --- */}
                    <Row className="mb-4 align-items-center">
                        <Col lg={8} className="mb-3 mb-lg-0">
                            <InputGroup>
                                <InputGroup.Text className="bg-white border-end-0"><FiSearch /></InputGroup.Text>
                                <Form.Control 
                                    placeholder="Search by Product, Customer Name, or Review Text..." 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                    className="border-start-0"
                                />
                            </InputGroup>
                        </Col>
                        <Col lg={4}>
                            <Form.Select 
                                value={filterStatus} 
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="shadow-sm"
                            >
                                <option value="all">Filter by Status: Live Reviews (Pending/Approved)</option>
                                <option value="pending">Filter by Status: Pending Approval</option>
                                <option value="approved">Filter by Status: Approved</option>
                                {/* REMOVED: Deleted reviews option */}
                            </Form.Select>
                        </Col>
                    </Row>

                    {/* --- 3. Reviews Table --- */}
                    {filteredReviews.length > 0 ? (
                        <Table striped bordered hover responsive className="align-middle">
                            <thead className="table-dark">
                                <tr>
                                    <th style={{ width: '15%' }}><FiPackage className="me-1"/> Product</th>
                                    <th style={{ width: '15%' }}><FiUser className="me-1"/> Customer</th>
                                    <th style={{ width: '10%' }}>Rating</th>
                                    <th style={{ width: '10%' }}>Details</th>
                                    <th style={{ width: '15%' }}>Date</th>
                                    <th style={{ width: '10%' }}>Status</th>
                                    <th style={{ width: '25%' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReviews.map(review => (
                                    <tr key={review.id} className={review.status === 'deleted' ? 'table-secondary' : ''}>
                                        <td className="fw-bold">{review.productName}</td>
                                        <td>{review.authorName}</td>
                                        <td><StarRating rating={review.rating} readOnly /></td>
                                        
                                        {/* COMPACT VIEW: Only show View button */}
                                        <td>
                                            <Button 
                                                variant="outline-secondary" 
                                                size="sm" 
                                                onClick={() => handleViewReview(review)}
                                                className="d-flex align-items-center"
                                            >
                                                <FiEye size={14} className="me-1"/> View Review
                                            </Button>
                                            {review.adminReply && <Badge bg="primary" className="mt-1">Replied</Badge>}
                                        </td>
                                        
                                        <td className="small text-nowrap">{review.timestamp?.toDate().toLocaleDateString() || 'N/A'}</td>
                                        <td>{getStatusBadge(review.status)}</td>
                                        <td className="text-nowrap">
                                            {/* ACTIONS BASED ON STATUS */}
                                            {review.status === 'pending' && (
                                                <Button 
                                                    variant="success" 
                                                    size="sm" 
                                                    onClick={() => handleApprove(review)} 
                                                    className="me-2 mb-1"
                                                    title="Approve Review"
                                                >
                                                    <FiCheckCircle size={14} /> Approve
                                                </Button>
                                            )}
                                            
                                            {/* Restore button hata diya gaya hai, ab sirf Live Actions hain */}
                                            
                                            <>
                                                <Button 
                                                    variant="info" 
                                                    size="sm" 
                                                    onClick={() => handleReplyClick(review)} 
                                                    className="me-2 mb-1 text-white"
                                                    title="Add/Edit Admin Reply"
                                                >
                                                    <FiMessageSquare size={14} /> Reply
                                                </Button>
                                                <Button 
                                                    variant="outline-danger" 
                                                    size="sm" 
                                                    onClick={() => handleDelete(review)} // Soft Delete
                                                    className="mb-1"
                                                    title="Move to Recycle Bin (Soft Delete)"
                                                >
                                                    <FiTrash2 size={14} /> Delete
                                                </Button>
                                            </>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    ) : (
                        <Alert variant="info" className="text-center">
                            <FiSearch size={24} className="me-2" /> 
                            No reviews match your current search or filter criteria.
                        </Alert>
                    )}
                </Card.Body>
            </Card>

            {/* --- 4. Modals (Reply and View) --- */}
            
            {/* Admin Reply Modal */}
            <Modal show={showReplyModal} onHide={() => setShowReplyModal(false)} centered>
                <Modal.Header closeButton className="bg-primary text-white">
                    <Modal.Title><FiMessageSquare className="me-2" /> Reply to Review</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {currentReview && (
                        <>
                            <p><strong>Customer:</strong> {currentReview.authorName} on **{currentReview.productName}**</p>
                            <div className="border border-info p-3 rounded mb-3 bg-light">
                                <strong>Review:</strong> 
                                <span className="d-block mt-1 fst-italic">"{currentReview.text}"</span>
                                <StarRating rating={currentReview.rating} readOnly className="mt-2" />
                            </div>
                        </>
                    )}
                    
                    <Form.Group>
                        <Form.Label className="fw-bold">Your Public Reply (Max 500 characters):</Form.Label>
                        <Form.Control 
                            as="textarea" 
                            rows={4} 
                            value={replyText} 
                            onChange={(e) => setReplyText(e.target.value)} 
                            placeholder="Write your professional and public reply here..." 
                            maxLength={500}
                        />
                        <Form.Text className="text-muted">
                            {replyText.length} / 500 characters
                        </Form.Text>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={() => setShowReplyModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleReplySubmit} disabled={!replyText}>
                        <FiCheckCircle className="me-1" /> {currentReview?.adminReply ? 'Update Reply' : 'Submit Reply'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Review Details Modal */}
            <ReviewDetailsModal 
                review={selectedReview} 
                show={showReviewModal} 
                onHide={() => {
                    setShowReviewModal(false);
                    setSelectedReview(null);
                }} 
            />
        </Container>
    );
};

export default ReviewManagement;
