import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { collection, onSnapshot, query } from 'firebase/firestore';
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

// Chart.js ke zaroori modules ko register karna.
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Statistics cards ke liye simple icon components
const SalesIcon = () => '💰';
const OrdersIcon = () => '📦';
const CustomersIcon = () => '👥';

const AdminDashboard = () => {
  // Statistics aur loading state ko manage karne ke liye state variables.
  const [stats, setStats] = useState({ totalSales: 0, totalOrders: 0, totalUsers: 0 });
  const [loading, setLoading] = useState(true);
  
  // Sales chart ke liye data. Abhi ke liye, yeh static data hai.
  // Isse aap apne database se fetch kiye gaye real data se replace kar sakte hain.
  const chartData = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [
      {
        label: 'Monthly Sales (₹)',
        data: [6500, 5900, 8000, 8100, 5600, 5500, 4000],
        fill: false,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true, // Chart ko responsive banata hai
    maintainAspectRatio: false, // Container ke size ke hisaab se adjust hone deta hai
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Sales Overview',
        font: {
            size: 18,
            family: "'Cormorant Garamond', serif"
        }
      },
    },
  };

  useEffect(() => {
    // Firestore se real-time data fetch karne ke liye onSnapshot listeners.
    const qOrders = query(collection(db, 'orders'));
    const unsubscribeOrders = onSnapshot(qOrders, (querySnapshot) => {
      const totalOrders = querySnapshot.size;
      const totalSales = querySnapshot.docs.reduce((sum, doc) => sum + doc.data().totalAmount, 0);
      setStats(prevStats => ({ ...prevStats, totalOrders, totalSales }));
      if(loading) setLoading(false);
    }, (error) => {
        console.error("Error fetching orders: ", error);
        setLoading(false);
    });

    const qUsers = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(qUsers, (querySnapshot) => {
      const totalUsers = querySnapshot.size;
      setStats(prevStats => ({ ...prevStats, totalUsers }));
      if(loading) setLoading(false);
    }, (error) => {
        console.error("Error fetching users: ", error);
        setLoading(false);
    });

    // Component unmount hone par listeners ko saaf karna zaroori hai.
    return () => {
      unsubscribeOrders();
      unsubscribeUsers();
    };
  }, []);

  if (loading) {
    return <CustomLoader message="Loading Dashboard..." />;
  }

  return (
    <Container fluid>
      <h3 className="mb-4">Dashboard</h3>
      <Row>
        {/* Total Sales Card: Alag-alag screen size ke liye responsive columns */}
        <Col lg={4} md={6} sm={12} className="mb-4">
            <Card className="dashboard-card">
                <Card.Body>
                    <div className="icon-wrapper" style={{ backgroundColor: '#e0f2fe' }}><SalesIcon /></div>
                    <div>
                        <Card.Title className="text-muted">Total Sales</Card.Title>
                        <Card.Text>₹{stats.totalSales.toLocaleString()}</Card.Text>
                    </div>
                </Card.Body>
            </Card>
        </Col>
        {/* Total Orders Card */}
        <Col lg={4} md={6} sm={12} className="mb-4">
            <Card className="dashboard-card">
                <Card.Body>
                    <div className="icon-wrapper" style={{ backgroundColor: '#dcfce7' }}><OrdersIcon /></div>
                    <div>
                        <Card.Title className="text-muted">Total Orders</Card.Title>
                        <Card.Text>{stats.totalOrders}</Card.Text>
                    </div>
                </Card.Body>
            </Card>
        </Col>
        {/* Total Customers Card */}
        <Col lg={4} md={6} sm={12} className="mb-4">
            <Card className="dashboard-card">
                <Card.Body>
                    <div className="icon-wrapper" style={{ backgroundColor: '#f3e8ff' }}><CustomersIcon /></div>
                    <div>
                        <Card.Title className="text-muted">Total Customers</Card.Title>
                        <Card.Text>{stats.totalUsers}</Card.Text>
                    </div>
                </Card.Body>
            </Card>
        </Col>
      </Row>

      {/* Sales Chart */}
      <Row>
        <Col>
          <Card className="dashboard-card mt-3">
            <Card.Body style={{ height: '400px' }}> {/* Chart ko ek fixed height di hai */}
              <Line options={chartOptions} data={chartData} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard;

