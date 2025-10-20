/**
 * =================================================================
 * App.jsx - The Heart of "The Lucknowi Thread" Application
 * =================================================================
 * PURPOSE:
 * - Yeh file poore application ka main container hai.
 * - Yahi se saare pages (Routes) manage hote hain.
 * - User authentication, shopping cart, theme (light/dark mode), aur
 * sale status jaisi global states ko yahi control kiya jaata hai.
 * - NEW: AI Assistant ke liye naya route add kiya gaya hai.
 * =================================================================
 */

// --- Section 1: Necessary Imports ---
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';

// Firebase se authentication aur database functions import kiye ja rahe hain.
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, setDoc, deleteDoc, writeBatch, updateDoc } from 'firebase/firestore';
import { auth, db } from '/src/firebase.js';

// Animation library import.
import AOS from 'aos';
import 'aos/dist/aos.css';

// --- Reusable UI Components ---
import AppNavbar from '/src/components/Navbar.jsx';
import Footer from '/src/components/Footer.jsx';
import CustomCursor from '/src/components/CustomCursor.jsx';
import ScrollToTopButton from '/src/components/ScrollToTopButton.jsx';
import AlertToast from '/src/components/AlertToast.jsx';
import CustomLoader from '/src/components/CustomLoader.jsx';
import Chatbot from '/src/components/Chatbot.jsx';

// --- Page Components ---
import Home from '/src/pages/Home.jsx';
import Creations from '/src/pages/Creations.jsx';
import ProductDetailsPage from '/src/pages/ProductDetailsPage.jsx';
import CartPage from '/src/pages/CartPage.jsx';
import PaymentPage from '/src/pages/PaymentPage.jsx';
import OrderHistoryPage from '/src/pages/OrderHistoryPage.jsx';
import WishlistPage from '/src/pages/WishlistPage.jsx';
import UserProfilePage from '/src/pages/UserProfilePage.jsx';

// --- Authentication Pages ---
import LoginPage from '/src/pages/LoginPage.jsx';
import SignupPage from '/src/pages/SignupPage.jsx';

// --- Admin Panel Pages ---
import AdminPage from '/src/pages/AdminPage.jsx';
import AdminDashboard from '/src/pages/admin/AdminDashboard.jsx';
import ProductManagement from '/src/pages/admin/ProductManagement.jsx';
import ManageOrders from '/src/pages/admin/ManageOrders.jsx';
import CouponManagement from '/src/pages/admin/CouponManagement.jsx';
import SaleManagement from '/src/pages/admin/SaleManagement.jsx';
import CustomerSegmentation from '/src/pages/admin/CustomerSegmentation.jsx';
import AbandonedCarts from '/src/pages/admin/AbandonedCarts.jsx';
import ReviewManagement from '/src/pages/admin/ReviewManagement.jsx';
import RecycleBin from '/src/pages/admin/RecycleBin.jsx';
// NEW: AI Assistant component import
import AiAssistant from '/src/pages/admin/AiAssistant.jsx';


// --- Section 2: Helper Components ---

// Yeh component page change hone par screen ko automatically top par scroll kar deta hai.
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Yeh component check karta hai ki user logged in hai ya nahi. Agar nahi, to login page par bhej deta hai.
const ProtectedRoute = ({ children, isLoggedIn }) => {
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }
  return children;
};

// Yeh component admin-only pages ko protect karta hai.
const AdminRoute = ({ children, isAdmin, isLoggedIn }) => {
    if (!isLoggedIn) {
      return <Navigate to="/login" />;
    }
    if (!isAdmin) {
      return <Navigate to="/" />;
    }
    return children;
};

// Agar user pehle se logged in hai, to use login/signup page par jaane se rokta hai.
const RedirectIfLoggedIn = ({ children, isLoggedIn }) => {
  if (isLoggedIn) {
    return <Navigate to="/" />;
  }
  return children;
};


