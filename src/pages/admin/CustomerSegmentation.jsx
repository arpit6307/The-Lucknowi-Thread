import React, { useState, useEffect, useMemo } from 'react';
import { Container, Card, Spinner, Alert, Table, Button, Tabs, Tab, Badge } from 'react-bootstrap';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import CustomLoader from '../../components/CustomLoader';

// Copy icon
const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
        <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zM-1 7a.5.5 0 0 1 .5-.5h1v-1a.5.5 0 0 1 1 0v1h1a.5.5 0 0 1 0 1h-1v1a.5.5 0 0 1-1 0v-1h-1a.5.5 0 0 1-.5-.5z"/>
    </svg>
);


const CustomerSegmentation = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copiedSegment, setCopiedSegment] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Users aur Orders, dono ko ek saath fetch karein
                const [usersSnapshot, ordersSnapshot] = await Promise.all([
                    getDocs(collection(db, 'users')),
                    getDocs(collection(db, 'orders'))
                ]);

                // User data ko ek map mein daalein
                const usersData = {};
                usersSnapshot.forEach(doc => {
                    // Sirf 'user' role waale customers ko lein, admin ko nahi
                    if (doc.data().role === 'user') {
                        usersData[doc.id] = {
                            ...doc.data(),
                            id: doc.id,
                            totalSpent: 0,
                            orderCount: 0,
                            lastOrderDate: null
                        };
                    }
                });

                // Har user ke liye order data calculate karein
                ordersSnapshot.forEach(doc => {
                    const order = doc.data();
                    if (usersData[order.userId]) {
                        usersData[order.userId].totalSpent += order.totalAmount;
                        usersData[order.userId].orderCount += 1;
                        const orderDate = order.timestamp.toDate();
                        if (!usersData[order.userId].lastOrderDate || orderDate > usersData[order.userId].lastOrderDate) {
                            usersData[order.userId].lastOrderDate = orderDate;
                        }
                    }
                });
                
                setCustomers(Object.values(usersData));

            } catch (err) {
                console.error("Error fetching customer data:", err);
                setError('Could not load customer data. Please check console for details.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Customers ko alag-alag segments mein baantne ke liye logic
    const segments = useMemo(() => {
        if (customers.length === 0) {
            return { highSpenders: [], frequentBuyers: [], inactiveCustomers: [] };
        }

        const sortedBySpending = [...customers].sort((a, b) => b.totalSpent - a.totalSpent);
        const highSpenders = sortedBySpending.slice(0, 10); // Top 10 spenders

        const frequentBuyers = customers.filter(c => c.orderCount >= 3).sort((a, b) => b.orderCount - a.orderCount);

        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const inactiveCustomers = customers.filter(c => c.lastOrderDate && c.lastOrderDate < ninetyDaysAgo);

        return { highSpenders, frequentBuyers, inactiveCustomers };

    }, [customers]);
    
    // Email copy karne ke liye function
    const copyEmails = (segment, segmentName) => {
        const emails = segment.map(c => c.email).join(', ');
        navigator.clipboard.writeText(emails);
        setCopiedSegment(segmentName);
        setTimeout(() => setCopiedSegment(null), 2000); // 2 second baad message hata dein
    };

    if (loading) {
        return <CustomLoader message="Analyzing Customer Data..." />;
    }

    if (error) {
        return <Alert variant="danger">{error}</Alert>;
    }
    
    // Har segment ke liye table render karne wala component
    const CustomerTable = ({ segment, segmentName }) => (
        <>
            <Button variant="outline-secondary" size="sm" className="mb-3" onClick={() => copyEmails(segment, segmentName)}>
                <CopyIcon /> {copiedSegment === segmentName ? 'Emails Copied!' : `Copy ${segment.length} Emails`}
            </Button>
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Total Orders</th>
                        <th>Total Spent</th>
                        <th>Last Order</th>
                    </tr>
                </thead>
                <tbody>
                    {segment.map((customer, index) => (
                        <tr key={customer.id}>
                            <td>{index + 1}</td>
                            <td>{customer.name}</td>
                            <td>{customer.email}</td>
                            <td><Badge bg="info">{customer.orderCount}</Badge></td>
                            <td>₹{customer.totalSpent.toLocaleString()}</td>
                            <td>{customer.lastOrderDate ? customer.lastOrderDate.toLocaleDateString() : 'N/A'}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
            {segment.length === 0 && <p className="text-muted text-center">No customers in this segment yet.</p>}
        </>
    );

    return (
        <Container fluid>
            <h3 className="mb-4">Customer Segmentation</h3>
            <p className="text-muted mb-4">
                Analyze your customer base to identify key groups for targeted marketing campaigns.
            </p>
            <Tabs defaultActiveKey="highSpenders" id="customer-segments-tabs" className="mb-3">
                <Tab eventKey="highSpenders" title={`High Spenders (${segments.highSpenders.length})`}>
                    <p>Top 10 customers by total amount spent.</p>
                    <CustomerTable segment={segments.highSpenders} segmentName="highSpenders" />
                </Tab>
                <Tab eventKey="frequentBuyers" title={`Frequent Buyers (${segments.frequentBuyers.length})`}>
                    <p>Customers who have placed 3 or more orders.</p>
                    <CustomerTable segment={segments.frequentBuyers} segmentName="frequentBuyers" />
                </Tab>
                <Tab eventKey="inactiveCustomers" title={`Inactive Customers (${segments.inactiveCustomers.length})`}>
                    <p>Customers who haven't ordered in the last 90 days.</p>
                    <CustomerTable segment={segments.inactiveCustomers} segmentName="inactiveCustomers" />
                </Tab>
            </Tabs>
        </Container>
    );
};

export default CustomerSegmentation;

