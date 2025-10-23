import React, { useState, useEffect, useMemo } from 'react';
import { Container, Button, Form, Alert, Row, Col, Card, Badge, InputGroup, Spinner, Tabs, Tab, ProgressBar, OverlayTrigger, Tooltip, ListGroup } from 'react-bootstrap';
import { collection, getDocs, setDoc, deleteDoc, doc, writeBatch, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase';
import CustomLoader from '../../components/CustomLoader';

// --- Reusable, High-Quality SVG Icon Components (with Refresh Icon) ---
const Icons = {
    Tag: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M6 4.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm-1 0a.5.5 0 1 0-1 0 .5.5 0 0 0 1 0z"/><path d="M2 1h4.586a1 1 0 0 1 .707.293l7 7a1 1 0 0 1 0 1.414l-4.586 4.586a1 1 0 0 1-1.414 0l-7-7A1 1 0 0 1 1 6.586V2a1 1 0 0 1 1-1zm0 5.586 7 7L13.586 9l-7-7H2v4.586z"/></svg>,
    CheckCircle: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>,
    Clock: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/></svg>,
    Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3V2h11v1z"/></svg>,
    Plus: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>,
    Wand: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3L14.25 7.5L19 9L14.25 10.5L12 15L9.75 10.5L5 9L9.75 7.5L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 3L6 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/><path d="M19 13L18 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/><path d="M3 16H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/><path d="M13 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/></svg>,
    Copy: ({ copied }) => copied ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-success" viewBox="0 0 16 16"><path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022z"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>,
    Refresh: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/></svg>,
};

const StatCard = ({ icon, title, value, variant }) => (
    <Card className={`h-100 bg-light-${variant} border-${variant}`}>
        <Card.Body className="d-flex align-items-center">
            <div className={`me-3 text-${variant}`}>{icon}</div>
            <div>
                <h5 className="mb-0 text-muted">{title}</h5>
                <p className={`fs-2 fw-bold mb-0 text-${variant}`}>{value}</p>
            </div>
        </Card.Body>
    </Card>
);

const generateCouponCode = (prefix = '') => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    return prefix ? `${prefix.toUpperCase()}-${code}` : code;
};

