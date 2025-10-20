import React, { useState, useEffect, useMemo } from 'react';
import { Container, Form, Button, Card, Row, Col, Spinner, Alert, InputGroup } from 'react-bootstrap';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CustomLoader from '../../components/CustomLoader';

// Delete icon for removing discount tiers
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
        <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3V2h11v1z"/>
    </svg>
);

const SaleManagement = () => {
  const [saleDetails, setSaleDetails] = useState({
    saleName: 'Festive Sale',
    startDate: '',
    endDate: '',
    isActive: false,
    discountTiers: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const saleDocRef = doc(db, 'sales', 'currentSale');

  useEffect(() => {
    const fetchSaleDetails = async () => {
      try {
        const docSnap = await getDoc(saleDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSaleDetails(prev => ({
            ...prev,
            ...data,
            startDate: data.startDate ? data.startDate.split('T')[0] : '',
            endDate: data.endDate ? data.endDate.split('T')[0] : '',
            discountTiers: data.discountTiers || [],
          }));
        }
      } catch (error) {
        console.error("Error fetching sale details:", error);
        setMessage({ text: 'Error fetching existing sale data.', type: 'danger' });
      } finally {
        setLoading(false);
      }
    };
    fetchSaleDetails();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSaleDetails(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTierChange = (index, field, value) => {
    const updatedTiers = [...saleDetails.discountTiers];
    updatedTiers[index][field] = Number(value);
    setSaleDetails(prev => ({ ...prev, discountTiers: updatedTiers }));
  };

  const handleAddTier = () => {
    setSaleDetails(prev => ({
      ...prev,
      discountTiers: [...prev.discountTiers, { minSpend: 0, discountPercent: 0 }]
    }));
  };

  const handleRemoveTier = (index) => {
    const updatedTiers = saleDetails.discountTiers.filter((_, i) => i !== index);
    setSaleDetails(prev => ({ ...prev, discountTiers: updatedTiers }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    if (!saleDetails.saleName || !saleDetails.startDate || !saleDetails.endDate) {
        setMessage({ text: 'Please fill out Sale Name, Start Date, and End Date.', type: 'danger'});
        setSaving(false);
        return;
    }

    try {
      const sortedTiers = [...saleDetails.discountTiers].sort((a, b) => a.minSpend - b.minSpend);
      
      const dataToSave = {
        ...saleDetails,
        startDate: `${saleDetails.startDate}T00:00:00`,
        endDate: `${saleDetails.endDate}T23:59:59`,
        discountTiers: sortedTiers,
      };

      await setDoc(saleDocRef, dataToSave);
      setMessage({ text: 'Sale details saved successfully!', type: 'success' });
    } catch (error) {
      setMessage({ text: 'Error saving details. Please check your Firestore security rules.', type: 'danger' });
      console.error("Error saving sale details:", error);
    } finally {
      setSaving(false);
    }
  };

  const saleStatus = useMemo(() => {
    if (!saleDetails.isActive) return { text: 'Inactive', variant: 'secondary' };
    const now = new Date();
    const start = new Date(saleDetails.startDate + 'T00:00:00');
    const end = new Date(saleDetails.endDate + 'T23:59:59');

    if (now < start) return { text: 'Scheduled', variant: 'info' };
    if (now > end) return { text: 'Expired', variant: 'danger' };
    return { text: 'Live', variant: 'success' };
  }, [saleDetails.isActive, saleDetails.startDate, saleDetails.endDate]);


  if (loading) {
    return <CustomLoader message="Loading Sale Settings..." />;
  }

  return (
    <Container fluid>
        <Row>
            <Col lg={8}>
                <Card>
                    <Card.Body>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <Card.Title className="mb-0">Configure Sale Event</Card.Title>
                            <Form.Check
                                type="switch"
                                id="sale-active-switch"
                                label="Activate Sale"
                                name="isActive"
                                checked={saleDetails.isActive}
                                onChange={handleInputChange}
                            />
                        </div>
                        {message && <Alert variant={message.type}>{message.text}</Alert>}
                        <Form>
                            <Row>
                                <Col md={12} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>Sale Name</Form.Label>
                                        <Form.Control type="text" name="saleName" value={saleDetails.saleName} onChange={handleInputChange}/>
                                    </Form.Group>
                                </Col>
                                <Col md={6} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>Start Date</Form.Label>
                                        <Form.Control type="date" name="startDate" value={saleDetails.startDate} onChange={handleInputChange} />
                                    </Form.Group>
                                </Col>
                                <Col md={6} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>End Date</Form.Label>
                                        <Form.Control type="date" name="endDate" value={saleDetails.endDate} onChange={handleInputChange} />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <hr />
                            <h5 className="mt-4">Discount Rules</h5>
                            <Card.Text className="text-muted mb-3">
                                Add rules for discounts based on cart value. Eg: "On a purchase of ₹1000, get 15% off".
                            </Card.Text>
                            {saleDetails.discountTiers.map((tier, index) => (
                                <Row key={index} className="align-items-center mb-2">
                                    <Col xs={5}>
                                        <InputGroup>
                                            <InputGroup.Text>On ₹</InputGroup.Text>
                                            <Form.Control type="number" value={tier.minSpend} onChange={(e) => handleTierChange(index, 'minSpend', e.target.value)} />
                                        </InputGroup>
                                    </Col>
                                    <Col xs={5}>
                                        <InputGroup>
                                            <Form.Control type="number" value={tier.discountPercent} onChange={(e) => handleTierChange(index, 'discountPercent', e.target.value)} />
                                            <InputGroup.Text>% Off</InputGroup.Text>
                                        </InputGroup>
                                    </Col>
                                    <Col xs={2}>
                                        <Button variant="outline-danger" size="sm" onClick={() => handleRemoveTier(index)}><TrashIcon/></Button>
                                    </Col>
                                </Row>
                            ))}
                             <Button variant="secondary" size="sm" onClick={handleAddTier} className="mt-2">+ Add Rule</Button>
                            
                            <div className="mt-4">
                                <Button variant="primary" onClick={handleSave} disabled={saving}>
                                    {saving ? <><Spinner as="span" size="sm" /> Saving...</> : 'Save Sale Settings'}
                                </Button>
                            </div>
                        </Form>
                    </Card.Body>
                </Card>
            </Col>

            <Col lg={4}>
                <Card className="mb-3">
                    <Card.Header><strong>Live Status</strong></Card.Header>
                    <Card.Body className="text-center">
                        <div className={`badge bg-${saleStatus.variant}`} style={{fontSize: '1rem', padding: '0.5rem 1rem'}}>{saleStatus.text}</div>
                        <p className="text-muted mt-2">
                            This is the current status of your sale based on the dates and activation switch.
                        </p>
                    </Card.Body>
                </Card>
                <Card>
                    <Card.Header><strong>Banner Preview</strong></Card.Header>
                    <Card.Body>
                        <div style={{padding: '2rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color-soft)', backgroundColor: 'var(--light)'}}>
                            <div className="text-center position-relative">
                                <h4 className="font-cormorant">{saleDetails.saleName || "Your Sale Name"}</h4>
                                <p style={{fontSize: '0.9rem'}}>The celebration begins soon!</p>
                                <Button variant="primary" size="sm">Shop Now</Button>
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    </Container>
  );
};

export default SaleManagement;

