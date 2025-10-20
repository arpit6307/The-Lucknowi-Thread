import React, { useState } from 'react';
import { Form, Button, Card, Row, Col, InputGroup, Alert, Spinner } from 'react-bootstrap';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

const OfflineSalesEntry = ({ onSaleAdded }) => {
    const [totalAmount, setTotalAmount] = useState('');
    const [orderCount, setOrderCount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
    const [message, setMessage] = useState(null); // Changed to null for cleaner check
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        if (!totalAmount || !orderCount || !date) {
            setMessage({ text: 'Please fill all fields.', type: 'danger' });
            setSaving(false);
            return;
        }

        try {
            await addDoc(collection(db, 'offlineSales'), {
                totalAmount: Number(totalAmount),
                orderCount: Number(orderCount),
                date: date,
                timestamp: serverTimestamp()
            });
            setMessage({ text: 'Offline data saved successfully! Dashboard will refresh.', type: 'success' });
            
            // Form ko reset karein
            setTotalAmount('');
            setOrderCount('');
            setDate(new Date().toISOString().split('T')[0]); // Date ko phir se today par set karein

            // Dashboard ko refresh karne ke liye parent component ko signal bhejیں
            if (onSaleAdded) {
                // Thoda delay diya, taaki user success message dekh sake
                setTimeout(() => onSaleAdded(), 1000); 
            }

        } catch (error) {
            console.error("Error saving offline data: ", error);
            setMessage({ text: 'Failed to save data. Check console for details.', type: 'danger' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="shadow-sm h-100 border-primary">
            <Card.Header className="bg-primary text-white fw-bold">
                📈 Manual Offline Sales Entry
            </Card.Header>
            <Card.Body>
                <Card.Text className="text-muted small">
                    Enter physical store or channel sales data to keep your Grand Total accurate.
                </Card.Text>
                
                {message && <Alert variant={message.type} dismissible onClose={() => setMessage(null)} className="mt-3">
                    {message.text}
                </Alert>}
                
                <Form onSubmit={handleSubmit} className="mt-3">
                    <Row className="g-3">
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label className="small fw-bold">Total Sale Amount</Form.Label>
                                <InputGroup className="shadow-sm">
                                    <InputGroup.Text className="bg-light border-end-0">₹</InputGroup.Text>
                                    <Form.Control 
                                        type="number" 
                                        placeholder="5000"
                                        value={totalAmount}
                                        onChange={(e) => setTotalAmount(e.target.value)}
                                        required
                                        min="0"
                                    />
                                </InputGroup>
                            </Form.Group>
                        </Col>
                        <Col sm={6}>
                            <Form.Group>
                                <Form.Label className="small fw-bold">No. of Orders</Form.Label>
                                <Form.Control 
                                    type="number" 
                                    placeholder="10"
                                    value={orderCount}
                                    onChange={(e) => setOrderCount(e.target.value)}
                                    required
                                    min="1"
                                    className="shadow-sm"
                                />
                            </Form.Group>
                        </Col>
                        <Col sm={6}>
                             <Form.Group>
                                <Form.Label className="small fw-bold">Date</Form.Label>
                                <Form.Control 
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                    className="shadow-sm"
                                />
                            </Form.Group>
                        </Col>
                        <Col xs={12} className="mt-4">
                            <Button type="submit" variant="success" disabled={saving} className="w-100 shadow">
                                {saving ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Save Data'}
                            </Button>
                        </Col>
                    </Row>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default OfflineSalesEntry;