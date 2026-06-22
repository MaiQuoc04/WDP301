import React from 'react';
import RoomList from './RoomList';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const CustomerHome = () => {
  return (
    <div className="page-wrapper" style={{ backgroundColor: '#f9f9f9', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ flex: 1 }}>
        <RoomList />
      </div>
      <Footer />
    </div>
  );
};

export default CustomerHome;
