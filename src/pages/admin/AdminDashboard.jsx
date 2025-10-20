import React, { useState, useEffect, useCallback } from 'react';
import { 
    Container, Row, Col, Card, Button, Spinner,
    ListGroup, Badge, ProgressBar 
} from 'react-bootstrap';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore'; 
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import CustomLoader from '../../components/CustomLoader';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import OfflineSalesEntry from './OfflineSalesEntry';
import LiveActivityFeed from './LiveActivityFeed';

// Chart.js modules ko register karna
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);


// ===============================================
// HELPER FUNCTIONS & CLEANED SVG ICONS (Final Version)
// ===============================================

const isFirestoreTimestamp = (value) => {
    return value && typeof value.toDate === 'function';
};

// 1. Sales Icon (Money)
const SalesIcon = ({ color = 'currentColor' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill={color} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"></line>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
);

// 2. Orders Icon (Box)
const OrdersIcon = ({ color = 'currentColor' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
    </svg>
);

// 3. Customers Icon (Users/People)
const CustomersIcon = ({ color = 'currentColor' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
);

// 4. Conversion Rate Icon (Target/Goal)
const ConversionIcon = ({ color = 'currentColor' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <circle cx="12" cy="12" r="6"></circle>
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4"></path>
    </svg>
);

// 5. Average Order Value (AOV) Icon (Graph/Chart)
const AOVIcon = ({ color = 'currentColor' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
        <line x1="18" y1="20" x2="6" y2="20"></line>
    </svg>
);

// 6. Revenue Per Customer (RPC) Icon (User with Money)
const RPCCustomerIcon = ({ color = 'currentColor' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="8.5" cy="7" r="4"></circle>
        <path d="M17 14l5-5-5-5"></path>
        <path d="M22 9h-7"></path>
    </svg>
);

// 7. Recent Signups Icon (User Plus)
const RecentSignupIcon = ({ color = 'currentColor' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="8.5" cy="7" r="4"></circle>
        <line x1="20" y1="8" x2="20" y2="14"></line>
        <line x1="23" y1="11" x2="17" y2="11"></line>
    </svg>
);

// 8. Top Seller Icon (List/Ranking)
const TopSellerIcon = ({ color = 'currentColor' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="10" y1="6" x2="21" y2="6"></line>
        <line x1="10" y1="12" x2="21" y2="12"></line>
        <line x1="10" y1="18" x2="21" y2="18"></line>
        <polyline points="3 6 3 6 3 18 3 18"></polyline>
        <line x1="3" y1="6" x2="6" y2="6"></line>
        <line x1="3" y1="12" x2="6" y2="12"></line>
        <line x1="3" y1="18" x2="6" y2="18"></line>
    </svg>
);

// 9. Low Stock Icon (Alert/Warning)
const LowStockIcon = ({ color = 'currentColor' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
);

// 10. Review Action Icon (Message/Chat bubble)
const ReviewActionIcon = ({ color = 'currentColor' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
);


// 11. Refresh Icon (Preserved)
const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
        <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
    </svg>
);


const AdminDashboard = () => {
    // STATE STRUCTURE PRESERVED
    const [onlineStats, setOnlineStats] = useState({ totalSales: 0, totalOrders: 0 });
    const [offlineStats, setOfflineStats] = useState({ totalSales: 0, totalOrders: 0 });
    const [totalUsers, setTotalUsers] = useState(0);
    
    const [advancedStats, setAdvancedStats] = useState({
        abandonedCarts: 0,
        topProducts: [],
        lowStockProducts: [],
        recentSignups: 0,
        unapprovedReviews: 0, 
    });
    
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: [],
    });

    const navigate = useNavigate();

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Last 6 Months Sales Overview (Online + Offline)', font: { size: 18, family: "'Cormorant Garamond', serif" } },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return '₹' + value.toLocaleString();
                    }
                }
            }
        }
    };

    // ===============================================
    // QUICK ACTION HANDLERS
    // ===============================================

    const handleNavigateToReviews = () => {
        // Navigate to Review Management page
        navigate('/admin/reviews'); 
    };

    const handleNavigateToProductAdd = () => {
        // Navigate to Product Management page (where AI description generation is done)
        navigate('/admin/products'); 
    };
    
  const fetchData = useCallback(async () => {
    if (!loading) setIsRefreshing(true);

    try {
        // PROMISE.ALL ARRAYS ORDER FIXED AND PRESERVED
        const [
            ordersSnapshot, 
            offlineSalesSnapshot, 
            usersSnapshot, 
            productsSnapshot, 
            abandonedCartsSnapshot, 
            allProductsSnapshot,
            reviewsSnapshot 
        ] = await Promise.all([
            getDocs(query(collection(db, 'orders'), orderBy('timestamp', 'desc'))),
            getDocs(query(collection(db, 'offlineSales'), orderBy('timestamp', 'desc'))),
            getDocs(query(collection(db, 'users'))),
            getDocs(query(collection(db, 'products'), orderBy('unitsSold', 'desc'), limit(5))),
            getDocs(query(collection(db, 'abandonedCarts'))),
            getDocs(query(collection(db, 'products'))), 
            getDocs(query(collection(db, 'reviews'), where('status', '==', 'pending'))), 
        ]);

        const allOrders = ordersSnapshot.docs.map(doc => doc.data());
        const completedOrders = allOrders.filter(order => order.status !== 'Cancelled');
        const totalOnlineOrders = completedOrders.length;
        const totalOnlineSales = completedOrders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);
        setOnlineStats({ totalOrders: totalOnlineOrders, totalSales: totalOnlineSales });

        const sales = offlineSalesSnapshot.docs.map(doc => doc.data());
        const totalOfflineOrders = sales.reduce((sum, sale) => sum + (Number(sale.orderCount) || 0), 0);
        const totalOfflineSales = sales.reduce((sum, sale) => sum + (Number(sale.totalAmount) || 0), 0);
        setOfflineStats({ totalOrders: totalOfflineOrders, totalSales: totalOfflineSales });

        const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const totalUsers = usersSnapshot.size;
        setTotalUsers(totalUsers);
      
        // --- Advanced Stats Processing ---
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recentSignups = allUsers.filter(user => 
            isFirestoreTimestamp(user.createdAt) && user.createdAt.toDate().getTime() > sevenDaysAgo
        ).length;

        const abandonedCarts = abandonedCartsSnapshot.size;

        const topProducts = productsSnapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            unitsSold: Number(doc.data().unitsSold) || 0 
        }));

        const lowStockProducts = allProductsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(p => (Number(p.stock) || 0) < 10)
            .slice(0, 5);
        
        // FIX: unapprovedReviews count is correctly taken from reviewsSnapshot.size
        const unapprovedReviews = reviewsSnapshot.size || 0; 
        
        setAdvancedStats(prev => ({
            ...prev,
            abandonedCarts,
            topProducts,
            lowStockProducts,
            recentSignups,
            unapprovedReviews, 
        }));

        processChartData(completedOrders, sales);

    } catch (error) {
        console.error("CRITICAL ERROR fetching dashboard data from Firebase: ", error);
    } finally {
        setLoading(false);
        setIsRefreshing(false);
    }
  }, [loading]);

  const processChartData = (onlineOrders, offlineSales) => {
    const labels = [];
    const monthlySales = {};

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        const monthKey = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        labels.push(`${monthLabel} '${String(year).slice(2)}`);
        monthlySales[monthKey] = 0;
    }

    onlineOrders.forEach(order => {
        if (isFirestoreTimestamp(order.timestamp)) {
            try {
                const date = order.timestamp.toDate(); 
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (monthlySales.hasOwnProperty(monthKey)) {
                    monthlySales[monthKey] += (Number(order.totalAmount) || 0);
                }
            } catch (e) { /* silent fail */ }
        }
    });

    offlineSales.forEach(sale => {
        if (sale.date) {
            try {
                const date = new Date(sale.date.includes('T') ? sale.date : sale.date + 'T00:00:00');
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (monthlySales.hasOwnProperty(monthKey)) {
                    monthlySales[monthKey] += (Number(sale.totalAmount) || 0);
                }
            } catch (e) { /* silent fail */ }
        }
    });

    setChartData({
        labels,
        datasets: [{
            label: 'Total Sales (Online + Offline)',
            data: Object.values(monthlySales),
            fill: true,
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: 'rgb(59, 130, 246)',
            tension: 0.3,
        }],
    });
  };
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculations (AOV, Conversion Rate, RPC)
  const grandTotalSales = onlineStats.totalSales + offlineStats.totalSales;
  const grandTotalOrders = onlineStats.totalOrders + offlineStats.totalOrders;
  const totalLeads = onlineStats.totalOrders + advancedStats.abandonedCarts;
  const conversionRate = totalLeads > 0 
    ? ((onlineStats.totalOrders / totalLeads) * 100).toFixed(2) 
    : 0;
  const AOV = grandTotalOrders > 0
    ? (grandTotalSales / grandTotalOrders).toFixed(2)
    : 0;
  const RPC = totalUsers > 0
    ? (grandTotalSales / totalUsers).toFixed(2)
    : 0;
  const AOV_TARGET = 2500;
  const AOV_PERCENT = (AOV / AOV_TARGET) * 100;

  if (loading) {
    return <CustomLoader message="Loading Advanced Dashboard Data..." />;
  }

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-5 border-bottom pb-3">
        <h2 className="mb-0 text-dark" style={{ fontFamily: "'Playfair Display', serif" }}>
          Ultra-Advanced Admin Hub
        </h2>
        <Button variant="primary" onClick={fetchData} disabled={isRefreshing} className="shadow-sm">
          {isRefreshing ? 
            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 
            <RefreshIcon />}
          <span className="ms-2 d-none d-md-inline">{isRefreshing ? 'Refreshing...' : 'Pull Latest Data'}</span>
        </Button>
      </div>
      
      {/* ===============================================
          KPI WIDGETS ROW 1
          =============================================== */}
      <Row className="mb-4">
        <Col lg={3} md={6} sm={12} className="mb-4">
            <Card className="shadow-lg border-0 h-100" style={{ backgroundColor: '#f0f9ff' }}>
                <Card.Body>
                    <div className="d-flex align-items-center">
                        <div className="icon-wrapper p-3 rounded-circle me-3" style={{ backgroundColor: '#007bff20', color: '#007bff' }}><SalesIcon color="#007bff" /></div>
                        <div>
                            <Card.Title className="text-muted mb-1" style={{ fontSize: '0.9rem' }}>GRAND SALES</Card.Title>
                            <Card.Text className="h4 mb-0">₹{grandTotalSales.toLocaleString()}</Card.Text>
                        </div>
                    </div>
                    <small className="text-muted d-block mt-2">
                        Online: ₹{onlineStats.totalSales.toLocaleString()} | Offline: ₹{offlineStats.totalSales.toLocaleString()}
                    </small>
                </Card.Body>
            </Card>
        </Col>

        <Col lg={3} md={6} sm={12} className="mb-4">
            <Card className="shadow-lg border-0 h-100" style={{ backgroundColor: '#f0fdf4' }}>
                <Card.Body>
                    <div className="d-flex align-items-center">
                        <div className="icon-wrapper p-3 rounded-circle me-3" style={{ backgroundColor: '#10b98120', color: '#10b981' }}><OrdersIcon color="#10b981" /></div>
                        <div>
                            <Card.Title className="text-muted mb-1" style={{ fontSize: '0.9rem' }}>TOTAL ORDERS</Card.Title>
                            <Card.Text className="h4 mb-0">{grandTotalOrders}</Card.Text>
                        </div>
                    </div>
                    <small className="text-muted d-block mt-2">
                        Online: {onlineStats.totalOrders} | Abandoned: {advancedStats.abandonedCarts}
                    </small>
                </Card.Body>
            </Card>
        </Col>

        <Col lg={3} md={6} sm={12} className="mb-4">
            <Card className="shadow-lg border-0 h-100" style={{ backgroundColor: '#fff7ed' }}>
                <Card.Body>
                    <div className="d-flex align-items-center">
                        <div className="icon-wrapper p-3 rounded-circle me-3" style={{ backgroundColor: '#f9731620', color: '#f97316' }}><ConversionIcon color="#f97316" /></div>
                        <div>
                            <Card.Title className="text-muted mb-1" style={{ fontSize: '0.9rem' }}>CONVERSION RATE</Card.Title>
                            <Card.Text className="h4 mb-0">{conversionRate}%</Card.Text>
                        </div>
                    </div>
                    <small className="text-muted d-block mt-2">
                        {onlineStats.totalOrders} Purchases from {totalLeads} Carts
                    </small>
                </Card.Body>
            </Card>
        </Col>

        <Col lg={3} md={6} sm={12} className="mb-4">
            <Card className="shadow-lg border-0 h-100" style={{ backgroundColor: '#fef2f2' }}>
                <Card.Body>
                    <div className="d-flex align-items-center">
                        <div className="icon-wrapper p-3 rounded-circle me-3" style={{ backgroundColor: '#ef444420', color: '#ef4444' }}><CustomersIcon color="#ef4444" /></div>
                        <div>
                            <Card.Title className="text-muted mb-1" style={{ fontSize: '0.9rem' }}>TOTAL CUSTOMERS</Card.Title>
                            <Card.Text className="h4 mb-0">{totalUsers}</Card.Text>
                        </div>
                    </div>
                    <small className="text-muted d-block mt-2">
                        New Signups (7 Days): <Badge bg="success">{advancedStats.recentSignups}</Badge>
                    </small>
                </Card.Body>
            </Card>
        </Col>
      </Row>

      {/* ===============================================
          ADVANCED METRICS ROW 2
          =============================================== */}
      <Row className="mb-4">
          {/* Average Order Value (AOV) */}
          <Col lg={3} md={6} sm={12} className="mb-4">
              <Card className="shadow-lg border-0 h-100" style={{ backgroundColor: '#e6fffa' }}>
                  <Card.Body>
                      <div className="d-flex align-items-center">
                          <div className="icon-wrapper p-3 rounded-circle me-3" style={{ backgroundColor: '#4c51bf20', color: '#4c51bf' }}><AOVIcon color="#4c51bf" /></div>
                          <div>
                              <Card.Title className="text-muted mb-1" style={{ fontSize: '0.9rem' }}>AVG. ORDER VALUE</Card.Title>
                              <Card.Text className="h4 mb-0">₹{AOV}</Card.Text>
                          </div>
                      </div>
                      <small className="text-muted d-block mt-2">
                          Target: ₹{AOV_TARGET.toLocaleString()} | Progress: <span className="fw-bold">{Math.min(AOV_PERCENT.toFixed(0), 100)}%</span>
                      </small>
                      <ProgressBar 
                          now={AOV_PERCENT} 
                          variant={AOV_PERCENT > 100 ? 'success' : 'info'}
                          className="mt-2"
                          max={150} 
                      />
                  </Card.Body>
              </Card>
          </Col>

          {/* Revenue Per Customer (RPC) */}
          <Col lg={3} md={6} sm={12} className="mb-4">
              <Card className="shadow-lg border-0 h-100" style={{ backgroundColor: '#fffbe6' }}>
                  <Card.Body>
                      <div className="d-flex align-items-center">
                          <div className="icon-wrapper p-3 rounded-circle me-3" style={{ backgroundColor: '#9f792820', color: '#9f7928' }}><RPCCustomerIcon color="#9f7928" /></div>
                          <div>
                              <Card.Title className="text-muted mb-1" style={{ fontSize: '0.9rem' }}>REVENUE PER CUSTOMER</Card.Title>
                              <Card.Text className="h4 mb-0">₹{RPC}</Card.Text>
                          </div>
                      </div>
                      <small className="text-muted d-block mt-2">
                          Calculated from Grand Sales and Total Customers.
                      </small>
                  </Card.Body>
              </Card>
          </Col>

          {/* Recent Signups */}
          <Col lg={3} md={6} sm={12} className="mb-4">
              <Card className="shadow-lg border-0 h-100" style={{ backgroundColor: '#e9f7ef' }}>
                  <Card.Body>
                      <div className="d-flex align-items-center">
                          <div className="icon-wrapper p-3 rounded-circle me-3" style={{ backgroundColor: '#2f855a20', color: '#2f855a' }}><RecentSignupIcon color="#2f855a" /></div>
                          <div>
                              <Card.Title className="text-muted mb-1" style={{ fontSize: '0.9rem' }}>RECENT SIGNUPS</Card.Title>
                              <Card.Text className="h4 mb-0">{advancedStats.recentSignups}</Card.Text>
                          </div>
                      </div>
                      <small className="text-muted d-block mt-2">
                          Active growth in the last 7 days.
                      </small>
                  </Card.Body>
              </Card>
          </Col>
          
          {/* QUICK ACTIONS WIDGET */}
          <Col lg={3} md={6} sm={12} className="mb-4">
              <Card className="shadow-lg border-0 h-100" style={{ backgroundColor: '#f0f4f7' }}>
                  <Card.Body>
                      <Card.Title className="text-muted d-flex align-items-center justify-content-between">
                         QUICK ACTIONS 
                         <ReviewActionIcon color="#007bff" />
                      </Card.Title>
                      
                      <Button 
                          variant="primary" 
                          size="sm" 
                          className="w-100 mb-2 shadow-sm"
                          onClick={handleNavigateToProductAdd}
                      >
                          Generate AI Descriptions
                      </Button>
                      
                      <Button 
                          variant={advancedStats.unapprovedReviews > 0 ? "danger" : "outline-secondary"} 
                          size="sm" 
                          className="w-100 shadow-sm"
                          onClick={handleNavigateToReviews}
                      >
                          Check Unapproved Reviews 
                          {advancedStats.unapprovedReviews > 0 && (
                            <Badge bg="light" text="danger" className="ms-2">{advancedStats.unapprovedReviews}</Badge>
                          )}
                      </Button>
                      <small className="d-block text-center text-muted mt-2">
                            Pending Reviews: {advancedStats.unapprovedReviews}
                      </small>

                  </Card.Body>
              </Card>
          </Col>
      </Row>

      {/* ===============================================
          CHART AND ACTIVITY FEED
          =============================================== */}
      <Row className="mt-4">
        <Col lg={8} className="mb-4 mb-lg-0">
            <Card className="shadow-sm h-100">
              <Card.Header className="bg-white fw-bold">
                  Monthly Sales Trend
              </Card.Header>
              <Card.Body style={{ height: '400px' }}>
                <Line options={chartOptions} data={chartData} />
              </Card.Body>
            </Card>
        </Col>
        <Col lg={4}>
            <LiveActivityFeed />
        </Col>
      </Row>

      {/* ===============================================
          INSIGHTS AND TOOLS
          =============================================== */}
      <Row className="mt-4">
          {/* Top Selling Products */}
          <Col lg={4} md={6} className="mb-4">
              <Card className="shadow-sm h-100">
                  <Card.Header className="bg-light fw-bold d-flex align-items-center">
                      <TopSellerIcon color="#333" /> <span className="ms-2">Top Selling Products</span>
                  </Card.Header>
                  <ListGroup variant="flush">
                      {advancedStats.topProducts.length > 0 ? advancedStats.topProducts.map((product, index) => (
                          <ListGroup.Item key={product.id} className="d-flex justify-content-between align-items-center">
                              <span className="fw-bold me-2" style={{ width: '20px' }}>#{index + 1}</span>
                              <div className="flex-grow-1 text-truncate">{product.name}</div>
                              <Badge bg="primary" pill className="ms-2">{product.unitsSold} Units</Badge>
                          </ListGroup.Item>
                      )) : <ListGroup.Item className="text-muted">No sales data available.</ListGroup.Item>}
                  </ListGroup>
              </Card>
          </Col>

          {/* Low Stock Alerts */}
          <Col lg={4} md={6} className="mb-4">
              <Card className="shadow-sm h-100 border-warning">
                  <Card.Header className="bg-warning-light fw-bold text-danger d-flex align-items-center">
                      <LowStockIcon color="#dc3545" /> <span className="ms-2">CRITICAL LOW STOCK ALERT</span>
                  </Card.Header>
                  <ListGroup variant="flush">
                      {advancedStats.lowStockProducts.length > 0 ? advancedStats.lowStockProducts.map((product) => (
                          <ListGroup.Item key={product.id} className="d-flex justify-content-between align-items-center py-2">
                              <div className="flex-grow-1 text-truncate me-2">{product.name}</div>
                              <Badge bg="danger" className="p-2">Stock: {product.stock}</Badge>
                              <ProgressBar
                                  now={product.stock}
                                  max={50} // Visualization max
                                  variant={product.stock < 5 ? 'danger' : 'warning'}
                                  className="ms-3"
                                  style={{ width: '80px' }}
                              />
                          </ListGroup.Item>
                      )) : <ListGroup.Item className="text-muted">No products are currently low in stock.</ListGroup.Item>}
                  </ListGroup>
              </Card>
          </Col>

          {/* Offline Sales Entry */}
          <Col lg={4} md={12} className="mb-4">
              <OfflineSalesEntry onSaleAdded={fetchData} />
          </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard;