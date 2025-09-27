import React from 'react';
import MosaicGallery from '../components/MosaicGallery';

const Creations = ({ addToCart, isLoggedIn }) => {
  return (
    <>
      <MosaicGallery addToCart={addToCart} isLoggedIn={isLoggedIn} />
    </>
  );
};

export default Creations;