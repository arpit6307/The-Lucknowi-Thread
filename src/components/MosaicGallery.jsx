import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, InputGroup, Form, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../firebase';
import CustomLoader from './CustomLoader';

// Icon for search bar
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
    </svg>
);


const MosaicGallery = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, 'products'));
        const querySnapshot = await getDocs(q);
        const productsList = querySnapshot.docs.map((doc, index) => ({ 
            id: doc.id, 
            ...doc.data(),
            // Add a bestseller tag to some products for visual flair
            isBestSeller: index % 4 === 0 
        }));
        setProducts(productsList);
      } catch (err) {
        setError('Could not load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (sortOrder === 'low-to-high') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'high-to-low') {
      filtered.sort((a, b) => b.price - a.price);
    }
    return filtered;
  }, [products, searchTerm, sortOrder]);

  if (loading) {
    return <CustomLoader message="Loading Collection..." />;
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <section className="collection-section">
      <Container>
        <div className="text-center collection-header" data-aos="fade-up">
            <h2 className="font-cormorant display-4">Our Creations</h2>
            <p className="lead text-muted mx-auto">
                Explore our curated collection of handcrafted Chikankari attire. Each piece tells a story of tradition, elegance, and masterful artistry.
            </p>
        </div>
        
        {/* Search and Filter Controls */}
        <Row className="justify-content-center my-5" data-aos="fade-up" data-aos-delay="100">
            <Col lg={8}>
                <div className="controls-wrapper">
                    <InputGroup className="collection-search-bar">
                        <InputGroup.Text><SearchIcon /></InputGroup.Text>
                        <Form.Control type="text" placeholder="Search for kurtis, sarees, etc..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </InputGroup>
                    <Form.Select aria-label="Sort by price" onChange={(e) => setSortOrder(e.target.value)} className="collection-filter">
                        <option value="">Sort By</option>
                        <option value="low-to-high">Price: Low to High</option>
                        <option value="high-to-low">Price: High to Low</option>
                    </Form.Select>
                </div>
            </Col>
        </Row>

        {filteredAndSortedProducts.length > 0 ? (
          <Row xs={2} sm={2} lg={3} xl={4} className="g-3 g-md-4">
            {filteredAndSortedProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </Row>
        ) : (
          <Alert variant="info" className="text-center mt-4">No products found matching your criteria.</Alert>
        )}
      </Container>
    </section>
  );
};

// Sub-component for a single product card
const ProductCard = ({ product, index }) => {
  return (
    <Col data-aos="fade-up" data-aos-delay={(index % 4) * 100}>
      <Link to={`/product/${product.id}`} className="product-card-link">
        <Card className="product-card-v2 h-100">
          <div className="product-img-wrapper">
            <Card.Img variant="top" src={product.src} alt={product.name} className="product-img" />
            {product.isBestSeller && <Badge bg="primary" className="product-badge">Best Seller</Badge>}
            <div className="product-card-overlay">
                <span>View Details</span>
            </div>
          </div>
          <Card.Body className="text-center">
            <Card.Title className="font-cormorant product-name">{product.name}</Card.Title>
            <Card.Text className="product-price">₹{product.price}</Card.Text>
          </Card.Body>
        </Card>
      </Link>
    </Col>
  );
};

export default MosaicGallery;

