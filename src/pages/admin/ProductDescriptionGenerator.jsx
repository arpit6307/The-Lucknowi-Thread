// src/pages/admin/ProductDescriptionGenerator.jsx

import React, { useState } from 'react';

const ProductDescriptionGenerator = ({ onClose }) => {
  const [productName, setProductName] = useState('');
  const [keywords, setKeywords] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!productName) {
      alert('Please enter a product name.');
      return;
    }
    setIsLoading(true);
    // This is a placeholder for the actual AI model call.
    // In a real application, you would make an API call to a generative AI service.
    setTimeout(() => {
      const generatedDescription = `Introducing the new ${productName}, a testament to traditional craftsmanship. This exquisite piece is crafted with the finest materials, focusing on ${keywords}. Perfect for any occasion, it brings a touch of elegance and tradition to your collection.`;
      setDescription(generatedDescription);
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>AI Product Description Generator</h2>
        <div className="form-group">
          <label>Product Name</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g., Hand-Embroidered Kurta"
          />
        </div>
        <div className="form-group">
          <label>Keywords (comma-separated)</label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="e.g., chikankari, cotton, elegant"
          />
        </div>
        <button onClick={handleGenerate} disabled={isLoading} className="btn-primary">
          {isLoading ? 'Generating...' : 'Generate Description'}
        </button>
        {description && (
          <div className="generated-description">
            <h3>Generated Description:</h3>
            <textarea readOnly value={description}></textarea>
          </div>
        )}
        <button onClick={onClose} className="btn-secondary" style={{marginTop: '1rem'}}>Close</button>
      </div>
    </div>
  );
};

export default ProductDescriptionGenerator;