const CouponManagement = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false); // New state for refresh button
    const [activeTab, setActiveTab] = useState('create');
    const [copiedCode, setCopiedCode] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const initialCouponState = { code: '', type: 'percentage', value: 10, minSpend: 0, expiryDate: '', usageLimit: 100, isActive: true };
    const [newCoupon, setNewCoupon] = useState(initialCouponState);
    const [bulkPrefix, setBulkPrefix] = useState('BULK');
    const [bulkCount, setBulkCount] = useState(5);

    const fetchCoupons = async (isRefresh = false) => {
        if (isRefresh) {
            setIsRefreshing(true);
        } else {
            setLoading(true);
        }
        try {
            const couponsQuery = query(collection(db, 'coupons'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(couponsQuery);
            const couponsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCoupons(couponsList);
        } catch (err) { setError('Could not load coupons.'); } 
        finally { 
            if (isRefresh) {
                setIsRefreshing(false);
            } else {
                setLoading(false);
            }
        }
    };

    useEffect(() => { fetchCoupons(); }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewCoupon(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleAddCoupon = async (e) => {
        e.preventDefault();
        if (!newCoupon.code || !newCoupon.value) { alert('Please fill code and value.'); return; }
        setIsSubmitting(true);
        const couponRef = doc(db, 'coupons', newCoupon.code.toUpperCase());
        await setDoc(couponRef, {
            ...newCoupon, code: newCoupon.code.toUpperCase(), value: Number(newCoupon.value),
            minSpend: Number(newCoupon.minSpend), usageLimit: Number(newCoupon.usageLimit),
            usageCount: 0, createdAt: new Date(),
        });
        setNewCoupon(initialCouponState);
        await fetchCoupons(true);
        setIsSubmitting(false);
    };
    
    const handleBulkGenerate = async () => {
        if (!bulkPrefix || bulkCount < 1) { alert("Please provide a prefix and a valid count."); return; }
        if (!window.confirm(`Generate ${bulkCount} coupons with prefix "${bulkPrefix}" using the settings from the 'Create Single' tab?`)) return;
        setIsSubmitting(true);
        const batch = writeBatch(db);
        for (let i = 0; i < bulkCount; i++) {
            const code = generateCouponCode(bulkPrefix);
            const couponRef = doc(db, "coupons", code);
            batch.set(couponRef, { ...newCoupon, code, usageCount: 0, createdAt: new Date() });
        }
        await batch.commit();
        await fetchCoupons(true);
        setIsSubmitting(false);
    };

    const handleDeleteCoupon = async (code) => {
        if (window.confirm(`Are you sure you want to delete "${code}"?`)) {
            await deleteDoc(doc(db, 'coupons', code));
            await fetchCoupons(true);
        }
    };

    const handleToggleStatus = async (coupon) => {
        const couponRef = doc(db, 'coupons', coupon.id);
        await setDoc(couponRef, { isActive: !coupon.isActive }, { merge: true });
        await fetchCoupons(true);
    };
    
    const handleCopy = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const getStatus = (coupon) => {
        if (!coupon.isActive) return { text: 'Inactive', variant: 'secondary' };
        if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) return { text: 'Expired', variant: 'danger' };
        if (coupon.usageCount >= coupon.usageLimit) return { text: 'Used Up', variant: 'warning' };
        return { text: 'Active', variant: 'success' };
    };
    
    const filteredCoupons = useMemo(() => {
        return coupons
            .filter(c => statusFilter === 'All' || getStatus(c).text === statusFilter)
            .filter(c => c.code.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [coupons, searchTerm, statusFilter]);
    
    const couponStats = useMemo(() => {
        const now = new Date();
        const activeCoupons = coupons.filter(c => c.isActive && (!c.expiryDate || new Date(c.expiryDate) > now) && c.usageCount < c.usageLimit);
        return { total: coupons.length, active: activeCoupons.length, expired: coupons.length - activeCoupons.length };
    }, [coupons]);

    if (loading) return <CustomLoader message="Loading Coupons..." />;
    
    const renderTooltip = (props, text) => <Tooltip {...props}>{text}</Tooltip>;

    return (
        <Container fluid>
            <h3 className="mb-4">Coupon Management Dashboard</h3>
            
            <Row className="mb-4">
                <Col md={4} className="mb-3"><StatCard icon={<Icons.Tag className="display-6"/>} title="Total Coupons" value={couponStats.total} variant="primary" /></Col>
                <Col md={4} className="mb-3"><StatCard icon={<Icons.CheckCircle className="display-6"/>} title="Active Now" value={couponStats.active} variant="success" /></Col>
                <Col md={4} className="mb-3"><StatCard icon={<Icons.Clock className="display-6"/>} title="Expired/Used" value={couponStats.expired} variant="danger" /></Col>
            </Row>

            {error && <Alert variant="danger">{error}</Alert>}

            <Row>
                <Col lg={8} className="mb-3 mb-lg-0">
                    <Card>
                        <Card.Header as="h4" className="d-flex justify-content-between align-items-center bg-light">
                            Existing Coupons
                            <div className="d-flex align-items-center">
                                <Form.Control size="sm" type="text" placeholder="Search by code..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{width: '200px'}} />
                                <OverlayTrigger placement="top" overlay={(p) => renderTooltip(p, 'Refresh List')}>
                                    <Button variant="link" className="text-secondary p-0 ms-2" onClick={() => fetchCoupons(true)} disabled={isRefreshing}>
                                        {isRefreshing ? <Spinner animation="border" size="sm" /> : <Icons.Refresh />}
                                    </Button>
                                </OverlayTrigger>
                            </div>
                        </Card.Header>
                        <Card.Body>
                            <div className="mb-3">
                                {['All', 'Active', 'Inactive', 'Expired', 'Used Up'].map(status => (
                                    <Button key={status} size="sm" variant={statusFilter === status ? 'primary' : 'outline-secondary'} onClick={() => setStatusFilter(status)} className="me-2 rounded-pill">{status}</Button>
                                ))}
                            </div>

                            <ListGroup>
                                {filteredCoupons.length > 0 ? filteredCoupons.map(coupon => {
                                    const status = getStatus(coupon);
                                    const usagePercent = Math.min((coupon.usageCount / coupon.usageLimit) * 100, 100);
                                    return (
                                        <ListGroup.Item key={coupon.id} className="p-3">
                                            <Row className="align-items-center">
                                                <Col md={4}>
                                                    <div className="d-flex align-items-center">
                                                        <Badge bg={status.variant} className="me-2">{status.text}</Badge>
                                                        <code>{coupon.code}</code>
                                                        <OverlayTrigger placement="top" overlay={(p) => renderTooltip(p, copiedCode === coupon.code ? 'Copied!' : 'Copy Code')}>
                                                            <Button variant="link" size="sm" className="p-0 ms-2 text-muted" onClick={() => handleCopy(coupon.code)}><Icons.Copy copied={copiedCode === coupon.code} /></Button>
                                                        </OverlayTrigger>
                                                    </div>
                                                    <div className="mt-2">
                                                        <ProgressBar now={usagePercent} style={{height: '10px'}}/>
                                                        <small className="text-muted">{coupon.usageCount || 0} / {coupon.usageLimit} uses</small>
                                                    </div>
                                                </Col>
                                                <Col md={5}>
                                                    <p className="mb-1"><strong>Value:</strong> {coupon.value}{coupon.type === 'percentage' ? '%' : '₹'} Off</p>
                                                    <p className="mb-1 small text-muted"><strong>Min Spend:</strong> ₹{coupon.minSpend || 0}</p>
                                                    <p className="mb-0 small text-muted"><strong>Expires:</strong> {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : 'Never'}</p>
                                                </Col>
                                                <Col md={3} className="text-md-end mt-2 mt-md-0">
                                                    <OverlayTrigger placement="top" overlay={(p) => renderTooltip(p, 'Toggle Active/Inactive')}>
                                                        <Form.Check type="switch" inline id={`switch-${coupon.id}`} checked={coupon.isActive} onChange={() => handleToggleStatus(coupon)} />
                                                    </OverlayTrigger>
                                                    <OverlayTrigger placement="top" overlay={(p) => renderTooltip(p, 'Delete Coupon')}>
                                                        <Button variant="outline-danger" size="sm" onClick={() => handleDeleteCoupon(coupon.id)}><Icons.Trash /></Button>
                                                    </OverlayTrigger>
                                                </Col>
                                            </Row>
                                        </ListGroup.Item>
                                    );
                                }) : <p className="text-center text-muted mt-3">No coupons match your criteria.</p>}
                            </ListGroup>
                        </Card.Body>
                    </Card>
                </Col>
                
                <Col lg={4}>
                    <Card>
                        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} id="coupon-creator-tabs" className="mb-3" fill>
                            <Tab eventKey="create" title="Create Single">
                                <Card.Body>
                                  <Form onSubmit={handleAddCoupon}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Coupon Code</Form.Label>
                                            <InputGroup><Form.Control type="text" name="code" value={newCoupon.code} onChange={handleInputChange} placeholder="Enter code or generate" required /><Button variant="outline-secondary" onClick={() => setNewCoupon(prev => ({ ...prev, code: generateCouponCode() }))}><Icons.Wand/></Button></InputGroup>
                                        </Form.Group>
                                        <Row><Col md={6}><Form.Group className="mb-3"><Form.Label>Type</Form.Label><Form.Select name="type" value={newCoupon.type} onChange={handleInputChange}><option value="percentage">%</option><option value="flat">₹</option></Form.Select></Form.Group></Col><Col md={6}><Form.Group className="mb-3"><Form.Label>Value</Form.Label><Form.Control type="number" name="value" value={newCoupon.value} onChange={handleInputChange} required min="0" /></Form.Group></Col></Row>
                                        <Row><Col md={6}><Form.Group className="mb-3"><Form.Label>Min. Spend</Form.Label><Form.Control type="number" name="minSpend" value={newCoupon.minSpend} onChange={handleInputChange} min="0" /></Form.Group></Col><Col md={6}><Form.Group className="mb-3"><Form.Label>Usage Limit</Form.Label><Form.Control type="number" name="usageLimit" value={newCoupon.usageLimit} onChange={handleInputChange} min="1" /></Form.Group></Col></Row>
                                        <Form.Group className="mb-3"><Form.Label>Expiry Date</Form.Label><Form.Control type="date" name="expiryDate" value={newCoupon.expiryDate} onChange={handleInputChange} /></Form.Group>
                                        <Form.Group className="mb-3"><Form.Check type="switch" label="Active by default" checked={newCoupon.isActive} onChange={(e) => setNewCoupon(prev => ({...prev, isActive: e.target.checked}))} /></Form.Group>
                                        <div className="d-grid"><Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Spinner as="span" size="sm"/> : <><Icons.Plus/> Create Coupon</>}</Button></div>
                                    </Form>
                                </Card.Body>
                            </Tab>
                            <Tab eventKey="bulk" title="Bulk Generator">
                                <Card.Body>
                                    <Card.Text className="small text-muted">Generate multiple unique codes. Settings will be taken from the 'Create Single' tab.</Card.Text>
                                    <Row>
                                        <Col xs={7}><InputGroup><InputGroup.Text>Prefix</InputGroup.Text><Form.Control value={bulkPrefix} onChange={(e) => setBulkPrefix(e.target.value.toUpperCase())} /></InputGroup></Col>
                                        <Col xs={5}><InputGroup><InputGroup.Text>#</InputGroup.Text><Form.Control type="number" value={bulkCount} onChange={(e) => setBulkCount(Number(e.target.value))} min="1" max="100" /></InputGroup></Col>
                                    </Row>
                                    <div className="d-grid mt-3"><Button variant="info" onClick={handleBulkGenerate} disabled={isSubmitting}>{isSubmitting ? <Spinner as="span" size="sm"/> : `Generate ${bulkCount} Coupons`}</Button></div>
                                </Card.Body>
                            </Tab>
                        </Tabs>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default CouponManagement;
