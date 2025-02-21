import Sidebar from '../../components/sidebar/Sidebar';
//import sidebar from "../sidebar/Sidebar.css";
import Navbar from "../../components/navbar/Navbar";
import AddAssetActif from '../../components/assetActif/assetActifComponent';

// Set the favicon dynamically in React (optional):
import { useEffect } from 'react';
const AssetsLayer = () => {
  return (
    <>
      {/* Main Dashboard Container */}
      <div className="container">
        <Sidebar />
        <div className="main">
          {/* Navbar */}
          <Navbar />
        <AddAssetActif/>
      </div>
    </div>
    </>
  );
};

export default AssetsLayer;
