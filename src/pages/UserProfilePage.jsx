import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Tabs, Tab, Spinner } from 'react-bootstrap';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, onAuthStateChanged } from 'firebase/auth';
import CustomLoader from '../components/CustomLoader';

// Simple User Icon
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" className="bi bi-person-circle" viewBox="0 0 16 16">
        <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
        <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/>
    </svg>
);

const UserProfilePage = ({ showToast }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Forms states
  const [name, setName] = useState('');
  const [address, setAddress] = useState({ street: '', city: '', state: '', pincode: '' });
  const [password, setPassword] = useState({ current: '', new: '', confirm: '' });

  // Loading states for each form
  const [isNameUpdating, setIsNameUpdating] = useState(false);
  const [isAddressUpdating, setIsAddressUpdating] = useState(false);
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setName(currentUser.displayName || '');
        
        const addressRef = doc(db, 'users', currentUser.uid, 'shippingAddress', 'default');
        const addressSnap = await getDoc(addressRef);
        if (addressSnap.exists()) {
          setAddress(addressSnap.data());
        }
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const handleNameUpdate = async (e) => {
    e.preventDefault();
    setIsNameUpdating(true);
    try {
      await updateProfile(auth.currentUser, { displayName: name });
      showToast('Name updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to update name.', 'danger');
    } finally {
      setIsNameUpdating(false);
    }
  };

  const handleAddressUpdate = async (e) => {
    e.preventDefault();
    setIsAddressUpdating(true);
    try {
      const addressRef = doc(db, 'users', auth.currentUser.uid, 'shippingAddress', 'default');
      await setDoc(addressRef, address, { merge: true });
      showToast('Address updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to update address.', 'danger');
    } finally {
      setIsAddressUpdating(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setError('');
    if (password.new !== password.confirm) {
      setError('New passwords do not match.');
      return;
    }
    if (password.new.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setIsPasswordUpdating(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, password.current);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, password.new);
      showToast('Password updated successfully!', 'success');
      setPassword({ current: '', new: '', confirm: '' });
    } catch (err) {
      setError('Failed to update password. Please check your current password.');
    } finally {
      setIsPasswordUpdating(false);
    }
  };

  if (loading) {
    return <CustomLoader message="Loading Profile..." />;
  }

  return (
    <Container style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
      <h2 className="font-cormorant display-4 text-center mb-5">My Profile</h2>
      <Row className="justify-content-center">
        <Col lg={8} md={10}>
          <Card className="profile-page-card">
            <Card.Body>
                <div className="text-center mb-4">
                    <div className="profile-avatar">
                        <UserIcon />
                    </div>
                    <h4 className="mt-3 mb-0">{name || 'Your Name'}</h4>
                    <p className="text-muted">{user?.email}</p>
                </div>

              <Tabs defaultActiveKey="profile" id="profile-tabs" className="mb-4 profile-tabs" fill>
                
                {/* Personal Info Tab */}
                <Tab eventKey="profile" title="Personal Info">
                  <Form onSubmit={handleNameUpdate} className="p-3">
                    <Form.Group className="mb-3">
                      <Form.Label>Full Name</Form.Label>
                      <Form.Control type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                    </Form.Group>
                    <Button type="submit" className="btn-custom" disabled={isNameUpdating}>
                      {isNameUpdating ? <><Spinner as="span" size="sm" /> Saving...</> : 'Save Name'}
                    </Button>
                  </Form>
                </Tab>

                {/* Address Tab */}
                <Tab eventKey="address" title="Shipping Address">
                  <Form onSubmit={handleAddressUpdate} className="p-3">
                    <Row>
                      <Col md={12} className="mb-3">
                        <Form.Group>
                          <Form.Label>Address</Form.Label>
                          <Form.Control type="text" placeholder="Street, Area" value={address.street || ''} onChange={(e) => setAddress({...address, street: e.target.value})} />
                        </Form.Group>
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label>City</Form.Label>
                          <Form.Control type="text" value={address.city || ''} onChange={(e) => setAddress({...address, city: e.target.value})} />
                        </Form.Group>
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label>State</Form.Label>
                          <Form.Control type="text" value={address.state || ''} onChange={(e) => setAddress({...address, state: e.target.value})} />
                        </Form.Group>
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label>Pincode</Form.Label>
                          <Form.Control type="text" value={address.pincode || ''} onChange={(e) => setAddress({...address, pincode: e.target.value})} />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Button type="submit" className="btn-custom" disabled={isAddressUpdating}>
                      {isAddressUpdating ? <><Spinner as="span" size="sm" /> Saving...</> : 'Save Address'}
                    </Button>
                  </Form>
                </Tab>

                {/* Security Tab */}
                <Tab eventKey="security" title="Security">
                  <Form onSubmit={handlePasswordUpdate} className="p-3">
                    {error && <Alert variant="danger" className="w-100">{error}</Alert>}
                    <Form.Group className="mb-3">
                      <Form.Label>Current Password</Form.Label>
                      <Form.Control type="password" value={password.current} onChange={(e) => setPassword({...password, current: e.target.value})} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>New Password</Form.Label>
                      <Form.Control type="password" value={password.new} onChange={(e) => setPassword({...password, new: e.target.value})} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Confirm New Password</Form.Label>
                      <Form.Control type="password" value={password.confirm} onChange={(e) => setPassword({...password, confirm: e.target.value})} required />
                    </Form.Group>
                    <Button type="submit" className="btn-custom" disabled={isPasswordUpdating}>
                      {isPasswordUpdating ? <><Spinner as="span" size="sm" /> Saving...</> : 'Change Password'}
                    </Button>
                  </Form>
                </Tab>

              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default UserProfilePage;
