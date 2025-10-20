/**
 * =================================================================
 * ProductManagement.jsx - V21 "Growth Command Center"
 * =================================================================
 * ENHANCEMENT:
 * - Page title made highly impactful (Growth Command Center).
 * - All icons are clean SVGs and code logic is preserved.
 * =================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '/src/firebase.js'; 
import { collection, getDocs, addDoc, updateDoc, doc, query, where, serverTimestamp } from 'firebase/firestore';
import { Container, Table, Button, Modal, Form, FloatingLabel, Alert, Spinner, Row, Col, InputGroup, Badge, Tabs, Tab } from 'react-bootstrap';
import { toast } from 'react-hot-toast';

// ===============================================
// CLEANED, GLITCH-FREE SVG ICONS (Final Set)
// ===============================================
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const SeoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 0 4 10 15.3 15.3 0 0 0-4 10 15.3 15.3 0 0 0-4-10 15.3 15.3 0 0 0 4-10z"></path><line x1="2.1" y1="12" x2="21.9" y2="12"></line></svg>;
const AiSparkleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.5 12.5l-5-5M12.5 12.5l5 5M12.5 12.5l-5 5M12.5 12.5l5-5"></path><path d="M21 10c0 7-9 11-9 11s-9-4-9-11a9 9 0 0 1 18 0z"></path></svg>;
const GridIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="12" x2="21" y2="12"></line><line x1="12" y1="3" x2="12" y2="21"></line></svg>;
const ProductIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>;
const InventoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;


// --- Helper Component: Product Image Placeholder ---
const ProductPlaceholder = () => (
    <div className="d-flex align-items-center justify-content-center bg-light text-muted" style={{ width: '100%', height: '150px', borderRadius: '0.5rem', border: '1px solid var(--bs-gray-300)' }}>
        <GridIcon width="32" height="32" />
    </div>
);


const ProductManagement = () => {
    const initialFormState = { name: '', price: '0', src: '', description: '', isBestSeller: false, stock: '0', category: '', status: 'active',
        metaDescription: '', focusKeywords: '', instagramHashtags: '' };

    const [allProducts, setAllProducts] = useState([]); 
    const [products, setProducts] = useState([]); 
    const [searchTerm, setSearchTerm] = useState(''); 
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGeneratingAi, setIsGeneratingAi] = useState(false); 
    const [formData, setFormData] = useState(initialFormState);
    const [key, setKey] = useState('details'); 

    // --- Data Fetching (Logic Preserved) ---
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'products')); 
            const productSnapshot = await getDocs(q);
            const productList = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            const activeProducts = productList.filter(p => p.status === 'active');
            
            setAllProducts(productList); 
            setProducts(activeProducts); 
            
        } catch (error) {
            console.error("Error fetching products: ", error);
            toast.error("Failed to fetch products.");
        } finally {
            setLoading(false);
        }
    }, []);

    // --- Search/Filter Logic (Logic Preserved) ---
    useEffect(() => {
        const lowerCaseSearch = searchTerm.toLowerCase();
        
        const filtered = allProducts.filter(product => product.status === 'active' && (
            product.name.toLowerCase().includes(lowerCaseSearch) ||
            product.category.toLowerCase().includes(lowerCaseSearch) ||
            product.id.toLowerCase().includes(lowerCaseSearch)
        ));
        setProducts(filtered);
    }, [searchTerm, allProducts]); 

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // --- Modal/Form Handlers (Logic Preserved) ---
    const handleShowModal = (product = null) => {
        if (product) {
            setCurrentProduct(product);
            setFormData({
                ...initialFormState,
                ...product,
                price: String(product.price || 0),
                stock: String(product.stock || 0),
            });
            setIsEditing(true);
        } else {
            setCurrentProduct(null);
            setFormData(initialFormState);
            setIsEditing(false);
        }
        setKey('details'); 
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setCurrentProduct(null);
        setFormData(initialFormState);
        setIsSubmitting(false);
    };

    const handleFormChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // --- AI GENERATORS (Logic Preserved) ---
    const handleGenerateName = async () => {
        if (!formData.category) {
            toast.error("Please select a Category first.");
            return;
        }

        setIsGeneratingAi(true);
        toast.loading("Generating product name with AI...", { id: 'ai-gen-name' });

        const keywordsArray = ['Regal', 'Opulent', 'Charming', 'Divine', 'Signature', 'Majestic', 'Timeless', 'Exquisite'];
        const randomAdjective = keywordsArray[Math.floor(Math.random() * keywordsArray.length)];
        const keywords = formData.focusKeywords ? formData.focusKeywords.split(',').map(k => k.trim()).filter(k => k).slice(0, 2).join(' & ') : 'Chikankari';
        const category = formData.category.replace(/s$/, ''); 
        
        const mockName = `AI Suggested: ${randomAdjective} ${category} - ${keywords} Luxury Piece`;
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setFormData(prev => ({ ...prev, name: mockName }));
        setIsGeneratingAi(false);
        toast.dismiss('ai-gen-name');
        toast.success("AI name generated and applied!");
    };

    const handleGenerateDescription = async () => {
        if (!formData.name || !formData.category) {
            toast.error("Please enter Product Name and Category first.");
            return;
        }

        setIsGeneratingAi(true);
        toast.loading("Generating description with AI...", { id: 'ai-gen-desc' });

        const keywords = formData.focusKeywords ? `, focusing on: ${formData.focusKeywords}` : '';
        const mockDescription = `AI Generated: Presenting the exquisite ${formData.name} from The Lucknowi Thread's ${formData.category} collection. This piece is renowned for its delicate hand-embroidery and superior fabric quality${keywords}. Experience the blend of tradition and luxury. Limited stock available.`;
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setFormData(prev => ({ ...prev, description: mockDescription }));
        setIsGeneratingAi(false);
        toast.dismiss('ai-gen-desc');
        toast.success("AI description generated and applied!");
    };


    // --- Firestore Operations (Logic Preserved) ---
    const handleSaveProduct = async (e) => {
        e.preventDefault();
        
        if (!formData.name || !formData.price || !formData.stock || !formData.src || !formData.category) {
            toast.error("Please fill in all required fields.");
            return;
        }
        
        setIsSubmitting(true);
        
        const productData = { 
            ...formData, 
            price: Number(formData.price), 
            stock: Number(formData.stock),
            status: 'active',
        };

        const finalProductData = { ...productData };
        delete finalProductData.id; 

        try {
            if (isEditing && currentProduct) {
                await updateDoc(doc(db, 'products', currentProduct.id), finalProductData);
                toast.success("Product updated successfully!");
            } else {
                await addDoc(collection(db, 'products'), { ...finalProductData, createdAt: serverTimestamp() });
                toast.success("Product added successfully!");
            }
            fetchProducts();
            handleCloseModal();
        } catch (error) {
            console.error("Error saving product: ", error);
            toast.error("Failed to save product.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const performSoftDelete = async (id) => {
        try {
            await updateDoc(doc(db, 'products', id), { status: 'deleted' });
            toast.success('Product moved to Recycle Bin!');
            fetchProducts();
        } catch (error) {
            console.error("Error deleting product: ", error);
            toast.error("Failed to delete product.");
        }
    };
    
    const handleSoftDelete = (id) => {
        toast((t) => (
            <span className="toast-confirmation d-flex flex-column align-items-center">
                <span className="mb-2">Move to Recycle Bin?</span>
                <div className='d-flex gap-2'>
                    <Button variant="danger" size="sm" onClick={() => { performSoftDelete(id); toast.dismiss(t.id); }}>Confirm</Button>
                    <Button variant="secondary" size="sm" onClick={() => toast.dismiss(t.id)}>Cancel</Button>
                </div>
            </span>
        ), { duration: 6000 });
    };

    // --- Helper Component: Image Preview in Modal ---
    const ModalImagePreview = () => {
        const imageUrl = formData.src;
        if (!imageUrl || imageUrl.length < 5) return <ProductPlaceholder />;
        
        return (
            <div className="mb-3 d-flex flex-column align-items-center">
                 <img 
                    src={imageUrl} 
                    alt="Live Product Preview" 
                    style={{ maxHeight: '200px', objectFit: 'contain', width: '100%', borderRadius: '0.5rem', border: '1px solid var(--bs-gray-300)' }}
                    onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentNode.prepend(ProductPlaceholder()); }}
                />
            </div>
        );
    };

    const uniqueCategories = [...new Set(allProducts.map(p => p.category).filter(c => c))];

    return (
        <Container fluid>
            <div className="d-flex justify-content-between align-items-center my-4 pb-2 border-bottom">
                
                {/* FINAL TEXT ENHANCEMENT */}
                <h2 className='fw-bolder text-primary' style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    Product Catalog & Growth Command Center
                </h2>
                
                <Button onClick={() => handleShowModal()} variant="primary" className="d-flex align-items-center gap-2 shadow-sm px-4 py-2 fw-semibold d-none d-lg-flex">
                    <PlusIcon /> Add New Product
                </Button>
                 <Button onClick={() => handleShowModal()} variant="primary" className="d-lg-none shadow-lg rounded-circle" style={{ width: '45px', height: '45px', padding: 0 }}>
                    <PlusIcon />
                </Button>
            </div>
            
            {/* NEW TAGLINE FOR IMPACT */}
            <p className='text-muted lead fw-normal mb-4'>
                Apne saare products, stock, aur SEO ko yahan se Intelligent Tarika se manage karein.
            </p>

            
            {/* NEW: Search/Filter Bar */}
            <Row className="mb-4">
                <Col md={8} lg={6}>
                    <InputGroup className="shadow-sm">
                        <InputGroup.Text><SearchIcon /></InputGroup.Text>
                        <Form.Control
                            type="text"
                            placeholder="Search by Product Name, Category or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>
                </Col>
                <Col md={4} lg={6} className="d-flex align-items-center text-muted small mt-2 mt-md-0">
                    Showing {products.length} active products.
                </Col>
            </Row>

            
            {loading ? <div className="text-center p-5"><Spinner animation="border" /></div> : products.length === 0 ? (
                <Alert variant="info" className="p-4">No active products found matching "{searchTerm || 'filter'}".</Alert>
            ) : (
                <Table striped bordered hover responsive className='shadow-sm'>
                    {/* Table Head and Body */}
                    <thead>
                        <tr>
                            <th>Image</th><th>Name & Category</th><th>Price</th><th>Stock Status</th><th>Best Seller</th><th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product.id}>
                                <td style={{ width: '70px', height: '70px', padding: '0.25rem' }}>
                                    <img 
                                        src={product.src} 
                                        alt={product.name} 
                                        style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px', border: '1px solid #ddd' }} 
                                        onError={(e) => { e.target.onerror = null; e.target.style.opacity = 0; }}
                                    />
                                </td>
                                <td style={{ minWidth: '200px' }}>
                                    <div className='fw-bold'>{product.name}</div>
                                    <Badge bg="secondary" className="text-white">{product.category}</Badge>
                                </td>
                                <td><span className='fw-bold text-success'>₹{Number(product.price).toLocaleString()}</span></td>
                                <td>
                                    {/* ENHANCED STOCK STATUS */}
                                    <Badge 
                                        bg={product.stock > 10 ? 'primary' : product.stock > 0 ? 'warning' : 'danger'}
                                        className='fw-normal'
                                    >
                                        {product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock'} ({product.stock})
                                    </Badge>
                                </td>
                                <td>{product.isBestSeller ? <Badge bg="success">Yes</Badge> : 'No'}</td>
                                <td style={{ minWidth: '120px' }}>
                                    <Button variant="outline-primary" size="sm" onClick={() => handleShowModal(product)} className="me-2" title="Edit Product"><EditIcon /></Button>
                                    <Button variant="outline-danger" size="sm" onClick={() => handleSoftDelete(product.id)} title="Move to Recycle Bin"><DeleteIcon /></Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}

            {/* Product Add/Edit Modal (ULTRA-ADVANCED TABBED LAYOUT) */}
            <Modal show={showModal} onHide={handleCloseModal} centered size="xl">
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold d-flex align-items-center gap-2">
                        <ProductIcon />{isEditing ? `Edit: ${currentProduct?.name}` : 'Add New Product (AI & SEO Studio)'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSaveProduct}>
                        <Row>
                            {/* Left Column: Image Preview and Global Info */}
                            <Col md={4} className="d-flex flex-column align-items-center p-4 bg-light rounded h-100">
                                <h5 className='fw-bold mb-3 text-secondary'>Product Visuals</h5>
                                <ModalImagePreview />
                                
                                <FloatingLabel label="Image URL" className="mb-3 w-100">
                                    <Form.Control type="url" placeholder="Image URL" value={formData.src} name="src" onChange={handleFormChange} required />
                                </FloatingLabel>
                                <Alert variant="info" className="w-100 small">
                                    Product ID: {currentProduct?.id || 'New'}
                                </Alert>
                            </Col>

                            {/* Right Column: Tabbed Content */}
                            <Col md={8} className='p-4'>
                                <Tabs
                                    id="product-management-tabs"
                                    activeKey={key}
                                    onSelect={(k) => setKey(k)}
                                    className="mb-3 fw-bold"
                                >
                                    {/* TAB 1: BASIC DETAILS & AI GENERATION */}
                                    <Tab eventKey="details" title={<span className='d-flex align-items-center gap-2'><InfoIcon /> Details & AI</span>}>
                                        <div className='p-3 border rounded'>
                                            <h5 className='fw-bold text-primary mb-3'>1. Core Product Details</h5>

                                            <FloatingLabel label="Product Name" className="mb-3">
                                                <Form.Control type="text" placeholder="Product Name" value={formData.name} name="name" onChange={handleFormChange} required />
                                            </FloatingLabel>
                                            <Button 
                                                variant="outline-primary" 
                                                size="sm" 
                                                onClick={handleGenerateName} 
                                                disabled={isGeneratingAi || !formData.category}
                                                className="mb-3 d-flex align-items-center gap-1"
                                            >
                                                {isGeneratingAi ? <Spinner as="span" animation="border" size="sm" /> : <AiSparkleIcon />}
                                                Generate Name (AI)
                                            </Button>

                                            <FloatingLabel label="Category" className="mb-3">
                                                <Form.Select value={formData.category} name="category" onChange={handleFormChange} required>
                                                    <option value="">Select a Category</option>
                                                    {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                                </Form.Select>
                                            </FloatingLabel>
                                            
                                            <FloatingLabel label="Description (AI Assisted)" className="mb-3">
                                                <Form.Control as="textarea" placeholder="Product Description" name="description" style={{ height: '100px' }} value={formData.description} onChange={handleFormChange} required />
                                            </FloatingLabel>
                                            <Button 
                                                variant="outline-info" 
                                                size="sm" 
                                                onClick={handleGenerateDescription} 
                                                disabled={isGeneratingAi || !formData.name || !formData.category} 
                                                className="mb-3 d-flex align-items-center gap-2"
                                            >
                                                {isGeneratingAi ? <Spinner as="span" animation="border" size="sm" /> : <AiSparkleIcon />}
                                                Generate Description (AI)
                                            </Button>
                                        </div>
                                    </Tab>

                                    {/* TAB 2: SEO & MARKETING */}
                                    <Tab eventKey="seo" title={<span className='d-flex align-items-center gap-2'><SeoIcon /> SEO & Marketing</span>}>
                                        <div className="p-3 border rounded bg-light">
                                            <h5 className="fw-bold d-flex align-items-center gap-2 text-secondary mb-3"><SeoIcon /> SEO & Marketing Optimization</h5>
                                            
                                            <FloatingLabel label="Focus Keywords (Comma Separated)" className="mb-3">
                                                <Form.Control type="text" placeholder="silk saree, lucknowi work, party wear" value={formData.focusKeywords} name="focusKeywords" onChange={handleFormChange} />
                                            </FloatingLabel>
                                            <FloatingLabel label="Meta Description (for Google)" className="mb-3">
                                                <Form.Control as="textarea" placeholder="Max 160 characters" value={formData.metaDescription} name="metaDescription" onChange={handleFormChange} maxLength={160} />
                                            </FloatingLabel>
                                            <FloatingLabel label="Instagram Hashtags (#Chikankari #Lucknowi)" className="mb-3">
                                                <Form.Control type="text" placeholder="#Saree #Chikankari" value={formData.instagramHashtags} name="instagramHashtags" onChange={handleFormChange} />
                                            </FloatingLabel>
                                        </div>
                                    </Tab>
                                    
                                    {/* TAB 3: INVENTORY & STATUS */}
                                    <Tab eventKey="inventory" title={<span className='d-flex align-items-center gap-2'><InventoryIcon /> Inventory</span>}>
                                        <div className='p-3 border rounded'>
                                            <h5 className='fw-bold text-danger mb-3'>3. Inventory & Status</h5>
                                            
                                            <FloatingLabel label="Price (₹)" className="mb-3">
                                                <Form.Control type="number" placeholder="999" value={formData.price} name="price" onChange={handleFormChange} required min="0" />
                                            </FloatingLabel>
                                            
                                            <FloatingLabel label="Stock Quantity" className="mb-3">
                                                <Form.Control type="number" placeholder="50" value={formData.stock} name="stock" onChange={handleFormChange} required min="0" />
                                            </FloatingLabel>

                                            <Form.Check 
                                                type="switch" 
                                                id="is-best-seller" 
                                                label="Mark as Best Seller (Promote on Homepage)" 
                                                className="mb-3" 
                                                checked={!!formData.isBestSeller} 
                                                onChange={(e) => setFormData(prev => ({...prev, isBestSeller: e.target.checked}))}
                                            />
                                            <Alert variant={formData.stock > 10 ? 'success' : 'warning'} className='small'>
                                                Current Stock Status: {formData.stock} units.
                                            </Alert>

                                        </div>
                                    </Tab>

                                </Tabs>
                            </Col>
                        </Row>
                        
                        {/* Form Submit Buttons */}
                        <Modal.Footer className="px-0 pb-0 pt-4">
                            <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                            <Button variant="primary" type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : (isEditing ? 'Save Changes' : 'Add Product')}
                            </Button>
                        </Modal.Footer>
                    </Form>

                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default ProductManagement;