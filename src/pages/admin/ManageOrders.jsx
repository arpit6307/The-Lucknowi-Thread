import React, { useState, useEffect } from 'react';
import { Container, Accordion, Spinner, Alert, Table, Form } from 'react-bootstrap';
import { collection, getDocs, orderBy, doc, updateDoc, query } from 'firebase/firestore';
import { db } from '../../firebase';

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAllOrders = async () => {
    try {
      const q = query(collection(db, 'orders'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const allOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(allOrders);
    } catch (err) {
      console.error("Error fetching all orders: ", err);
      setError('Could not load orders. Please check your Firebase security rules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    const orderRef = doc(db, 'orders', orderId);
    try {
      await updateDoc(orderRef, { status: newStatus });
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (err) {
      console.error("Error updating status: ", err);
      alert('Failed to update status.');
    }
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Shipped': return 'info';
      case 'Delivered': return 'success';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <Container fluid>
      <h3 className="mb-4">Manage All Orders</h3>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Total Amount</th>
            <th>Status</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td>{order.id.substring(0, 8).toUpperCase()}</td>
              <td>{order.timestamp ? new Date(order.timestamp.toDate()).toLocaleDateString() : 'N/A'}</td>
              <td>
                {order.shippingDetails.name}<br/>
                <small className="text-muted">{order.userEmail}</small>
              </td>
              <td>₹{order.totalAmount}</td>
              <td>
                <Form.Select 
                  value={order.status} 
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  className={`bg-${getStatusBadge(order.status)} text-dark`}
                  style={{border: 'none'}}
                >
                  <option value="Pending">Pending</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                </Form.Select>
              </td>
              <td>
                <Accordion>
                  <Accordion.Item eventKey="0">
                    <Accordion.Header bsPrefix="accordion-header-sm">View Details</Accordion.Header>
                    <Accordion.Body>
                      <strong>Address:</strong> {order.shippingDetails.address}<br/>
                      <strong>Phone:</strong> {order.shippingDetails.phone}
                      <hr/>
                      {order.items.map((item, index) => (
                        <div key={index}>- {item.name} (Qty: {item.quantity}, Size: {item.size})</div>
                      ))}
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default ManageOrders;