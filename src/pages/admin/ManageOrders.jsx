import React, { useState, useEffect, useCallback } from 'react';
import { db } from '/src/firebase.js'; 
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { Container, Table, Dropdown, Button, Modal, ListGroup, Badge, Row, Col, Spinner, Alert, Card, ButtonGroup, InputGroup, Form } from 'react-bootstrap'; 
import { toast } from 'react-hot-toast'; 

// --- UTILITY ICONS (Preserved) ---
const EyeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>);
const StatusIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>);
const PackageIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l-7-7L12 5l7 7-7 7zM12 19V5"></path></svg>);
const SearchIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>);
const ListIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>);
const CardIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>);


// --- FIX HELPERS ---
const safeDateConversion = (timestamp) => {
    // FIX: Checks if object has the .toDate function (Firestore Timestamp check)
    if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
    }
    return null;
}

const ProductImagePlaceholder = () => (
    // FINAL FIX: Increased size and clean placeholder style
    <div className="d-flex align-items-center justify-content-center bg-light text-muted" style={{ width: '60px', height: '60px', borderRadius: '4px', border: '1px solid var(--bs-gray-300)', marginRight: '1rem' }}>
        <PackageIcon />
    </div>
);


const ManageOrders = () => {
    const allStatuses = ['All', 'Pending', 'Shipped', 'Delivered', 'Cancelled']; 
    
    const [allOrders, setAllOrders] = useState([]); 
    const [orders, setOrders] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [filterStatus, setFilterStatus] = useState('All'); 
    const [viewMode, setViewMode] = useState('table'); 
    const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);
  
  // Filtering and Searching Logic
  useEffect(() => {
    let filtered = allOrders;
    const lowerCaseSearch = searchTerm.toLowerCase();

    // 1. Status Filter
    if (filterStatus !== 'All') {
        filtered = filtered.filter(order => order.status === filterStatus);
    }
    
    // 2. Search Filter
    if (searchTerm) {
        filtered = filtered.filter(order => 
            order.id.toLowerCase().includes(lowerCaseSearch) ||
            order.customerName.toLowerCase().includes(lowerCaseSearch) ||
            order.userEmail.toLowerCase().includes(lowerCaseSearch) ||
            order.shippingDetails.city?.toLowerCase().includes(lowerCaseSearch) || // FIX: Safely accessing city via shippingDetails
            order.shippingDetails.phone?.toLowerCase().includes(lowerCaseSearch) // FIX: Safely accessing phone via shippingDetails
        );
    }

    setOrders(filtered);
  }, [filterStatus, searchTerm, allOrders]);


  const fetchOrders = async () => {
    setLoading(true);
    try {
      const ordersCollection = collection(db, 'orders');
      const orderSnapshot = await getDocs(ordersCollection);
      
      const rawOrderList = orderSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // NEW ADVANCE FEATURE: Fetch User Info for robust display
      const ordersWithUserData = await Promise.all(rawOrderList.map(async order => {
          // FIX: Use shippingDetails as the base object and ensure it is not null
          const shippingDetails = order.shippingDetails || {}; 

          // Robust fetching with fallback to 'N/A'
          let userEmail = order.userEmail || shippingDetails.email || 'N/A';
          let customerName = shippingDetails.name || 'Unknown Customer';
          let customerPhone = shippingDetails.phone || 'N/A';
          
          if (order.userId) { 
            const userRef = doc(db, 'users', order.userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const userData = userSnap.data();
                customerName = userData.displayName || userData.name || customerName;
                userEmail = userData.email || userEmail;
                customerPhone = userData.phone || customerPhone; 
            }
          }
          
          return {
            ...order,
            customerName: customerName,
            userEmail: userEmail,
            // FINAL FIX: shippingAddress is renamed to shippingDetails for consistency
            shippingDetails: {
                address: shippingDetails.address || 'N/A',
                city: shippingDetails.city || 'N/A',
                state: shippingDetails.state || 'N/A',
                postalCode: shippingDetails.pincode || shippingDetails.postalCode || 'N/A', // Use pincode from screenshot
                landmark: shippingDetails.landmark || 'N/A',
                phone: customerPhone, 
                email: userEmail 
            },
            // Ensure items array exists and has robust src
            items: order.items?.map(item => ({
                ...item,
                src: item.src || '' 
            })) || []
          };
      }));

      // FIX: Sorting Logic robust
      ordersWithUserData.sort((a, b) => {
        const dateA = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
        const dateB = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
        return dateB - dateA; 
      });
      
      setAllOrders(ordersWithUserData);
    } catch (error) {
      console.error("Error fetching orders: ", error);
      toast.error('Failed to load orders. Check your Firebase connection and Security Rules.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (order, newStatus) => {
    if (order.status === newStatus) return;

    const orderRef = doc(db, 'orders', order.id);
    const originalStatus = order.status; 
    
    // Optimistic UI update (Instant change on screen)
    setAllOrders(prevOrders => prevOrders.map(o => o.id === order.id ? { ...o, status: newStatus } : o));

    try {
        // Stock management logic (Shipped -> Stock Down)
        if (newStatus === 'Shipped' && originalStatus !== 'Shipped') {
            for (const item of order.items) {
                const productRef = doc(db, 'products', item.id);
                const productSnap = await getDoc(productRef);
                if (productSnap.exists()) {
                    const currentStock = Number(productSnap.data().stock) || 0;
                    const newStock = currentStock - (item.quantity || 1);
                    await updateDoc(productRef, { stock: newStock < 0 ? 0 : newStock });
                } else {
                    toast.error(`Product ID ${item.id} not found. Stock could not be updated.`);
                }
            }
        }
        // Stock management logic (Cancelled -> Stock Up)
        else if (newStatus === 'Cancelled' && originalStatus !== 'Cancelled') {
             for (const item of order.items) {
                const productRef = doc(db, 'products', item.id);
                const productSnap = await getDoc(productRef);
                if (productSnap.exists()) {
                    const currentStock = Number(productSnap.data().stock) || 0;
                    const newStock = currentStock + (item.quantity || 1);
                    await updateDoc(productRef, { stock: newStock });
                } else {
                    toast.error(`Product ID ${item.id} not found. Stock could not be rolled back.`);
                }
            }
        }

        // Update order status in Firestore
        await updateDoc(orderRef, { status: newStatus });
        toast.success(`Order ${order.id.substring(0, 8)} status updated to ${newStatus}!`);

    } catch (err) {
        // Revert optimistic update and show clear error
        setAllOrders(prevOrders => prevOrders.map(o => o.id === order.id ? { ...o, status: originalStatus } : o));
        console.error("Failed to update status or stock:", err);
        toast.error(`Status update failed! Error: ${err.message || 'Check console for details.'}`);
    }
};


  const handleShowModal = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Shipped': return 'info';
      case 'Delivered': return 'success';
      case 'Cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const StatusBadge = ({ status }) => (
      <Badge bg={getStatusVariant(status)} className="p-2 fw-semibold" style={{ minWidth: '80px' }}>
          {status}
      </Badge>
  );

  const StatusDropdown = ({ order }) => (
    <Dropdown>
        <Dropdown.Toggle variant="outline-secondary" size="sm" id={`dropdown-${order.id}`} className="d-flex align-items-center gap-1">
            <StatusIcon /> Change Status
        </Dropdown.Toggle>
        <Dropdown.Menu>
            {['Pending', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
                <Dropdown.Item 
                    key={status} 
                    onClick={() => handleStatusChange(order, status)}
                    active={order.status === status}
                >
                    {status}
                </Dropdown.Item>
            ))}
        </Dropdown.Menu>
    </Dropdown>
  );
  
  // NEW COMPONENT: Order Card View for Mobile
  const OrderCard = ({ order }) => {
    const orderDate = safeDateConversion(order.createdAt);
    const isCritical = order.status === 'Pending' && orderDate && (new Date() - orderDate) > (24 * 60 * 60 * 1000); 

    return (
        <Card className={`mb-3 shadow-sm ${isCritical ? 'border-danger border-3' : ''}`}>
            <Card.Header className='fw-bold d-flex justify-content-between align-items-center bg-light'>
                Order: {order.id.substring(0, 8)}...
                <StatusBadge status={order.status} />
            </Card.Header>
            <Card.Body>
                <p className='mb-1'><strong>Customer:</strong> {order.customerName}</p>
                {/* FIXED: Phone number display */}
                <p className='mb-1'><strong>Phone:</strong> {order.shippingDetails.phone || 'N/A'}</p>
                <p className='mb-1'><strong>Total:</strong> <span className='fw-bold text-success'>₹{Number(order.totalAmount).toFixed(2)}</span></p>
                <p className='mb-3'><strong>Date:</strong> {orderDate ? orderDate.toLocaleDateString() : 'N/A'} <small className='text-muted'>({orderDate ? orderDate.toLocaleTimeString() : 'N/A'})</small></p>
                
                <div className='d-flex justify-content-between align-items-center'>
                    <Button variant="primary" size="sm" onClick={() => handleShowModal(order)} className="d-flex align-items-center gap-1">
                        <EyeIcon /> View Details
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
  };

  if (loading) {
    return <Container className="text-center p-5"><Spinner animation="border" className='me-2'/>Loading Order Command Center...</Container>;
  }

  return (
    <Container fluid className="p-4">
      <h2 className="mb-4 fw-bolder">Order Command Center 🚀</h2>
      
      {/* Status Filter, Search, and View Toggle */}
      <Row className='mb-4'>
        <Col xs={12} md={8}>
            <InputGroup className='shadow-sm'>
                <InputGroup.Text><SearchIcon /></InputGroup.Text>
                <Form.Control 
                    placeholder="Search by Order ID, Customer Name, Email, or City..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </InputGroup>
        </Col>
        <Col xs={12} md={4} className='d-flex justify-content-end mt-3 mt-md-0'>
            <Dropdown as={ButtonGroup} className='me-3 shadow-sm'>
                <Dropdown.Toggle variant="outline-primary" id="filter-dropdown">
                    Status: {filterStatus}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                    {allStatuses.map(status => (
                        <Dropdown.Item key={status} onClick={() => setFilterStatus(status)} active={filterStatus === status}>
                            {status}
                        </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
            </Dropdown>
            
            <ButtonGroup className='shadow-sm'>
                <Button 
                    variant={viewMode === 'table' ? 'primary' : 'outline-secondary'}
                    onClick={() => setViewMode('table')}
                    title="Table View"
                >
                    <ListIcon />
                </Button>
                <Button 
                    variant={viewMode === 'card' ? 'primary' : 'outline-secondary'}
                    onClick={() => setViewMode('card')}
                    title="Card View"
                >
                    <CardIcon />
                </Button>
            </ButtonGroup>
        </Col>
      </Row>
      

      {/* DESKTOP VIEW (Table) */}
      <div className={`d-none d-md-block ${viewMode === 'table' ? '' : 'd-none'}`}>
          <Table striped bordered hover responsive className='shadow-sm'>
            <thead>
              <tr className='bg-light'>
                <th>Order ID</th>
                <th>Date & Time</th>
                <th>Customer</th>
                <th>Phone</th> {/* FIXED: Phone column */}
                <th>Total Paid</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const orderDate = safeDateConversion(order.createdAt);
                const isCritical = order.status === 'Pending' && orderDate && (new Date() - orderDate) > (24 * 60 * 60 * 1000); 

                return (
                <tr key={order.id} className={isCritical ? 'table-danger' : ''}>
                  <td><small className='text-muted'>{order.id.substring(0, 8)}...</small></td>
                  <td>
                    {orderDate 
                        ? <><span className='fw-bold'>{orderDate.toLocaleDateString()}</span> <br/><small className='text-muted'>{orderDate.toLocaleTimeString()}</small></>
                        : 'N/A'
                    }
                  </td>
                  <td>
                    <span className='fw-semibold'>{order.customerName}</span>
                    <br/>
                    <small className='text-muted'>{order.shippingDetails.city || 'City N/A'}</small> {/* FIXED: Robust city display */}
                  </td>
                  <td>{order.shippingDetails.phone || 'N/A'}</td> {/* FIXED: Robust phone display */}
                  <td><span className='fw-bold text-success'>₹{Number(order.totalAmount).toFixed(2)}</span></td>
                  <td><StatusBadge status={order.status} /></td>
                  <td style={{ minWidth: '100px' }}> 
                    <Button variant="primary" size="sm" onClick={() => handleShowModal(order)} className="d-flex align-items-center gap-1" title="View Order Details">
                      <EyeIcon width="16" height="16" /> View
                    </Button>
                  </td>
                </tr>
              )})}
            </tbody>
          </Table>
      </div>

      {/* MOBILE VIEW (Card List) */}
      <div className={`d-md-none ${viewMode === 'card' ? '' : 'd-none'}`}>
          {orders.map(order => <OrderCard key={order.id} order={order} />)}
      </div>
      
      {orders.length === 0 && !loading && (
        <Alert variant='info' className='text-center'>No orders found for the current filter/search criteria.</Alert>
      )}

      {/* --- Order Details Modal (FULLY FIXED) --- */}
      {selectedOrder && (
        <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title className="fw-bold">Order Details: <span className='text-uppercase'>{selectedOrder.id.substring(0, 8)}...</span></Modal.Title>
          </Modal.Header>
          <Modal.Body>
                <Row className='mb-4'>
                    <Col md={6}>
                        <h5 className='fw-bold text-primary'>Summary</h5>
                        <p className='mb-1'><strong>Status:</strong> <StatusBadge status={selectedOrder.status} /></p>
                        <p className='mb-1'><strong>Date:</strong> {safeDateConversion(selectedOrder.createdAt)?.toLocaleDateString() || 'N/A'}</p>
                        <p className='mb-1'><strong>Time:</strong> {safeDateConversion(selectedOrder.createdAt)?.toLocaleTimeString() || 'N/A'}</p>
                        <p className='mb-1'><strong>Method:</strong> {selectedOrder.paymentMethod || 'N/A'}</p>
                        <p className='mb-1'><strong>Total Paid:</strong> <span className='fw-bold text-success'>₹{Number(selectedOrder.totalAmount).toFixed(2)}</span></p>
                    </Col>
                    <Col md={6} className='border-start'>
                        <h5 className='fw-bold text-primary'>Customer Info</h5>
                        <p className='mb-1'><strong>Name:</strong> {selectedOrder.customerName}</p>
                        <p className='mb-1'><strong>Email:</strong> {selectedOrder.userEmail}</p>
                        <p className='mb-1'><strong>Phone:</strong> {selectedOrder.shippingDetails.phone}</p>
                    </Col>
                </Row>
                <hr />
                
            <h5>Shipping Address</h5>
            <p className='bg-light p-3 rounded'>
              {/* FIXED: Direct access using robust fields */}
              <strong>Address:</strong> {`${selectedOrder.shippingDetails.address}, ${selectedOrder.shippingDetails.city}, ${selectedOrder.shippingDetails.state} - ${selectedOrder.shippingDetails.postalCode}`}<br/>
              <strong>Landmark:</strong> {selectedOrder.shippingDetails.landmark}
            </p>
            <hr />
            <h5>Items ({selectedOrder.items.length})</h5>
            <ListGroup variant="flush" className='border rounded'>
              {selectedOrder.items.map(item => (
                <ListGroup.Item key={item.id} className='d-flex justify-content-between align-items-center'>
                      <div className='d-flex align-items-center'>
                          {/* FIXED: Product Image Display with 'cover' object-fit for full look */}
                          {item.src ? (
                            <img 
                                src={item.src} 
                                alt={item.name} 
                                style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #eee', marginRight: '1rem' }} 
                                onError={(e) => { e.target.onerror = null; e.target.parentNode.prepend(<ProductImagePlaceholder />); e.target.remove(); }}
                            />
                          ) : <ProductImagePlaceholder />}
                          
                          <span className='fw-semibold'>{item.name || 'Product Missing Name'}</span>
                      </div>
                    <div className='text-end'>
                          <Badge bg="secondary" className='me-2'>Qty: {item.quantity || 1}</Badge>
                          <span className='fw-bold'>₹{Number(item.price * (item.quantity || 1)).toFixed(2)}</span>
                      </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Modal.Body>
          <Modal.Footer>
              {/* Status dropdown placed here (ONLY in modal) */}
              <StatusDropdown order={selectedOrder} />
            <Button variant="secondary" onClick={handleCloseModal}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </Container>
  );
};

export default ManageOrders;