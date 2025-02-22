import Sidebar from '../../components/sidebar/Sidebar';
//import sidebar from "../sidebar/Sidebar.css";
import Navbar from "../../components/navbar/Navbar";
import AddAssetActif from '../../components/assetActif/assetActifComponent';
import AddLiability from '../../components/assetPassif/LiabilityComponent';

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
          <AddLiability/>
      </div>
    </div>
    </>
  );
};

export default AssetsLayer;