// --- Section 3: Main App Component ---
function App() {
  // --- State Management ---
  const [currentUser, setCurrentUser] = useState(null); // Current logged-in user ki details
  const [userRole, setUserRole] = useState(null);       // User ka role ('admin' ya 'user')
  const [loading, setLoading] = useState(true);         // Page load ho raha hai ya nahi
  const [cart, setCart] = useState([]);                 // Shopping cart ke items
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' }); // Notifications
  const [isSaleActive, setIsSaleActive] = useState(false); // Sale active hai ya nahi
  const [appliedCoupon, setAppliedCoupon] = useState(null); // Apply kiya hua coupon
  const [saleDetails, setSaleDetails] = useState(null);     // Sale ki details

  // --- Theme (Light/Dark Mode) ---
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    const userPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return savedTheme || (userPrefersDark ? 'dark' : 'light');
  });

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  // --- Admin Page Detection ---
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  // --- Effects (Data Fetching & Initialization) ---
  useEffect(() => {
    AOS.init({ duration: 1000, once: true, offset: 50 });

    const checkSaleStatus = async () => {
      try {
        const saleDocRef = doc(db, 'sales', 'currentSale');
        const docSnap = await getDoc(saleDocRef);
        if (docSnap.exists() && docSnap.data().isActive) {
          const saleData = docSnap.data();
          setSaleDetails(saleData);
          const now = new Date();
          const startDate = new Date(saleData.startDate);
          const endDate = new Date(saleData.endDate);
          setIsSaleActive(now >= startDate && now <= endDate);
        } else {
          setIsSaleActive(false);
          setSaleDetails(null);
        }
      } catch (error) {
        console.error("Error checking sale status:", error);
        setIsSaleActive(false);
      }
    };

    checkSaleStatus();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        setUserRole(userDoc.exists() && userDoc.data().role === 'admin' ? 'admin' : 'user');
        
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

  // --- Cart Management Functions ---
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
    setCart(cart.filter(item => !(item.id === productId && item.size === size)));
    const cartItemRef = doc(db, 'users', currentUser.uid, 'cart', `${productId}_${size}`);
    await deleteDoc(cartItemRef);
  };

  const updateCartQuantity = async (productId, size, newQuantity) => {
    if (!currentUser || newQuantity < 1 || newQuantity > 10) return;
    const updatedCart = cart.map(item => item.id === productId && item.size === size ? { ...item, quantity: newQuantity } : item);
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
    cartSnapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  };
  
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };
  
  if (loading) {
    return <CustomLoader message="Initializing App..." />;
  }

  return (
    <>
      <CustomCursor />
      <ScrollToTop />
      
      {!isAdminPage && (
        <AppNavbar 
          user={currentUser} 
          userRole={userRole} 
          cartCount={cart.reduce((count, item) => count + item.quantity, 0)} 
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}

      <main>
        <Routes>
          <Route path="/" element={<Home showToast={showToast} />} />
          <Route path="/creations" element={<Creations />} />
          <Route path="/product/:productId" element={<ProductDetailsPage addToCart={addToCart} isLoggedIn={!!currentUser} />} />
          
          <Route path="/login" element={<RedirectIfLoggedIn isLoggedIn={!!currentUser}><LoginPage /></RedirectIfLoggedIn>} />
          <Route path="/signup" element={<RedirectIfLoggedIn isLoggedIn={!!currentUser}><SignupPage /></RedirectIfLoggedIn>} />
          
          <Route path="/cart" element={<ProtectedRoute isLoggedIn={!!currentUser}><CartPage cartItems={cart} removeFromCart={removeFromCart} updateCartQuantity={updateCartQuantity} isLoggedIn={!!currentUser} isSaleActive={isSaleActive} appliedCoupon={appliedCoupon} setAppliedCoupon={setAppliedCoupon} saleDetails={saleDetails} /></ProtectedRoute>} />
          <Route path="/payment" element={<ProtectedRoute isLoggedIn={!!currentUser}><PaymentPage cartItems={cart} clearCart={clearCart} isSaleActive={isSaleActive} appliedCoupon={appliedCoupon} saleDetails={saleDetails} /></ProtectedRoute>} />
          <Route path="/order-history" element={<ProtectedRoute isLoggedIn={!!currentUser}><OrderHistoryPage showToast={showToast} /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute isLoggedIn={!!currentUser}><WishlistPage addToCart={addToCart} /></ProtectedRoute>} />
          {/* src/App.jsx (Example) */}
          <Route path="/profile" element={<UserProfilePage showToast={showToast} addToCart={addToCart} />} />
          
          {/* --- Protected Admin Routes --- */}
          <Route path="/admin" element={<AdminRoute isLoggedIn={!!currentUser} isAdmin={userRole === 'admin'}><AdminPage /></AdminRoute>}>
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="products" element={<ProductManagement />} />
            <Route path="reviews" element={<ReviewManagement />} />
            <Route path="orders" element={<ManageOrders />} />
            <Route path="customers" element={<CustomerSegmentation />} />
            <Route path="abandoned-carts" element={<AbandonedCarts />} />
            <Route path="coupons" element={<CouponManagement />} />
            <Route path="sales" element={<SaleManagement />} />
            <Route path="recycle-bin" element={<RecycleBin />} />
            {/* NEW: AI Assistant Route */}
            <Route path="ai-assistant" element={<AiAssistant />} />
          </Route>
        </Routes>
      </main>
      
      {!isAdminPage && (
        <>
          <Chatbot />
          <Footer showToast={showToast} />
          <ScrollToTopButton />
        </>
      )}

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

