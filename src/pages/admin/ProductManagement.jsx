import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Modal, Form, FloatingLabel, Spinner, Alert } from 'react-bootstrap';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  // Initial state mein description joden
  const [currentProduct, setCurrentProduct] = useState({ name: '', price: 0, src: '', description: '', delay: '0' });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(productsList);
      } catch (error) {
        console.error("Error fetching products: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleClose = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentProduct({ name: '', price: 0, src: '', description: '', delay: '0' });
  };

  const handleShow = (product = null) => {
    if (product) {
      setIsEditing(true);
      setCurrentProduct(product);
    } else {
      setIsEditing(false);
      setCurrentProduct({ name: '', price: 0, src: '', description: '', delay: '0' });
    }
    setShowModal(true);
  };
  
  const handleSave = async () => {
    if (!currentProduct.name || !currentProduct.src || !currentProduct.description || currentProduct.price <= 0) {
      alert('Please fill all fields correctly.');
      return;
    }

    if (isEditing) {
      // Update existing product
      const productDoc = doc(db, 'products', currentProduct.id);
      await updateDoc(productDoc, { ...currentProduct });
      setProducts(products.map(p => p.id === currentProduct.id ? currentProduct : p));
    } else {
      // Add new product
      const docRef = await addDoc(collection(db, 'products'), currentProduct);
      setProducts([...products, { id: docRef.id, ...currentProduct }]);
    }
    handleClose();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      await deleteDoc(doc(db, 'products', id));
      setProducts(products.filter(p => p.id !== id));
    }
  };

  if (loading) return <Spinner animation="border" />;

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Product Management</h3>
        <Button variant="primary" onClick={() => handleShow()}>Add New Product</Button>
      </div>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id}>
              <td><img src={product.src} alt={product.name} width="50" /></td>
              <td>{product.name}</td>
              <td>₹{product.price}</td>
              <td>
                <Button variant="outline-primary" size="sm" onClick={() => handleShow(product)}>Edit</Button>{' '}
                <Button variant="outline-danger" size="sm" onClick={() => handleDelete(product.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? 'Edit Product' : 'Add New Product'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <FloatingLabel label="Product Name" className="mb-3">
              <Form.Control type="text" value={currentProduct.name} onChange={(e) => setCurrentProduct({...currentProduct, name: e.target.value})} />
            </FloatingLabel>
            <FloatingLabel label="Price" className="mb-3">
              <Form.Control type="number" value={currentProduct.price} onChange={(e) => setCurrentProduct({...currentProduct, price: Number(e.target.value)})} />
            </FloatingLabel>
            <FloatingLabel label="Image URL" className="mb-3">
              <Form.Control type="text" value={currentProduct.src} onChange={(e) => setCurrentProduct({...currentProduct, src: e.target.value})} />
            </FloatingLabel>

            {/* === YAHAN NAYA DESCRIPTION FIELD JODA GAYA HAI === */}
            <FloatingLabel label="Description" className="mb-3">
              <Form.Control 
                as="textarea" 
                rows={4} 
                value={currentProduct.description} 
                onChange={(e) => setCurrentProduct({...currentProduct, description: e.target.value})} 
              />
            </FloatingLabel>
            
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>Close</Button>
          <Button variant="primary" onClick={handleSave}>Save Changes</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProductManagement;