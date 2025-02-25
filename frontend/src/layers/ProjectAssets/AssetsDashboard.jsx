import React, { useState, useEffect } from "react";
import TopValuableAssetsChart from "../../components/Charts/TopValuableAsset";
import WorkingCapitalDashboard from "../../components/Charts/WorkingCapitale";
import CandlestickCashFlowChart from "../../components/Charts/CandlestickChart";
import AssetForm from "../../components/Formulaire/AddAssetActifForm";
import AddLiabilityForm from "../../components/Formulaire/AddLiabilityForm"; 
import { getAllAssets } from "../../services/AssetActifService";
import { getAllLiabilities } from "../../services/LiabilityService";
import Sidebar from "../../components/sidebar/Sidebar";
import Navbar from "../../components/navbar/Navbar";
import Popup from "reactjs-popup";
import  "../../components/assetActif/assetActifComponent.css";
import "reactjs-popup/dist/index.css";

const AssetsDashboard = () => {
  const [assets, setAssets] = useState([]);
  const [liabilities, setLiabilities] = useState([]);
  const projectId = "67bb69af26a4e63fc511cb6d";
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState("asset"); 

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
    const fetchLiabilities = async () => {
      try {
        const response = await getAllLiabilities();
        setLiabilities(response);
      } catch (error) {
        console.error("Failed to fetch liabilities:", error);
      }
    };
    fetchLiabilities();
  }, []);

  return (
    <div>
      <div className="container">
        <Sidebar />
        <div className="main">
          <Navbar />
          <div className="main-panel">
            <div className="content-wrapper">
              <div className="row">
                <div className="col-lg-8">
                  <div className="row">
                    <div className="col-lg-6 grid-margin stretch-card">
                      <div className="assetcard">
                        <div className="card-body">
                          <h4 className="card-title">Most Valuable Actif Assets</h4>
                          <TopValuableAssetsChart assets={assets.slice(0, 5)} />
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-6 grid-margin stretch-card">
                      <div className="assetcard">
                        <div className="card-body">
                          <h4 className="card-title">Most Valuable Liabilities</h4>
                          <TopValuableAssetsChart assets={liabilities.slice(0, 5)} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-lg-12 stretch-card">
                  <div className="assetcard WorkingCapitalDashboard">
                    <div className="card-body">
                      <CandlestickCashFlowChart />
                    </div>
                  </div>
                </div>
                  </div>
                </div>
                <div className="col-lg-4 stretch-card">
                  <div className="assetcard WorkingCapitalDashboard">
                    <div className="card-body">
                      <WorkingCapitalDashboard projectId={projectId} />
                    </div>
                  </div>
                </div>
                <div className="col text-center mt-3">
                      <button className="btn btn-primary me-2" onClick={() => setIsPopupOpen(true)}>
                        Add Asset
                      </button>
                    </div>
              </div>
              <Popup 
                open={isPopupOpen} 
                onClose={() => setIsPopupOpen(false)} 
                modal
                closeOnDocumentClick
                contentStyle={{
                  maxWidth: "500px", 
                  width: "90%", 
                  maxHeight: "90vh",
                  overflowY: "auto", 
                  padding: "20px", 
                  borderRadius: "10px", 
                }}
              >
                <div className="col-lg-12 grid-margin stretch-card">
                  <div className="assetcard">
                    <div className="card-body">
                      <h3>Select Asset Type</h3>
                      <div className="d-flex justify-content-center mb-3">
                        <button 
                          className={`btn me-2 ${selectedForm === "asset" ? "btn btn-dark  btn-fw" : "btn btn-outline-dark  btn-fw"}`} 
                          onClick={() => setSelectedForm("asset")}
                        >
                          Asset Active
                        </button>
                        <button 
                          className={`btn ${selectedForm === "liability" ? "btn btn-dark  btn-fw" : "btn btn-outline-dark  btn-fw"}`} 
                          onClick={() => setSelectedForm("liability")}
                        >
                          Liability Asset
                        </button>
                      </div>
                      <div key={selectedForm}>
                        {selectedForm === "asset" ? (
                          <AssetForm handleClose={() => setIsPopupOpen(false)} />
                        ) : (
                          <AddLiabilityForm handleClose={() => setIsPopupOpen(false)} />
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              </Popup>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetsDashboard;
