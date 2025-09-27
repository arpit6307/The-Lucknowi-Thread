import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Form, InputGroup, Alert, Spinner, Row, Col, Card } from 'react-bootstrap';
import { collection, getDocs, setDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import CustomLoader from '../../components/CustomLoader';

const CouponManagement = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Naya coupon banaane ke lie states
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newDiscount, setNewDiscount] = useState('');

  // Sabhee coupons ko fetch karane ke lie function
  const fetchCoupons = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'coupons'));
      const couponsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCoupons(couponsList);
    } catch (err) {
      console.error("Error fetching coupons: ", err);
      setError('Could not load coupons.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // Naya coupon jodane ke lie function
  const handleAddCoupon = async (e) => {
    e.preventDefault();
    if (!newCouponCode || !newDiscount) {
      alert('Please fill both fields.');
      return;
    }
    const couponRef = doc(db, 'coupons', newCouponCode.toUpperCase());
    await setDoc(couponRef, {
      code: newCouponCode.toUpperCase(),
      discountPercent: Number(newDiscount)
    });
    // Form reset karen aur list ko refresh karen
    setNewCouponCode('');
    setNewDiscount('');
    fetchCoupons(); 
  };

  // Coupon delete karane ke lie function
  const handleDeleteCoupon = async (code) => {
    if (window.confirm(`Are you sure you want to delete the coupon "${code}"?`)) {
      await deleteDoc(doc(db, 'coupons', code));
      fetchCoupons(); // List ko refresh karen
    }
  };

  if (loading) {
    return <CustomLoader message="Loading Coupons..." />;
  }

  return (
    <Container fluid>
      <h3 className="mb-4">Coupon Management</h3>
      
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Naya Coupon Jodane ka Form */}
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Add a New Coupon</Card.Title>
          <Form onSubmit={handleAddCoupon}>
            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Coupon Code</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="e.g., SUMMER20"
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Discount (%)</Form.Label>
                  <Form.Control 
                    type="number" 
                    placeholder="e.g., 20"
                    value={newDiscount}
                    onChange={(e) => setNewDiscount(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={2} className="d-flex align-items-end">
                <Button type="submit" className="w-100">Add Coupon</Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Maujooda Coupons kee Soochee (List) */}
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Coupon Code</th>
            <th>Discount</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {coupons.map(coupon => (
            <tr key={coupon.id}>
              <td>{coupon.code}</td>
              <td>{coupon.discountPercent}%</td>
              <td>
                <Button variant="outline-danger" size="sm" onClick={() => handleDeleteCoupon(coupon.id)}>
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default CouponManagement;