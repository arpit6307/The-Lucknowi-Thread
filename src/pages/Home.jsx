import React from 'react';
import Hero from '../components/Hero';
import About from '../components/About';
import History from '../components/History';
import Gallery from '../components/Gallery';
import Contact from '../components/Contact';
import AnnouncementBanner from '../components/AnnouncementBanner'; // Import the new banner
import FAQ from '../components/FAQ';

const Home = ({ showToast }) => {
  return (
    <>
      <Hero />
      <AnnouncementBanner /> {/* Add the banner to the homepage */}
      <About />
      <History />
      <Gallery />
      <FAQ /> {/* <-- YAHAN ADD KAREIN */}
      <Contact showToast={showToast} /> 
    </>
  );
};

export default Home;

