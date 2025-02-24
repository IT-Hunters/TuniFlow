import React, { useState, useEffect } from "react";
import TopValuableAssetsChart from "../../components/Charts/TopValuableAsset"; 
import WorkingCapitalDashboard from "../../components/Charts/WorkingCapitale"; 
import { getAllAssets } from "../../services/AssetActifService"; 
import { getAllLiabilities } from "../../services/LiabilityService"; 
import Sidebar from "../../components/sidebar/Sidebar";
import Navbar from "../../components/navbar/Navbar";
const AssetsDashboard = () => {
  const [assets, setAssets] = useState([]);
  const [Liabilities, setLiabilities] = useState([]);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await getAllAssets();
        setAssets(response); 
      } catch (error) {
        console.error("Failed to fetch assets:", error);
      }
    };
    fetchAssets();
  }, []);
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await getAllLiabilities();
        setLiabilities(response); 
      } catch (error) {
        console.error("Failed to fetch assets:", error);
      }
    };
    fetchAssets();
  }, []);

  return (
        <div>
            <div className="container">
                <Sidebar /> 
                    <div className="main">
                        <Navbar />
                            <div class="main-panel">
                                <div class="content-wrapper">
                                <div class="row">
                                    <div class="col-lg-6 grid-margin stretch-card">
                                    <div class="assetcard">
                                        <div class="card-body">
                                        <h4 class="card-title">Most Valuable Actif Assets</h4>
                                        <TopValuableAssetsChart assets={assets.slice(0, 5)} />
                                        </div>
                                    </div>
                                    </div>
                                
                                    <div class="col-lg-6 grid-margin stretch-card">
                                    <div class="assetcard">
                                        <div class="card-body">
                                        <h4 class="card-title">Most Valuable Liabilities</h4>
                                        <TopValuableAssetsChart assets={Liabilities.slice(0, 5)} />
                                        </div>
                                    </div>
                                    </div>

                                    <div class="col-lg-6 grid-margin stretch-card">
                                    <div class="assetcard">
                                        <div class="card-body">
                                        <h4 class="card-title">Most Valuable Liabilities</h4>
                                        <WorkingCapitalDashboard />
                                        </div>
                                    </div>
                                    </div>
                                </div>
                            </div>
                    </div>
            </div>
        </div>
    </div>
  );
};

export default AssetsDashboard;
