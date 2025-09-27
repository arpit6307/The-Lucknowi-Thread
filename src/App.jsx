import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, setDoc, deleteDoc, writeBatch, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Components and Pages
import AppNavbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Creations from './pages/Creations';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CartPage from './pages/CartPage';
import PaymentPage from './pages/PaymentPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import AdminPage from './pages/AdminPage';
import CustomCursor from './components/CustomCursor';
import ScrollToTopButton from './components/ScrollToTopButton';
import AlertToast from './components/AlertToast';
import CustomLoader from './components/CustomLoader';
import ProductDetailsPage from './pages/ProductDetailsPage';
import WishlistPage from './pages/WishlistPage';
import UserProfilePage from './pages/UserProfilePage';

// Admin Panel Components
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductManagement from './pages/admin/ProductManagement';
import ManageOrders from './pages/admin/ManageOrders';
import CouponManagement from './pages/admin/CouponManagement';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const ProtectedRoute = ({ children, isLoggedIn }) => {
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }
  return children;
};

const AdminRoute = ({ children, isAdmin, isLoggedIn }) => {
    if (!isLoggedIn) {
      return <Navigate to="/login" />;
    }
    if (!isAdmin) {
      return <Navigate to="/" />;
    }
    return children;
};

const RedirectIfLoggedIn = ({ children, isLoggedIn }) => {
  if (isLoggedIn) {
    return <Navigate to="/" />;
  }
  return children;
};

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isSaleActive, setIsSaleActive] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  useEffect(() => {
    const saleStartDate = new Date('2025-09-22T00:00:00');
    const saleEndDate = new Date('2025-10-02T23:59:59');
    const now = new Date();
    
    if (now >= saleStartDate && now <= saleEndDate) {
      setIsSaleActive(true);
    } else {
      setIsSaleActive(false);
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setUserRole('admin');
        } else {
          setUserRole('user');
        }
        
        const cartColRef = collection(db, 'users', user.uid, 'cart');
        const cartSnapshot = await getDocs(cartColRef);
        const savedCart = cartSnapshot.docs.map(doc => ({ ...doc.data() }));
        setCart(savedCart);
        
      } else {
        setUserRole(null);
        setCart([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addToCart = async (product) => {
    if (!currentUser) return;

    const updatedCart = [...cart];
    const itemIndex = updatedCart.findIndex(item => item.id === product.id && item.size === product.size);
    
    if (itemIndex > -1) {
      updatedCart[itemIndex].quantity += product.quantity;
    } else {
      updatedCart.push(product);
    }
    
    setCart(updatedCart);

    const cartItemRef = doc(db, 'users', currentUser.uid, 'cart', `${product.id}_${product.size}`);
    await setDoc(cartItemRef, updatedCart.find(item => item.id === product.id && item.size === product.size));
  };

  const removeFromCart = async (productId, size) => {
    if (!currentUser) return;
    const updatedCart = cart.filter(item => !(item.id === productId && item.size === size));
    setCart(updatedCart);
    const cartItemRef = doc(db, 'users', currentUser.uid, 'cart', `${productId}_${size}`);
    await deleteDoc(cartItemRef);
  };

  const updateCartQuantity = async (productId, size, newQuantity) => {
    if (!currentUser || newQuantity < 1 || newQuantity > 10) return;

    const updatedCart = cart.map(item => 
      item.id === productId && item.size === size 
        ? { ...item, quantity: newQuantity } 
        : item
    );
    setCart(updatedCart);

    const cartItemRef = doc(db, 'users', currentUser.uid, 'cart', `${productId}_${size}`);
    await updateDoc(cartItemRef, { quantity: newQuantity });
  };

  const clearCart = async () => {
    if (!currentUser) return;
    setCart([]);
    const cartColRef = collection(db, 'users', currentUser.uid, 'cart');
    const cartSnapshot = await getDocs(cartColRef);
    const batch = writeBatch(db);
    cartSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  };
  
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };
  
  useEffect(() => {
    AOS.init({ duration: 1000, once: true, offset: 50 });
  }, []);

  if (loading) {
    return <CustomLoader message="Initializing App..." />;
  }

  return (
    <>
      <CustomCursor />
      <ScrollToTop />
      <AppNavbar user={currentUser} userRole={userRole} cartCount={cart.reduce((count, item) => count + item.quantity, 0)} />
      <main>
        <Routes>
          <Route path="/" element={<Home showToast={showToast} isSaleActive={isSaleActive} />} />
          <Route path="/creations" element={<Creations />} />
          <Route path="/product/:productId" element={<ProductDetailsPage addToCart={addToCart} isLoggedIn={!!currentUser} />} />
          
          <Route path="/login" element={<RedirectIfLoggedIn isLoggedIn={!!currentUser}><LoginPage /></RedirectIfLoggedIn>} />
          <Route path="/signup" element={<RedirectIfLoggedIn isLoggedIn={!!currentUser}><SignupPage /></RedirectIfLoggedIn>} />
          
          <Route 
            path="/cart" 
            element={
              <ProtectedRoute isLoggedIn={!!currentUser}>
                <CartPage 
                  cartItems={cart} 
                  removeFromCart={removeFromCart} 
                  updateCartQuantity={updateCartQuantity} 
                  isLoggedIn={!!currentUser} 
                  isSaleActive={isSaleActive}
                  appliedCoupon={appliedCoupon}
                  setAppliedCoupon={setAppliedCoupon}
                />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/payment" 
            element={
              <ProtectedRoute isLoggedIn={!!currentUser}>
                <PaymentPage 
                  cartItems={cart} 
                  clearCart={clearCart} 
                  isSaleActive={isSaleActive} 
                  appliedCoupon={appliedCoupon}
                />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/order-history" 
            element={<ProtectedRoute isLoggedIn={!!currentUser}><OrderHistoryPage /></ProtectedRoute>} 
          />
          <Route 
            path="/wishlist" 
            element={<ProtectedRoute isLoggedIn={!!currentUser}><WishlistPage /></ProtectedRoute>} 
          />
          <Route 
            path="/profile" 
            element={<ProtectedRoute isLoggedIn={!!currentUser}><UserProfilePage showToast={showToast} /></ProtectedRoute>} 
          />
          
          <Route 
            path="/admin" 
            element={<AdminRoute isLoggedIn={!!currentUser} isAdmin={userRole === 'admin'}><AdminPage /></AdminRoute>}
          >
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="products" element={<ProductManagement />} />
            <Route path="orders" element={<ManageOrders />} />
            <Route path="coupons" element={<CouponManagement />} />
          </Route>
        </Routes>
      </main>
      <Footer showToast={showToast} />
      <ScrollToTopButton />
      <AlertToast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
    </>
  );
}

const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;