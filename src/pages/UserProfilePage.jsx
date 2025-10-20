import React, { useState, useEffect, useCallback } from 'react';
import { 
    Container, Row, Col, Card, Form, Button, Alert, Tabs, Tab, Spinner, 
    Modal, ProgressBar, ListGroup, Badge
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
// Firebase and Firestore imports
import { auth, db, storage } from '../firebase'; // Ensure 'storage' is correctly imported from firebase.js
import { 
    doc, getDoc, setDoc, deleteDoc, collection, getDocs, updateDoc,
    query, where, writeBatch,
} from 'firebase/firestore';
// Firebase Auth imports
import { 
    updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, onAuthStateChanged, deleteUser 
} from 'firebase/auth';
// Firebase Storage imports
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

import CustomLoader from '../components/CustomLoader';

// --- UTILITY COMPONENTS ---

// Default User Icon
const UserIcon = ({ size = 64 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" className="bi bi-person-circle" viewBox="0 0 16 16">
        <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
        <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/>
    </svg>
);


// --- USER METRICS CARD (Total Orders / Total Spend) ---
const UserMetrics = ({ user }) => {
    const [metrics, setMetrics] = useState({ totalOrders: 0, totalSpend: 0 });
    const [loading, setLoading] = useState(true);

    const fetchMetrics = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const ordersRef = collection(db, 'orders');
            const q = query(ordersRef, where('userId', '==', user.uid), where('status', 'in', ['Delivered', 'Shipped'])); 
            
            const snapshot = await getDocs(q);
            
            let totalSpend = 0;
            snapshot.forEach(doc => {
                totalSpend += doc.data().totalAmount || 0;
            });

            setMetrics({
                totalOrders: snapshot.size,
                totalSpend: totalSpend,
            });

        } catch (error) {
            console.error("Error fetching user metrics:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    return (
        <Row className="g-3 text-center mb-4">
            <Col xs={6} md={3}>
                <Card body className="bg-light shadow-sm">
                    <h5 className="mb-0 text-primary">{loading ? <Spinner animation="border" size="sm" /> : metrics.totalOrders}</h5>
                    <p className="mb-0 small text-muted">Total Orders</p>
                </Card>
            </Col>
            <Col xs={6} md={3}>
                <Card body className="bg-light shadow-sm">
                    <h5 className="mb-0 text-success">{loading ? <Spinner animation="border" size="sm" /> : `₹${metrics.totalSpend.toFixed(0)}`}</h5>
                    <p className="mb-0 small text-muted">Total Spent</p>
                </Card>
            </Col>
        </Row>
    );
}


// --- LINK CARD (Redirection Fix) ---
const LinkCard = ({ to, title, description, icon }) => {
    const navigate = useNavigate(); 
    return (
        <Col md={6}>
            <Card 
                onClick={() => navigate(to)} 
                className="shadow-sm h-100 profile-link-card text-decoration-none" 
                style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
            >
                <Card.Body className="d-flex align-items-center">
                    <div className="me-3 fs-3 text-primary">{icon}</div>
                    <div>
                        <Card.Title as="h5" className="mb-1">{title}</Card.Title>
                        <Card.Text className="text-muted small mb-0">{description}</Card.Text>
                    </div>
                </Card.Body>
            </Card>
        </Col>
    );
};


// --- ADDRESS BOOK CONTENT (Multi-Address Management) ---
const AddressBookContent = ({ user, showToast }) => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [currentAddress, setCurrentAddress] = useState({ id: null, street: '', city: '', state: '', pincode: '', isDefault: false });

    const fetchAddresses = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const q = collection(db, 'users', user.uid, 'shippingAddress');
            const snapshot = await getDocs(q);
            const addressList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAddresses(addressList);
        } catch (error) {
            console.error("Error fetching addresses:", error);
            showToast('Failed to load address book.', 'danger');
        } finally {
            setLoading(false);
        }
    }, [user, showToast]);

    useEffect(() => {
        fetchAddresses();
    }, [fetchAddresses]);

    const handleOpenModal = (address = null) => {
        if (address) {
            setCurrentAddress(address);
        } else {
            setCurrentAddress({ id: null, street: '', city: '', state: '', pincode: '', isDefault: addresses.length === 0 });
        }
        setShowModal(true);
    };

    const handleSaveAddress = async (e) => {
        e.preventDefault();
        const tempId = currentAddress.id || doc(collection(db, 'users', user.uid, 'shippingAddress')).id;
        const addressData = { 
            street: currentAddress.street, city: currentAddress.city, 
            state: currentAddress.state, pincode: currentAddress.pincode, 
            isDefault: currentAddress.isDefault
        }; 
        
        try {
            const batch = writeBatch(db);

            if (currentAddress.isDefault) {
                addresses.filter(a => a.isDefault && a.id !== currentAddress.id).forEach(a => {
                    const ref = doc(db, 'users', user.uid, 'shippingAddress', a.id);
                    batch.update(ref, { isDefault: false });
                });
            } else if (addresses.length === 0) {
                 addressData.isDefault = true;
            }
            
            batch.set(doc(db, 'users', user.uid, 'shippingAddress', tempId), addressData, { merge: true });
            await batch.commit();

            showToast('Address updated successfully!', 'success'); // Highlighted Success
            setShowModal(false);
            fetchAddresses(); 

        } catch (error) {
            console.error("Error saving address:", error);
            showToast('Failed to save address.', 'danger');
        }
    };

    const handleDeleteAddress = async (id, isDefault) => {
        if (isDefault && addresses.length > 1) {
            showToast('You cannot delete the default address. Please set another address as default first.', 'danger');
            return;
        }
        if (!window.confirm('Are you sure you want to delete this address?')) return;
        try {
            await deleteDoc(doc(db, 'users', user.uid, 'shippingAddress', id));
            showToast('Address deleted.', 'warning');
            fetchAddresses();
        } catch (error) {
            showToast('Failed to delete address.', 'danger');
        }
    };
    
    const handleSetDefault = async (id) => {
        if (!user) return;
        try {
            const batch = writeBatch(db);
            addresses.filter(a => a.isDefault).forEach(a => {
                const ref = doc(db, 'users', user.uid, 'shippingAddress', a.id);
                batch.update(ref, { isDefault: false });
            });
            const newDefaultRef = doc(db, 'users', user.uid, 'shippingAddress', id);
            batch.update(newDefaultRef, { isDefault: true });

            await batch.commit();

            showToast('Default address updated!', 'success'); // Highlighted Success
            fetchAddresses();

        } catch (error) {
            console.error("Error setting default address:", error);
            showToast('Failed to set default address.', 'danger');
        }
    }


    if (loading) return <CustomLoader message="Loading addresses..." />;

    return (
        <Card className="shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 font-cormorant">Your Address Book ({addresses.length})</h5>
                <Button variant="primary" size="sm" onClick={() => handleOpenModal(null)}>
                    + Add New Address
                </Button>
            </Card.Header>
            <Card.Body>
                {addresses.length === 0 ? (
                    <Alert variant="info" className="text-center mb-0">No saved addresses found. Please add a new one.</Alert>
                ) : (
                    <ListGroup variant="flush">
                        {addresses.map((addr) => (
                            <ListGroup.Item key={addr.id} className="d-flex justify-content-between align-items-center flex-wrap py-3">
                                <div className="me-auto mb-2 mb-sm-0">
                                    <strong className="d-block">{addr.street}, {addr.city} - {addr.pincode}</strong>
                                    <span className="text-muted small">{addr.state}</span>
                                    {addr.isDefault && <Badge bg="success" className="ms-2">Default</Badge>}
                                </div>
                                <div className="d-flex gap-2">
                                    {!addr.isDefault && (
                                        <Button variant="outline-success" size="sm" onClick={() => handleSetDefault(addr.id)}>Set Default</Button>
                                    )}
                                    <Button variant="outline-primary" size="sm" onClick={() => handleOpenModal(addr)}>Edit</Button>
                                    <Button variant="outline-danger" size="sm" onClick={() => handleDeleteAddress(addr.id, addr.isDefault)} disabled={addr.isDefault && addresses.length === 1}>Delete</Button>
                                </div>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                )}
            </Card.Body>

            {/* Address Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton><Modal.Title>{currentAddress.id ? 'Edit Address' : 'Add New Address'}</Modal.Title></Modal.Header>
                <Form onSubmit={handleSaveAddress}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Address Line</Form.Label>
                            <Form.Control type="text" placeholder="Street, Area" value={currentAddress.street} onChange={(e) => setCurrentAddress({...currentAddress, street: e.target.value})} required/>
                        </Form.Group>
                        <Row>
                            <Col sm={6}><Form.Group className="mb-3"><Form.Label>City</Form.Label>
                                <Form.Control type="text" value={currentAddress.city} onChange={(e) => setCurrentAddress({...currentAddress, city: e.target.value})} required/></Form.Group>
                            </Col>
                            <Col sm={6}><Form.Group className="mb-3"><Form.Label>State</Form.Label>
                                <Form.Control type="text" value={currentAddress.state} onChange={(e) => setCurrentAddress({...currentAddress, state: e.target.value})} required/></Form.Group>
                            </Col>
                            <Col sm={6}><Form.Group className="mb-3"><Form.Label>Pincode</Form.Label>
                                <Form.Control type="text" value={currentAddress.pincode} onChange={(e) => setCurrentAddress({...currentAddress, pincode: e.target.value})} required/></Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Check 
                                type="checkbox"
                                label="Set as default shipping address"
                                checked={currentAddress.isDefault}
                                onChange={(e) => setCurrentAddress({...currentAddress, isDefault: e.target.checked})}
                                disabled={addresses.length === 0 && !currentAddress.id}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button variant="primary" type="submit">Save Address</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Card>
    );
};

// --- NOTIFICATION SETTINGS (Retained) ---
const NotificationSettingsContent = ({ user, showToast }) => {
    const [settings, setSettings] = useState({ emailOrderUpdates: true, emailSaleAlerts: true, pushPromotions: true });
    const [loading, setLoading] = useState(false);
    
    const fetchSettings = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const settingsRef = doc(db, 'users', user.uid, 'settings', 'notifications');
            const settingsSnap = await getDoc(settingsRef);
            if (settingsSnap.exists()) {
                setSettings(prev => ({...prev, ...settingsSnap.data()}));
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);


    const handleToggle = async (key) => {
        const newSettings = { ...settings, [key]: !settings[key] };
        setSettings(newSettings);
        
        try {
            await setDoc(doc(db, 'users', user.uid, 'settings', 'notifications'), newSettings, { merge: true });
            showToast('Settings saved successfully!', 'success'); // Highlighted Success
        } catch (error) {
            showToast('Failed to save settings.', 'danger');
            fetchSettings(); 
        }
    };

    if (loading) return <CustomLoader message="Loading settings..." />;
    
    return (
        <Card className="shadow-sm">
            <Card.Header><h5 className="mb-0 font-cormorant">Manage Your Notifications</h5></Card.Header>
            <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>Email Order Updates</strong>
                        <p className="mb-0 text-muted small">Receive emails when your order is placed, shipped, or delivered.</p>
                    </div>
                    <Form.Check 
                        type="switch"
                        id="email-order-updates"
                        checked={settings.emailOrderUpdates}
                        onChange={() => handleToggle('emailOrderUpdates')}
                    />
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>Promotional Emails & Sale Alerts</strong>
                        <p className="mb-0 text-muted small">Stay updated on new products and exclusive discounts.</p>
                    </div>
                    <Form.Check 
                        type="switch"
                        id="email-sale-alerts"
                        checked={settings.emailSaleAlerts}
                        onChange={() => handleToggle('emailSaleAlerts')}
                    />
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>Push Notifications (Mobile App/Browser)</strong>
                        <p className="mb-0 text-muted small">Get instant alerts for new promotions (Future Feature).</p>
                    </div>
                    <Form.Check 
                        type="switch"
                        id="push-promotions"
                        checked={settings.pushPromotions}
                        onChange={() => handleToggle('pushPromotions')}
                    />
                </ListGroup.Item>
            </ListGroup>
        </Card>
    );
};

// --- PROFILE PICTURE UPLOADER (Optimized) ---
const ProfilePictureUploader = ({ user, showToast, setIsProfileUpdating }) => {
    const [image, setImage] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUpdating, setIsUpdating] = useState(false); 

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setImage(e.target.files[0]);
            setUploadProgress(0); 
        }
    };

    const handleUpload = async () => {
        if (!image || !user) {
            showToast('Please select an image first.', 'warning');
            return;
        }

        setIsUpdating(true); 
        setIsProfileUpdating(true); 
        
        const filePath = `profile_pictures/${user.uid}/avatar`;
        const storageRef = ref(storage, filePath); 
        const uploadTask = uploadBytesResumable(storageRef, image);

        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
            },
            (error) => {
                console.error("Upload failed:", error);
                showToast(`Upload failed: ${error.message}`, 'danger');
                setIsUpdating(false);
                setIsProfileUpdating(false);
                setUploadProgress(0);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                try {
                    await updateProfile(user, { photoURL: downloadURL });
                    showToast('Profile picture updated successfully!', 'success'); // Highlighted Success
                    
                    // FIX: Force Auth reload to update main component's 'user' state instantly
                    await auth.currentUser.reload();
                    
                    setImage(null);
                    setUploadProgress(0);

                } catch (err) {
                    console.error("Update Profile URL failed:", err);
                    showToast('Failed to save profile URL.', 'danger');
                } finally {
                    setIsUpdating(false);
                    setIsProfileUpdating(false);
                }
            }
        );
    };

    const handleDeletePicture = async () => {
        if (!user.photoURL) return;

        if (!window.confirm("Are you sure you want to remove your profile picture?")) return;
        
        setIsUpdating(true);
        setIsProfileUpdating(true);
        
        try {
            const filePath = `profile_pictures/${user.uid}/avatar`;
            const imageRef = ref(storage, filePath); 
            await deleteObject(imageRef);

            await updateProfile(user, { photoURL: null });

            showToast('Profile picture removed!', 'warning');
            await auth.currentUser.reload();
            
        } catch (error) {
            console.error("Failed to delete picture:", error);
            if (error.code === 'storage/object-not-found') {
                await updateProfile(user, { photoURL: null }); 
                await auth.currentUser.reload(); 
            }
            showToast('Failed to remove picture. Please try again.', 'danger');
        } finally {
            setIsUpdating(false);
            setIsProfileUpdating(false);
        }
    };

    const isDisabled = isUpdating;

    return (
        <Card className="shadow-sm h-100">
            <Card.Body>
                <Card.Title className="font-cormorant border-bottom pb-2 mb-3">Update Profile Image</Card.Title>
                <div className="text-center mb-4">
                    {user?.photoURL ? (
                        <img 
                            src={user.photoURL} 
                            alt="User Avatar" 
                            className="rounded-circle shadow" 
                            style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                        />
                    ) : (
                        <UserIcon size={150} />
                    )}
                </div>
                <Form.Group controlId="formFile" className="mb-3">
                    <Form.Control type="file" onChange={handleFileChange} accept="image/*" disabled={isDisabled} />
                </Form.Group>
                
                {image ? (
                    <div className="mb-3">
                        <Button 
                            variant="primary" 
                            onClick={handleUpload} 
                            disabled={isDisabled || uploadProgress > 0} 
                            className="w-100"
                        >
                            {isDisabled ? (
                                <><Spinner as="span" size="sm" animation="border" /> Uploading...</>
                            ) : (
                                'Upload & Save New Picture'
                            )}
                        </Button>
                        {uploadProgress > 0 && uploadProgress < 100 && (
                            <ProgressBar now={uploadProgress} label={`${Math.round(uploadProgress)}%`} className="mt-2" />
                        )}
                    </div>
                ) : (
                    user?.photoURL && (
                        <Button variant="outline-danger" onClick={handleDeletePicture} disabled={isDisabled} className="w-100">
                            Remove Current Picture
                        </Button>
                    )
                )}
            </Card.Body>
        </Card>
    );
};


// --- MAIN USER PROFILE PAGE (Cleaned & Optimized) ---

const UserProfilePage = ({ showToast }) => { 
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Removed: isAdmin state - No need for admin check in this user-focused dashboard
  
  const [name, setName] = useState('');
  
  const [password, setPassword] = useState({ current: '', new: '', confirm: '' });
  const [securityError, setSecurityError] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [isNameUpdating, setIsNameUpdating] = useState(false);
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);
  const [isProfileUpdating, setIsProfileUpdating] = useState(false); 
  
  const [activeTab, setActiveTab] = useState('profile');

  const navigate = useNavigate();

  // Optimized User load (Single, clean operation)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setName(currentUser.displayName || '');
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []); 

  // --- Handlers (Optimized for Highlight) ---
  const handleNameUpdate = async (e) => {
    e.preventDefault();
    setIsNameUpdating(true);
    try {
        await updateProfile(auth.currentUser, { displayName: name });
        showToast('Name updated successfully!', 'success'); // Highlighted Success
    } catch (err) {
        showToast('Failed to update name.', 'danger');
    } finally {
        setIsNameUpdating(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setSecurityError('');
    if (password.new !== password.confirm) {
      setSecurityError('New passwords do not match.');
      return;
    }
    if (password.new.length < 6) {
      setSecurityError('New password must be at least 6 characters long.');
      return;
    }

    setIsPasswordUpdating(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, password.current);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, password.new);
      showToast('Password updated successfully! Please login again.', 'success'); // Highlighted Success
      setPassword({ current: '', new: '', confirm: '' });
      setSecurityError(''); 
    } catch (err) {
      setSecurityError('Failed to update password. Please check your current password.');
    } finally {
      setIsPasswordUpdating(false);
    }
  };
  
  const handleDeleteAccount = async (e) => {
      e.preventDefault();
      if (!user) return;
      
      try {
          const credential = EmailAuthProvider.credential(user.email, deletePassword);
          await reauthenticateWithCredential(user, credential);

          const q = collection(db, 'users', user.uid, 'shippingAddress');
          const snapshot = await getDocs(q);
          const batch = writeBatch(db);
          snapshot.forEach(doc => batch.delete(doc.ref));
          batch.delete(doc(db, 'users', user.uid, 'settings', 'notifications'));
          await batch.commit();
          
          await deleteUser(user);

          showToast('Your account has been successfully deleted.', 'success'); // Highlighted Success
          setShowDeleteModal(false);
          navigate('/');
      } catch (err) {
          console.error("Account Deletion Failed:", err);
          let message = 'Failed to delete account. Please check your password.';
          if (err.code === 'auth/wrong-password') {
              message = 'Incorrect password provided.';
          }
          showToast(message, 'danger');
      }
  };


  if (loading) {
    return <CustomLoader message="Loading Profile..." />;
  }

  if (!user) {
    // Agar user logged in nahi hai, toh yeh screen show karega
    return <Alert variant="warning" className="text-center m-5">Please log in to view your profile.</Alert>;
  }

  return (
    <>
    <Container style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
      <h2 className="font-cormorant display-4 text-center mb-5">Account Dashboard</h2>
      
      <Row className="justify-content-center">
        <Col lg={10} md={12}>
            {/* --- TOP HEADER & QUICK ACTIONS (Dashboard Summary) --- */}
            <Card className="shadow-lg mb-5">
                <Card.Body className="p-4">
                    <Row className="align-items-center mb-4 border-bottom pb-3">
                        <Col xs={12} md={5} className="text-center text-md-start">
                            <div className="d-flex align-items-center justify-content-center justify-content-md-start">
                                {/* Profile Picture Display */}
                                {user.photoURL ? (
                                    <img 
                                        src={user.photoURL} 
                                        alt="User Avatar" 
                                        className="rounded-circle shadow" 
                                        style={{ width: '80px', height: '80px', objectFit: 'cover', marginRight: '1rem' }}
                                    />
                                ) : (
                                    <UserIcon size={80} />
                                )}
                                <div>
                                    <h4 className="mb-0">{name || user?.email.split('@')[0]}</h4>
                                    <p className="text-muted mb-0 small">{user?.email}</p>
                                </div>
                            </div>
                        </Col>
                        <Col xs={12} md={7} className="text-center text-md-end mt-3 mt-md-0">
                            <Button as={Link} to="/creations" variant="outline-success">
                                Explore New Creations
                            </Button>
                        </Col>
                    </Row>
                    
                    {/* User Metrics */}
                    <UserMetrics user={user} />
                    
                    <h5 className="font-cormorant mb-3 mt-4">Quick Navigation</h5>
                    <Row className="g-3">
                        <LinkCard 
                            to="/Order-history" 
                            title="My Orders" 
                            description="Track shipments, view history, confirm delivery, and write reviews." 
                            icon="📦"
                        />
                        <LinkCard 
                            to="/wishlist" 
                            title="My Wishlist" 
                            description="View and manage all your saved items. Move them to cart easily." 
                            icon="🤍"
                        />
                    </Row>
                </Card.Body>
            </Card>


            {/* --- ADVANCED SETTINGS TABS (Redesigned Forms) --- */}
            <Card className="profile-page-card shadow-lg">
                <Card.Body className="p-0">
                    <Tabs 
                        activeKey={activeTab} 
                        onSelect={(k) => setActiveTab(k)} 
                        id="config-tabs" 
                        className="profile-tabs" 
                        fill
                    >
                        {/* 1. Profile Tab (Redesigned Form) */}
                        <Tab eventKey="profile" title="Personal Info">
                            <Row className="g-4 p-4 justify-content-center">
                                <Col md={8}>
                                    <Card className="shadow-sm border-0">
                                        <Card.Body>
                                            <Card.Title className="font-cormorant border-bottom pb-2 mb-4">Update Name</Card.Title>
                                            <Form onSubmit={handleNameUpdate}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Full Name</Form.Label>
                                                    <Form.Control type="text" placeholder="Enter full name" value={name} onChange={(e) => setName(e.target.value)} required />
                                                </Form.Group>
                                                <Form.Group className="mb-4">
                                                    <Form.Label>Email Address</Form.Label>
                                                    <Form.Control type="email" defaultValue={user?.email} disabled />
                                                    <Form.Text className="text-muted">Email cannot be changed.</Form.Text>
                                                </Form.Group>
                                                <Button type="submit" variant="success" disabled={isNameUpdating}>
                                                    {isNameUpdating ? <><Spinner as="span" size="sm" /> Saving...</> : 'Save Name'}
                                                </Button>
                                            </Form>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </Tab>
                        
                        {/* 2. Address Book Tab (Multi-Address Management) */}
                        <Tab eventKey="address" title="Address Book">
                            <div className="p-4">
                                <AddressBookContent user={user} showToast={showToast} />
                            </div>
                        </Tab>

                        {/* 3. Notification Settings Tab (Preferences) */}
                        <Tab eventKey="notifications" title="Notifications">
                            <div className="p-4">
                                <NotificationSettingsContent user={user} showToast={showToast} />
                            </div>
                        </Tab>
                        
                        {/* 4. Update Image Tab */}
                        <Tab eventKey="image" title="Update Image">
                            <div className="p-4">
                                <ProfilePictureUploader 
                                    user={user} 
                                    showToast={showToast} 
                                    isProfileUpdating={isProfileUpdating}
                                    setIsProfileUpdating={setIsProfileUpdating}
                                />
                            </div>
                        </Tab>
                        
                        {/* 5. Security Tab (Redesigned Form) */}
                        <Tab eventKey="security" title="Security">
                            <Row className="g-4 p-4">
                                <Col md={7}>
                                    {/* Change Password Form (Main Focus) */}
                                    <Card className="shadow-sm h-100 border-0">
                                        <Card.Body>
                                            <Card.Title className="font-cormorant border-bottom pb-2 mb-4">Change Password</Card.Title>
                                            <Form onSubmit={handlePasswordUpdate}>
                                                {securityError && <Alert variant="danger" className="w-100">{securityError}</Alert>}
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Current Password</Form.Label>
                                                    <Form.Control type="password" placeholder="Enter current password" value={password.current} onChange={(e) => setPassword({...password, current: e.target.value})} required />
                                                </Form.Group>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>New Password</Form.Label>
                                                    <Form.Control type="password" placeholder="Enter new password (min 6 characters)" value={password.new} onChange={(e) => setPassword({...password, new: e.target.value})} required />
                                                </Form.Group>
                                                <Form.Group className="mb-4">
                                                    <Form.Label>Confirm New Password</Form.Label>
                                                    <Form.Control type="password" placeholder="Confirm new password" value={password.confirm} onChange={(e) => setPassword({...password, confirm: e.target.value})} required />
                                                </Form.Group>
                                                <Button type="submit" variant="danger" disabled={isPasswordUpdating}>
                                                    {isPasswordUpdating ? <><Spinner as="span" size="sm" /> Changing...</> : 'Change Password'}
                                                </Button>
                                            </Form>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={5}>
                                    {/* Delete Account (Danger Zone) - Clearer and more distinct */}
                                    <Card className="h-100 border border-danger shadow-sm">
                                        <Card.Body>
                                            <Card.Title className="font-cormorant border-bottom pb-2 mb-3 text-danger">Danger Zone</Card.Title>
                                            <Alert variant="danger">
                                                <Alert.Heading as="h6">Permanently Delete Account</Alert.Heading>
                                                <p className="mb-3 small">
                                                    This action will **irrevocably** delete your account and associated data.
                                                </p>
                                                <Button variant="danger" onClick={() => setShowDeleteModal(true)} className="w-100">
                                                    Delete My Account
                                                </Button>
                                            </Alert>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </Tab>

                    </Tabs>
                </Card.Body>
            </Card>
        </Col>
      </Row>
    </Container>

    {/* Account Deletion Confirmation Modal */}
    <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
            <Modal.Title className="text-danger">Confirm Account Deletion</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleDeleteAccount}>
            <Modal.Body>
                <Alert variant="danger">
                    <p>
                        Are you absolutely sure you want to delete your account? This action cannot be undone. 
                        Please enter your current password to confirm.
                    </p>
                </Alert>
                <Form.Group>
                    <Form.Label>Enter Current Password</Form.Label>
                    <Form.Control 
                        type="password" 
                        required 
                        value={deletePassword} 
                        onChange={(e) => setDeletePassword(e.target.value)}
                    />
                </Form.Group>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                <Button variant="danger" type="submit">
                    I Understand, Delete Account
                </Button>
            </Modal.Footer>
        </Form>
    </Modal>
    </>
  );
};

export default UserProfilePage;