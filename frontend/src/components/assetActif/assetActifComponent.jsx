  import '../assetActif/assetActifComponent.css';
import AddAssetActifForm from'../Formulaire/AddAssetActifForm.jsx';
const AddAssetActif = () => {
      return (
        <>
        <div className="assetActif">        
          <div className="main-panel">        
            <div className="content-wrapper">
              <div className="row">
                <div className="col-md-6 grid-margin stretch-card">
                  <div className="assetcard">
                    <div className="card-body">
                      <h4 className="card-title">Asset Formulaire</h4>
                      <p className="card-description">This formulaire adds an actif asset</p>
                      <AddAssetActifForm/>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </>
      );
    };

export default AddAssetActif;
