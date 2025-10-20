import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Spinner, Alert, Table, Button, Badge } from 'react-bootstrap';
import { collectionGroup, query, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CustomLoader from '../../components/CustomLoader';
import StarRating from '../../components/StarRating';

const ReviewManagement = () => {
    const [allReviews, setAllReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchAllReviews = useCallback(async () => {
        setLoading(true);
        try {
            const reviewsQuery = query(collectionGroup(db, 'reviews'));
            const reviewsSnapshot = await getDocs(reviewsQuery);
            
            const reviewsList = [];
            for (const reviewDoc of reviewsSnapshot.docs) {
                const reviewData = reviewDoc.data();
                const productId = reviewDoc.ref.parent.parent.id;
                
                // Har review ke liye product ka naam fetch karein
                const productRef = doc(db, 'products', productId);
                const productSnap = await getDoc(productRef);
                
                reviewsList.push({
                    id: reviewDoc.id,
                    productId: productId,
                    productName: productSnap.exists() ? productSnap.data().name : 'Unknown Product',
                    ...reviewData
                });
            }
            
            // Reviews ko taareekh ke hisab se sort karein
            reviewsList.sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate());
            setAllReviews(reviewsList);

        } catch (err) {
            console.error("Error fetching reviews:", err);
            setError('Could not load reviews. Please check Firestore security rules for collectionGroup queries.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllReviews();
    }, [fetchAllReviews]);

    const handleApprove = async (review) => {
        const reviewRef = doc(db, 'products', review.productId, 'reviews', review.id);
        await updateDoc(reviewRef, { status: 'approved' });
        fetchAllReviews(); // List ko refresh karein
    };

    const handleDelete = async (review) => {
        if (window.confirm("Are you sure you want to delete this review?")) {
            const reviewRef = doc(db, 'products', review.productId, 'reviews', review.id);
            await deleteDoc(reviewRef);
            fetchAllReviews(); // List ko refresh karein
        }
    };
    
    const getStatusBadge = (status) => {
        switch (status) {
          case 'pending': return <Badge bg="warning">Pending</Badge>;
          case 'approved': return <Badge bg="success">Approved</Badge>;
          default: return <Badge bg="secondary">{status}</Badge>;
        }
    };

    if (loading) {
        return <CustomLoader message="Loading All Reviews..." />;
    }

    if (error) {
        return <Alert variant="danger">{error}</Alert>;
    }

    return (
        <Container fluid>
            <h3 className="mb-4">Product Review Management</h3>
            <Card>
                <Card.Body>
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Customer</th>
                                <th>Rating</th>
                                <th>Review</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allReviews.map(review => (
                                <tr key={review.id}>
                                    <td>{review.productName}</td>
                                    <td>{review.authorName}</td>
                                    <td><StarRating rating={review.rating} readOnly={true} /></td>
                                    <td>{review.text}</td>
                                    <td>{review.timestamp.toDate().toLocaleDateString()}</td>
                                    <td>{getStatusBadge(review.status)}</td>
                                    <td>
                                        {review.status === 'pending' && (
                                            <Button variant="success" size="sm" onClick={() => handleApprove(review)} className="me-2">
                                                Approve
                                            </Button>
                                        )}
                                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(review)}>
                                            Delete
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    {allReviews.length === 0 && <p className="text-center text-muted mt-3">No reviews found.</p>}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ReviewManagement;

