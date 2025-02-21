import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashbord from "./components/dashboard/Dashbord";
import AuthPage from "./components/Auth/Authpage";
import Profile from "./components/Profile/Profile";
import AssetsLayer from "./layers/assetActif/AssetsLayer";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/dashboard" element={<Dashbord />} />
        <Route path="/profile" element={<Profile  />} />
        <Route path="/Assets" element={<AssetsLayer  />} />
      </Routes>
    </Router>
  );
}

export default App;
