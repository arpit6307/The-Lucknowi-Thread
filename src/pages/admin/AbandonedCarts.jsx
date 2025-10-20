import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Spinner, Alert, Table, Button, Badge } from 'react-bootstrap';
import { collection, getDocs, collectionGroup, query } from 'firebase/firestore';
import { db } from '../../firebase';
import CustomLoader from '../../components/CustomLoader';

// WhatsApp Icon
const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
    </svg>
);

const AbandonedCarts = () => {
    const [abandonedCarts, setAbandonedCarts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchAbandonedCarts = useCallback(async () => {
        setLoading(true);
        try {
            const usersSnapshot = await getDocs(query(collection(db, 'users')));
            const usersData = {};
            usersSnapshot.forEach(doc => {
                if (doc.data().role === 'user') { // Sirf customers ko lein
                    usersData[doc.id] = { id: doc.id, ...doc.data(), cartItems: [] };
                }
            });

            const cartItemsSnapshot = await getDocs(query(collectionGroup(db, 'cart')));
            
            cartItemsSnapshot.forEach(cartDoc => {
                const cartData = cartDoc.data();
                const userId = cartDoc.ref.parent.parent.id;
                if (usersData[userId]) {
                    usersData[userId].cartItems.push(cartData);
                }
            });

            const cartsWithItems = Object.values(usersData).filter(user => user.cartItems.length > 0);
            
            setAbandonedCarts(cartsWithItems);

        } catch (err) {
            console.error("Error fetching abandoned carts:", err);
            setError('Could not load abandoned carts. Please check your Firestore security rules.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAbandonedCarts();
    }, [fetchAbandonedCarts]);

    const handleSendReminder = (customer) => {
        const phone = customer.phone ? `${customer.countryCode || '91'}${customer.phone}` : '';
        if (!phone) {
            alert(`Customer ${customer.name} has no phone number saved.`);
            return;
        }

        const cartValue = customer.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        const message = `Hello ${customer.name}, we noticed you left some beautiful items in your cart at The Lucknowi Thread worth ₹${cartValue.toFixed(2)}. Would you like to complete your purchase?`;
        
        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    if (loading) {
        return <CustomLoader message="Finding Abandoned Carts..." />;
    }

    if (error) {
        return <Alert variant="danger">{error}</Alert>;
    }

    return (
        <Container fluid>
            <h3 className="mb-4">Abandoned Cart Recovery</h3>
            <p className="text-muted mb-4">
                This list shows customers who have items in their cart but haven't completed the purchase.
            </p>
            
            <Card>
                <Card.Body>
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>Customer Name</th>
                                <th>Email / Phone</th>
                                <th>Cart Items</th>
                                <th>Cart Value</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {abandonedCarts.map(customer => {
                                const cartValue = customer.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                                return (
                                    <tr key={customer.id}>
                                        <td>{customer.name}</td>
                                        <td>
                                            {customer.email}
                                            {customer.phone && <><br/><small className="text-muted">{customer.countryCode} {customer.phone}</small></>}
                                        </td>
                                        <td>
                                            <ul>
                                                {customer.cartItems.map(item => (
                                                    <li key={`${item.id}-${item.size}`}>{item.name} (Qty: {item.quantity})</li>
                                                ))}
                                            </ul>
                                        </td>
                                        <td><Badge bg="primary">₹{cartValue.toFixed(2)}</Badge></td>
                                        <td>
                                            <Button variant="success" size="sm" onClick={() => handleSendReminder(customer)} disabled={!customer.phone}>
                                                <WhatsAppIcon /> Send Reminder
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                    {abandonedCarts.length === 0 && <p className="text-center text-muted mt-3">No abandoned carts found.</p>}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default AbandonedCarts;

