import React, { useState, useEffect, useMemo } from 'react';
import { db } from '/src/firebase.js'; // Assuming this path is correct
import { 
    collection, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query, 
    where, 
    writeBatch
} from 'firebase/firestore';
import { 
    Container, 
    Table, 
    Button, 
    Alert, 
    Spinner, 
    Form, 
    InputGroup,
    Toast, 
    ToastContainer
} from 'react-bootstrap';

// ==========================================================
// --- CUSTOM SVG ICONS (As requested by user) ---
// ==========================================================

// 1. Restore Icon (Using the provided Reload SVG)
const RestoreSvg = ({ width = "20", height = "20", fill = "currentColor" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} fill={fill} viewBox="0 0 20 20">
        <path fill="currentColor" d="M14.66 15.66A8 8 0 1 1 17 10h-2a6 6 0 1 0-1.76 4.24l1.42 1.42zM12 10h8l-4 4l-4-4z"></path>
    </svg>
);

// 2. Permanent Delete Icon (Using the provided Delete SVG)
const PermanentDeleteSvg = ({ width = "20", height = "20", fill = "currentColor" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} fill={fill} viewBox="0 0 26 26">
        <path fill="currentColor" d="M11.5-.031c-1.958 0-3.531 1.627-3.531 3.594V4H4c-.551 0-1 .449-1 1v1H2v2h2v15c0 1.645 1.355 3 3 3h12c1.645 0 3-1.355 3-3V8h2V6h-1V5c0-.551-.449-1-1-1h-3.969v-.438c0-1.966-1.573-3.593-3.531-3.593h-3zm0 2.062h3c.804 0 1.469.656 1.469 1.531V4H10.03v-.438c0-.875.665-1.53 1.469-1.53zM6 8h5.125c.124.013.247.031.375.031h3c.128 0 .25-.018.375-.031H20v15c0 .563-.437 1-1 1H7c-.563 0-1-.437-1-1V8zm2 2v12h2V10H8zm4 0v12h2V10h-2zm4 0v12h2V10h-2z"></path>
    </svg>
);

// 3. Search Icon (Keeping a standard clean search for utility)
const SearchSvg = ({ width = "20", height = "20", fill = "currentColor" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} fill={fill} viewBox="0 0 16 16">
        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
    </svg>
);

// 4. Recycle Bin Icon for Heading (Using the Delete SVG, but larger)
const BinSvg = ({ width = "28", height = "28", fill = "currentColor" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} fill={fill} viewBox="0 0 26 26">
        <path fill="currentColor" d="M11.5-.031c-1.958 0-3.531 1.627-3.531 3.594V4H4c-.551 0-1 .449-1 1v1H2v2h2v15c0 1.645 1.355 3 3 3h12c1.645 0 3-1.355 3-3V8h2V6h-1V5c0-.551-.449-1-1-1h-3.969v-.438c0-1.966-1.573-3.593-3.531-3.593h-3zm0 2.062h3c.804 0 1.469.656 1.469 1.531V4H10.03v-.438c0-.875.665-1.53 1.469-1.53zM6 8h5.125c.124.013.247.031.375.031h3c.128 0 .25-.018.375-.031H20v15c0 .563-.437 1-1 1H7c-.563 0-1-.437-1-1V8zm2 2v12h2V10H8zm4 0v12h2V10h-2zm4 0v12h2V10h-2z"></path>
    </svg>
);


// --- UTILITY: Toast Component ---
const CustomToast = ({ show, onClose, variant, title, message }) => (
    <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1080 }}>
        <Toast show={show} onClose={onClose} bg={variant} delay={3500} autohide>
            <Toast.Header closeButton>
                <strong className={`me-auto text-${variant === 'warning' || variant === 'light' ? 'dark' : 'white'}`}>{title}</strong>
            </Toast.Header>
            <Toast.Body className={`text-${variant === 'light' ? 'dark' : 'white'}`}>{message}</Toast.Body>
        </Toast>
    </ToastContainer>
);


const RecycleBin = () => {
    const [deletedProducts, setDeletedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProducts, setSelectedProducts] = useState(new Set());
    const [toast, setToast] = useState({ show: false, message: '', variant: 'success', title: '' });
    const [brokenImages, setBrokenImages] = useState(new Set()); 

    // --- Data Fetching ---
    const fetchDeletedProducts = async () => {
        setLoading(true);
        setError(null);
        setBrokenImages(new Set()); 
        try {
            const q = query(collection(db, 'products'), where('status', '==', 'deleted'));
            const productSnapshot = await getDocs(q);
            const productList = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setDeletedProducts(productList);
        } catch (err) {
            console.error('Error fetching deleted products:', err);
            setError('Failed to load deleted products. Please check your network connection or Firebase configuration.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeletedProducts();
    }, []);

    // --- Search/Filter Logic ---
    const filteredProducts = useMemo(() => {
        if (!searchTerm) return deletedProducts;
        const lowerCaseSearch = searchTerm.toLowerCase();
        return deletedProducts.filter(product =>
            product.name?.toLowerCase().includes(lowerCaseSearch) ||
            product.id?.toLowerCase().includes(lowerCaseSearch)
        );
    }, [deletedProducts, searchTerm]);

    // --- Image Error Handler ---
    const handleImageError = (productId) => {
        setBrokenImages(prev => new Set(prev).add(productId));
    };


    // --- Bulk Selection Logic ---
    const handleSelectProduct = (productId) => {
        setSelectedProducts(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(productId)) {
                newSelected.delete(productId);
            } else {
                newSelected.add(productId);
            }
            return newSelected;
        });
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = filteredProducts.map(p => p.id);
            setSelectedProducts(new Set(allIds));
        } else {
            setSelectedProducts(new Set());
        }
    };

    const isAllSelected = filteredProducts.length > 0 && selectedProducts.size === filteredProducts.length;


    // --- Action Handlers with Toast Feedback ---
    const showToast = (title, message, variant = 'success') => {
        setToast({ show: true, title, message, variant });
    };

    const handleRestore = async (id) => {
        if (!window.confirm('Are you sure you want to restore this product?')) return;
        try {
            const productRef = doc(db, 'products', id);
            await updateDoc(productRef, { status: 'active' });
            showToast('Product Restored', `Product ID: ${id} has been restored to the main list.`, 'success');
            await fetchDeletedProducts(); 
            setSelectedProducts(prev => { prev.delete(id); return new Set(prev); });
        } catch (e) {
            console.error('Error restoring product:', e);
            showToast('Restore Failed', 'Could not restore product due to an error.', 'danger');
        }
    };

    const handleDeletePermanently = async (id) => {
        if (!window.confirm('DANGER: This action is permanent and cannot be undone. Permanently delete product?')) return;
        try {
            await deleteDoc(doc(db, 'products', id));
            showToast('Permanently Deleted', `Product ID: ${id} is gone forever.`, 'warning');
            await fetchDeletedProducts(); 
            setSelectedProducts(prev => { prev.delete(id); return new Set(prev); });
        } catch (e) {
            console.error('Error permanently deleting product:', e);
            showToast('Delete Failed', 'Could not delete product permanently.', 'danger');
        }
    }
    
    // --- Bulk Actions (using Firestore Batches) ---
    const handleBulkRestore = async () => {
        if (selectedProducts.size === 0) {
            showToast('Selection Required', 'Please select at least one product for bulk restore.', 'info');
            return;
        }
        if (!window.confirm(`Are you sure you want to restore ${selectedProducts.size} product(s)?`)) return;

        try {
            const batch = writeBatch(db);
            selectedProducts.forEach(id => {
                const productRef = doc(db, 'products', id);
                batch.update(productRef, { status: 'active' });
            });
            await batch.commit();
            showToast('Bulk Restore Success', `${selectedProducts.size} products restored successfully!`, 'success');
            setSelectedProducts(new Set());
            await fetchDeletedProducts();
        } catch (e) {
            console.error('Error performing bulk restore:', e);
            showToast('Bulk Restore Failed', 'An error occurred during bulk restore.', 'danger');
        }
    };

    const handleBulkDeletePermanently = async () => {
        if (selectedProducts.size === 0) {
            showToast('Selection Required', 'Please select at least one product for permanent deletion.', 'info');
            return;
        }
        if (!window.confirm(`DANGER: You are about to permanently delete ${selectedProducts.size} product(s). This is irreversible. Confirm?`)) return;

        try {
            const batch = writeBatch(db);
            selectedProducts.forEach(id => {
                const productRef = doc(db, 'products', id);
                batch.delete(productRef);
            });
            await batch.commit();
            showToast('Bulk Delete Complete', `${selectedProducts.size} products permanently deleted!`, 'warning');
            setSelectedProducts(new Set());
            await fetchDeletedProducts();
        } catch (e) {
            console.error('Error performing bulk delete:', e);
            showToast('Bulk Delete Failed', 'An error occurred during permanent bulk deletion.', 'danger');
        }
    };


    // --- Render Logic ---
    if (loading) {
        return (
            <Container fluid className="text-center my-5">
                <Spinner animation="border" role="status" variant="secondary" />
                <p className="mt-2 text-muted">Loading deleted products...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container fluid>
                <Alert variant="danger" className="mt-4 shadow-sm">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container fluid>
            <CustomToast 
                {...toast} 
                onClose={() => setToast({ ...toast, show: false })}
            />

            <h2 className="my-4 d-flex align-items-center">
                {/* Using the new BinSvg (which is the Delete icon) */}
                <BinSvg className="me-2 text-secondary" />  Recycle Bin
            </h2>
            <p className="text-muted">Manage soft-deleted items: restore them to active status or permanently remove them from the database.</p>
            
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
                
                {/* Search Bar */}
                <InputGroup className="flex-grow-1" style={{ maxWidth: '400px' }}>
                    <InputGroup.Text className="bg-light"><SearchSvg /></InputGroup.Text>
                    <Form.Control
                        placeholder="Search by Product Name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="shadow-sm"
                    />
                </InputGroup>

                {/* Bulk Action Buttons */}
                {selectedProducts.size > 0 && (
                    <div className="d-flex gap-2">
                        <Button variant="outline-success" onClick={handleBulkRestore} disabled={loading} className="shadow-sm">
                            {/* Using the new RestoreSvg (Reload icon) */}
                            <RestoreSvg className="me-1" /> Restore All ({selectedProducts.size})
                        </Button>
                        <Button variant="danger" onClick={handleBulkDeletePermanently} disabled={loading} className="shadow-sm">
                            {/* Using the new PermanentDeleteSvg (Delete icon) */}
                            <PermanentDeleteSvg className="me-1" /> Delete Forever ({selectedProducts.size})
                        </Button>
                    </div>
                )}
            </div>

            {deletedProducts.length === 0 ? (
                <Alert variant="info" className="mt-4 shadow-sm">
                    The recycle bin is sparkling clean! All items are either restored or permanently deleted. 🎉
                </Alert>
            ) : filteredProducts.length === 0 ? (
                <Alert variant="warning" className="mt-4 shadow-sm">
                    No items found matching your search: **"{searchTerm}"**. Try a different query.
                </Alert>
            ) : (
                <div className="table-responsive">
                    <Table striped bordered hover className="shadow-sm">
                        <thead className="table-dark">
                            <tr>
                                <th style={{ width: '5%' }}>
                                    <Form.Check
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={handleSelectAll}
                                        title="Select All Filtered Items"
                                    />
                                </th>
                                <th style={{ width: '10%' }}>Image</th>
                                <th style={{ width: '40%' }}>Product Name (ID)</th>
                                <th style={{ width: '15%' }}>Price</th>
                                <th style={{ width: '30%' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map(product => {
                                const showImage = product.src && !brokenImages.has(product.id);
                                return (
                                    <tr key={product.id}>
                                        <td>
                                            <Form.Check
                                                type="checkbox"
                                                checked={selectedProducts.has(product.id)}
                                                onChange={() => handleSelectProduct(product.id)}
                                            />
                                        </td>
                                        <td>
                                            {/* Image Rendering with objectFit: 'contain' */}
                                            {showImage ? (
                                                <img 
                                                    src={product.src} 
                                                    alt={product.name} 
                                                    className="rounded p-1 border"
                                                    style={{ 
                                                        width: '70px', 
                                                        height: '70px', 
                                                        objectFit: 'contain' // Image fully visible
                                                    }} 
                                                    onError={() => handleImageError(product.id)} 
                                                />
                                            ) : (
                                                <div 
                                                    style={{ 
                                                        width: '70px', 
                                                        height: '70px', 
                                                        backgroundColor: '#e9ecef', 
                                                        borderRadius: '4px',
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center',
                                                        fontSize: '0.75rem',
                                                        textAlign: 'center'
                                                    }} 
                                                    className="text-muted small"
                                                >No Image</div>
                                            )}
                                        </td>
                                        <td>
                                            **{product.name}** <br />
                                            <small className="text-muted">ID: {product.id}</small>
                                        </td>
                                        <td><strong className="text-danger">₹{product.price}</strong></td>
                                        <td>
                                            <Button variant="success" size="sm" onClick={() => handleRestore(product.id)} className="me-2" title="Restore Product">
                                                {/* Using the new RestoreSvg (Reload icon) */}
                                                <RestoreSvg className="me-1" /> <span className="d-none d-lg-inline">Restore</span>
                                            </Button>
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDeletePermanently(product.id)} title="Delete Permanently">
                                                {/* Using the new PermanentDeleteSvg (Delete icon) */}
                                                <PermanentDeleteSvg className="me-1" /> <span className="d-none d-lg-inline">Delete Forever</span>
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                </div>
            )}
        </Container>
    );
};

export default RecycleBin;
