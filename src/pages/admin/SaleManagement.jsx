import React, { useState, useEffect, useMemo } from 'react';
import { Container, Form, Button, Card, Row, Col, Spinner, Alert, InputGroup, Badge, ListGroup } from 'react-bootstrap';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CustomLoader from '../../components/CustomLoader';

// --- ICONS ---
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
        <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3V2h11v1z"/>
    </svg>
);

const SaleManagement = () => {
  const [saleDetails, setSaleDetails] = useState({
    saleName: 'Festive Sale',
    startDate: '', startTime: '00:00',
    endDate: '', endTime: '23:59',
    isActive: false,
    discountTiers: [],
    dynamicRules: [], // NEW: For advanced time-based rules
  });

  const [testCartValue, setTestCartValue] = useState('1000');
  const [testDateTime, setTestDateTime] = useState(new Date().toISOString().slice(0, 16));
  const [simulationResult, setSimulationResult] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activityLog, setActivityLog] = useState([]);

  const saleDocRef = doc(db, 'sales', 'currentSale');

  const logActivity = (message) => setActivityLog(prev => [{ message, timestamp: new Date() }, ...prev.slice(0, 4)]);
  
  useEffect(() => {
    const fetchSaleDetails = async () => {
      try {
        const docSnap = await getDoc(saleDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const [sDate, sTime] = (data.startDate || '').split('T');
          const [eDate, eTime] = (data.endDate || '').split('T');
          setSaleDetails(prev => ({ ...prev, ...data, startDate: sDate || '', startTime: sTime?.substring(0, 5) || '00:00', endDate: eDate || '', endTime: eTime?.substring(0, 5) || '23:59', discountTiers: data.discountTiers || [], dynamicRules: data.dynamicRules || [] }));
          logActivity("Sale settings loaded.");
        } else {
          logActivity("No existing sale found.");
        }
      } catch (error) {
        console.error("Error fetching sale details:", error);
        setMessage({ text: 'Error fetching sale data.', type: 'danger' });
      } finally {
        setLoading(false);
      }
    };
    fetchSaleDetails();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSaleDetails(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleTierChange = (index, field, value) => {
    const updatedTiers = [...saleDetails.discountTiers];
    updatedTiers[index][field] = Number(value);
    setSaleDetails(prev => ({ ...prev, discountTiers: updatedTiers }));
  };

  const handleAddTier = () => {
    setSaleDetails(prev => ({ ...prev, discountTiers: [...prev.discountTiers, { minSpend: 0, discountPercent: 0 }] }));
    logActivity("Added a base discount rule.");
  };

  const handleRemoveTier = (index) => {
    const updatedTiers = saleDetails.discountTiers.filter((_, i) => i !== index);
    setSaleDetails(prev => ({ ...prev, discountTiers: updatedTiers }));
    logActivity("Removed a base discount rule.");
  };

  // --- NEW FEATURE: DYNAMIC RULE HANDLERS ---
  const handleAddDynamicRule = () => {
    const newRule = {
      id: Date.now(),
      ruleName: `Dynamic Rule ${saleDetails.dynamicRules.length + 1}`,
      minSpend: 1000,
      discountPercent: 15,
      startTime: '18:00',
      endTime: '21:00',
      days: { Mon: false, Tue: false, Wed: false, Thu: false, Fri: true, Sat: true, Sun: true },
    };
    setSaleDetails(prev => ({ ...prev, dynamicRules: [...prev.dynamicRules, newRule] }));
    logActivity("Added a dynamic pricing rule.");
  };

  const handleRemoveDynamicRule = (ruleId) => {
    setSaleDetails(prev => ({ ...prev, dynamicRules: prev.dynamicRules.filter(r => r.id !== ruleId) }));
    logActivity("Removed a dynamic pricing rule.");
  };

  const handleDynamicRuleChange = (ruleId, field, value) => {
    setSaleDetails(prev => ({ ...prev, dynamicRules: prev.dynamicRules.map(r => r.id === ruleId ? { ...r, [field]: value } : r) }));
  };

  const handleDayChange = (ruleId, day) => {
    const updatedRules = saleDetails.dynamicRules.map(rule => {
      if (rule.id === ruleId) {
        return { ...rule, days: { ...rule.days, [day]: !rule.days[day] } };
      }
      return rule;
    });
    setSaleDetails(prev => ({ ...prev, dynamicRules: updatedRules }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    if (!saleDetails.saleName || !saleDetails.startDate || !saleDetails.endDate) {
        setMessage({ text: 'Please fill out all date and name fields.', type: 'danger'});
        setSaving(false); return;
    }
    try {
      const dataToSave = { ...saleDetails, startDate: `${saleDetails.startDate}T${saleDetails.startTime}:00`, endDate: `${saleDetails.endDate}T${saleDetails.endTime}:59` };
      await setDoc(saleDocRef, dataToSave);
      setMessage({ text: 'Sale details saved successfully!', type: 'success' });
      logActivity("Sale settings saved.");
    } catch (error) {
      setMessage({ text: 'Error saving details.', type: 'danger' });
      logActivity("Error saving settings.");
    } finally {
      setSaving(false);
    }
  };
  
  const handleForceEndSale = async () => {
      if (window.confirm("Are you sure? This cannot be undone.")) {
          setSaving(true);
          try {
              const now = new Date(); now.setMinutes(now.getMinutes() - 1);
              const isoString = now.toISOString();
              const [newEndDate, newEndTime] = isoString.split('T');
              const dataToSave = { ...saleDetails, isActive: false, endDate: isoString };
              await setDoc(saleDocRef, dataToSave, { merge: true });
              setSaleDetails(prev => ({ ...prev, isActive: false, endDate: newEndDate, endTime: newEndTime.substring(0, 5) }));
              setMessage({ text: 'Sale has been forcefully ended.', type: 'warning' });
              logActivity("Sale forcefully ended.");
          } catch (error) {
              setMessage({ text: 'Failed to end the sale.', type: 'danger' });
          } finally {
              setSaving(false);
          }
      }
  };

  const handleRunSimulation = () => {
    const testDate = new Date(testDateTime);
    const saleStart = new Date(`${saleDetails.startDate}T${saleDetails.startTime}`);
    const saleEnd = new Date(`${saleDetails.endDate}T${saleDetails.endTime}`);
    const isSaleActiveForTest = saleDetails.isActive && testDate >= saleStart && testDate <= saleEnd;
    
    let result = { isActive: isSaleActiveForTest, originalValue: Number(testCartValue), discountPercent: 0, discountAmount: 0, finalPrice: Number(testCartValue), appliedRule: 'None' };

    if(isSaleActiveForTest) {
        // --- UPDATED SIMULATOR LOGIC ---
        const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const testDay = dayMap[testDate.getDay()];
        const testTime = testDate.toTimeString().slice(0, 5);
        
        const applicableDynamicRules = saleDetails.dynamicRules
            .filter(rule => rule.days[testDay] && testTime >= rule.startTime && testTime <= rule.endTime && result.originalValue >= rule.minSpend)
            .sort((a,b) => b.discountPercent - a.discountPercent); // Get best dynamic discount

        if (applicableDynamicRules.length > 0) {
            const bestDynamicRule = applicableDynamicRules[0];
            result.discountPercent = bestDynamicRule.discountPercent;
            result.appliedRule = `Dynamic: ${bestDynamicRule.ruleName}`;
        } else {
            const applicableBaseTier = [...saleDetails.discountTiers]
                .sort((a, b) => b.minSpend - a.minSpend)
                .find(tier => result.originalValue >= tier.minSpend);
            if (applicableBaseTier) {
                result.discountPercent = applicableBaseTier.discountPercent;
                result.appliedRule = 'Base Rule';
            }
        }
        
        result.discountAmount = (result.originalValue * result.discountPercent) / 100;
        result.finalPrice = result.originalValue - result.discountAmount;
    }
    setSimulationResult(result);
    logActivity("Ran a simulation.");
  };

  const saleStatus = useMemo(() => {
    if (!saleDetails.isActive) return { text: 'Inactive', variant: 'secondary' };
    const now = new Date();
    const start = new Date(`${saleDetails.startDate}T${saleDetails.startTime}`);
    const end = new Date(`${saleDetails.endDate}T${saleDetails.endTime}`);
    if (now < start) return { text: 'Scheduled', variant: 'info' };
    if (now > end) return { text: 'Expired', variant: 'danger' };
    return { text: 'Live', variant: 'success' };
  }, [saleDetails]);

  const saleTimeRemaining = useMemo(() => {
    if (saleStatus.text !== 'Live') return 'N/A';
    const diff = new Date(`${saleDetails.endDate}T${saleDetails.endTime}`) - new Date();
    if (diff <= 0) return 'Ending now';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    return `${days}d, ${hours}h, ${minutes}m`;
  }, [saleDetails, saleStatus]);

  if (loading) return <CustomLoader message="Loading Sale Settings..." />;

  return (
    <Container fluid>
        <Row>
            <Col lg={8} className="mb-3 mb-lg-0">
                <Card>
                    <Card.Body>
                        {/* --- Existing Top Section --- */}
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <Card.Title className="mb-0">Configure Sale Event</Card.Title>
                            <Form.Check type="switch" id="sale-active-switch" label="Activate Sale" name="isActive" checked={saleDetails.isActive} onChange={handleInputChange} />
                        </div>
                        {message && <Alert variant={message.type}>{message.text}</Alert>}
                        
                        {/* --- Existing Form --- */}
                        <Form>
                            <Row>
                                <Col md={12} className="mb-3"><Form.Group><Form.Label>Sale Name</Form.Label><Form.Control type="text" name="saleName" value={saleDetails.saleName} onChange={handleInputChange}/></Form.Group></Col>
                                <Col md={4} sm={6} className="mb-3"><Form.Group><Form.Label>Start Date</Form.Label><Form.Control type="date" name="startDate" value={saleDetails.startDate} onChange={handleInputChange} /></Form.Group></Col>
                                <Col md={2} sm={6} className="mb-3"><Form.Group><Form.Label>Start Time</Form.Label><Form.Control type="time" name="startTime" value={saleDetails.startTime} onChange={handleInputChange} /></Form.Group></Col>
                                <Col md={4} sm={6} className="mb-3"><Form.Group><Form.Label>End Date</Form.Label><Form.Control type="date" name="endDate" value={saleDetails.endDate} onChange={handleInputChange} /></Form.Group></Col>
                                <Col md={2} sm={6} className="mb-3"><Form.Group><Form.Label>End Time</Form.Label><Form.Control type="time" name="endTime" value={saleDetails.endTime} onChange={handleInputChange} /></Form.Group></Col>
                            </Row>
                            <hr />
                            <h5 className="mt-4">Base Discount Rules</h5>
                            <Card.Text className="text-muted mb-3">These rules apply when no dynamic rule is active.</Card.Text>
                            {saleDetails.discountTiers.map((tier, index) => (
                                <Row key={index} className="align-items-center mb-2">
                                    <Col><InputGroup size="sm"><InputGroup.Text>On ₹</InputGroup.Text><Form.Control type="number" value={tier.minSpend} onChange={(e) => handleTierChange(index, 'minSpend', e.target.value)} /></InputGroup></Col>
                                    <Col><InputGroup size="sm"><Form.Control type="number" value={tier.discountPercent} onChange={(e) => handleTierChange(index, 'discountPercent', e.target.value)} /><InputGroup.Text>%</InputGroup.Text></InputGroup></Col>
                                    <Col xs="auto"><Button variant="outline-danger" size="sm" onClick={() => handleRemoveTier(index)}><TrashIcon/></Button></Col>
                                </Row>
                            ))}
                            <Button variant="secondary" size="sm" onClick={handleAddTier} className="mt-2">+ Add Base Rule</Button>
                            
                            {/* --- NEW FEATURE: DYNAMIC PRICING RULES UI --- */}
                            <hr className="my-4"/>
                            <h5 className="mt-4">Dynamic Pricing Rules (Advanced)</h5>
                            <Card.Text className="text-muted mb-3">Create special offers for specific days and times. These override base rules.</Card.Text>
                            {saleDetails.dynamicRules.map(rule => (
                                <Card key={rule.id} className="mb-3 bg-light">
                                    <Card.Body>
                                        <div className="d-flex justify-content-between">
                                            <Form.Control placeholder="Rule Name (e.g., Happy Hour)" size="sm" style={{width: '70%'}} value={rule.ruleName} onChange={(e) => handleDynamicRuleChange(rule.id, 'ruleName', e.target.value)} />
                                            <Button variant="outline-danger" size="sm" onClick={() => handleRemoveDynamicRule(rule.id)}><TrashIcon/></Button>
                                        </div>
                                        <Row className="mt-3">
                                            <Col md={6}><InputGroup size="sm"><InputGroup.Text>On ₹</InputGroup.Text><Form.Control type="number" value={rule.minSpend} onChange={(e) => handleDynamicRuleChange(rule.id, 'minSpend', e.target.value)} /></InputGroup></Col>
                                            <Col md={6}><InputGroup size="sm"><Form.Control type="number" value={rule.discountPercent} onChange={(e) => handleDynamicRuleChange(rule.id, 'discountPercent', e.target.value)} /><InputGroup.Text>% Off</InputGroup.Text></InputGroup></Col>
                                        </Row>
                                        <Row className="align-items-center mt-3">
                                            <Col md={6} className="d-flex align-items-center"><Form.Control size="sm" type="time" value={rule.startTime} onChange={(e) => handleDynamicRuleChange(rule.id, 'startTime', e.target.value)} /><span className="mx-2 small">to</span><Form.Control size="sm" type="time" value={rule.endTime} onChange={(e) => handleDynamicRuleChange(rule.id, 'endTime', e.target.value)} /></Col>
                                            <Col md={6} className="text-center mt-2 mt-md-0">{Object.keys(rule.days).map(day => (
                                                <Form.Check inline key={day} type="checkbox" label={day} checked={rule.days[day]} onChange={() => handleDayChange(rule.id, day)} />
                                            ))}</Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            ))}
                            <Button variant="info" size="sm" onClick={handleAddDynamicRule}>+ Add Dynamic Rule</Button>
                            
                            <div className="mt-4">
                                <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? <><Spinner as="span" size="sm" /> Saving...</> : 'Save All Settings'}</Button>
                            </div>
                        </Form>
                    </Card.Body>
                </Card>
            </Col>

            <Col lg={4}>
                {/* --- Cards are mostly unchanged, but Simulator is updated --- */}
                <Card className="mb-3"><Card.Header><strong>Live Status</strong></Card.Header><Card.Body className="text-center"><Badge bg={saleStatus.variant} style={{fontSize: '1rem', padding: '0.5rem 1rem'}}>{saleStatus.text}</Badge><p className="text-muted mt-2">Current sale status.</p></Card.Body></Card>
                <Card className="mb-3"><Card.Header><strong>Quick Stats</strong></Card.Header><ListGroup variant="flush"><ListGroup.Item className="d-flex justify-content-between">Time Remaining<Badge bg="primary" pill>{saleTimeRemaining}</Badge></ListGroup.Item><ListGroup.Item className="d-flex justify-content-between">Base Rules<Badge bg="primary" pill>{saleDetails.discountTiers.length}</Badge></ListGroup.Item><ListGroup.Item className="d-flex justify-content-between">Dynamic Rules<Badge bg="primary" pill>{saleDetails.dynamicRules.length}</Badge></ListGroup.Item></ListGroup></Card>
                <Card className="mb-3"><Card.Header><strong>Sale Simulator</strong></Card.Header>
                    <Card.Body>
                        <Form.Group className="mb-3"><Form.Label className="small">Test Date & Time</Form.Label><Form.Control type="datetime-local" size="sm" value={testDateTime} onChange={(e) => setTestDateTime(e.target.value)} /></Form.Group>
                        <Form.Group className="mb-3"><Form.Label className="small">Test Cart Value</Form.Label><InputGroup size="sm"><InputGroup.Text>₹</InputGroup.Text><Form.Control type="number" value={testCartValue} onChange={(e) => setTestCartValue(e.target.value)} /></InputGroup></Form.Group>
                        <div className="d-grid"><Button variant="success" onClick={handleRunSimulation}>Run Simulation</Button></div>
                        {simulationResult && (
                            <div className="mt-3 p-2 bg-light rounded small">
                                <h6 className="text-center small">Simulation Result</h6>
                                <ListGroup variant="flush" className="small">
                                    <ListGroup.Item className="d-flex justify-content-between">Sale Active? <Badge bg={simulationResult.isActive ? 'success' : 'danger'}>{simulationResult.isActive ? 'Yes' : 'No'}</Badge></ListGroup.Item>
                                    <ListGroup.Item>Original: ₹{simulationResult.originalValue.toFixed(2)}</ListGroup.Item>
                                    <ListGroup.Item>Discount: {simulationResult.discountPercent}% (-₹{simulationResult.discountAmount.toFixed(2)})</ListGroup.Item>
                                    <ListGroup.Item><strong>Applied Rule:</strong> {simulationResult.appliedRule}</ListGroup.Item>
                                    <ListGroup.Item className="d-flex justify-content-between"><strong>Final Price:</strong> <strong>₹{simulationResult.finalPrice.toFixed(2)}</strong></ListGroup.Item>
                                </ListGroup>
                            </div>
                        )}
                    </Card.Body>
                </Card>
                <Card className="mb-3"><Card.Header><strong>Recent Activity</strong></Card.Header><ListGroup variant="flush" style={{maxHeight: '150px', overflowY: 'auto'}}>{activityLog.length > 0 ? activityLog.map((log, index) => (<ListGroup.Item key={index} style={{fontSize: '0.8rem'}}>{log.message}<small className="d-block text-muted">{log.timestamp.toLocaleTimeString()}</small></ListGroup.Item>)) : <ListGroup.Item className="text-muted">No recent activity.</ListGroup.Item>}</ListGroup></Card>
                <Card bg="light" text="dark"><Card.Header><strong>Danger Zone</strong></Card.Header><Card.Body><p className="small">This action cannot be undone.</p><Button variant="outline-danger" className="w-100" onClick={handleForceEndSale} disabled={saving || saleStatus.text !== 'Live'}>Force End Sale</Button></Card.Body></Card>
            </Col>
        </Row>
    </Container>
  );
};

export default SaleManagement;
