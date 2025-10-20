import React, { useState, useEffect } from 'react';
import { db } from '/src/firebase.js'; // FIX: Corrected import path
import { collection, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { Container, Table, Button, Alert } from 'react-bootstrap';

// --- ICONS ---
const RestoreIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
        <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
    </svg>
);

const PermanentDeleteIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M6.854 5.146a.5.5 0 1 0-.708.708L7.293 7 6.146 8.146a.5.5 0 1 0 .708.708L8 7.707l1.146 1.147a.5.5 0 1 0 .708-.708L8.707 7l1.147-1.146a.5.5 0 0 0-.708-.708L8 6.293 6.854 5.146z"/>
        <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
    </svg>
);


const RecycleBin = () => {
    const [deletedProducts, setDeletedProducts] = useState([]);

    const fetchDeletedProducts = async () => {
        const q = query(collection(db, 'products'), where('status', '==', 'deleted'));
        const productSnapshot = await getDocs(q);
        const productList = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDeletedProducts(productList);
    };

    useEffect(() => {
        fetchDeletedProducts();
    }, []);

    const handleRestore = async (id) => {
        if (window.confirm('Are you sure you want to restore this product?')) {
            const productRef = doc(db, 'products', id);
            await updateDoc(productRef, { status: 'active' });
            fetchDeletedProducts(); // Refresh list
        }
    };

    const handleDeletePermanently = async (id) => {
        if (window.confirm('DANGER: This action is permanent and cannot be undone. Are you sure you want to permanently delete this product?')) {
            await deleteDoc(doc(db, 'products', id));
            fetchDeletedProducts(); // Refresh list
        }
    };

    return (
        <Container fluid>
            <h2 className="my-4">Recycle Bin</h2>
            <p>Products here have been deleted from the main list. You can either restore them or delete them permanently.</p>
            
            {deletedProducts.length === 0 ? (
                <Alert variant="info" className="mt-4">
                    The recycle bin is empty.
                </Alert>
            ) : (
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
                        {deletedProducts.map(product => (
                            <tr key={product.id}>
                                <td><img src={product.src} alt={product.name} style={{ width: '50px', height: 'auto' }} /></td>
                                <td>{product.name}</td>
                                <td>₹{product.price}</td>
                                <td>
                                    <Button variant="outline-success" size="sm" onClick={() => handleRestore(product.id)} className="me-2" title="Restore Product">
                                        <RestoreIcon /> <span className="d-none d-md-inline">Restore</span>
                                    </Button>
                                    <Button variant="danger" size="sm" onClick={() => handleDeletePermanently(product.id)} title="Delete Permanently">
                                        <PermanentDeleteIcon /> <span className="d-none d-md-inline">Delete Forever</span>
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </Container>
    );
};

export default RecycleBin;

