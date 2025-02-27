import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashbord from "./components/dashboard/Dashbord";
import AuthPage from "./components/Auth/Authpage";
import Profile from "./components/Profile/Profile";
import AssetsDashboard from "./layers/ProjectAssets/AssetsDashboard";
import EditProfile from "./components/Profile/EditProfile";
import HomePage from "./components/Homepage/HomePage";
import ResetPassword from "./components/forgetpassword/resetpassword";
import ForgotPassword from "./components/forgetpassword/forgetpassword";
import AdminUsers from "./components/Admin/AdminUsers";
import  User  from "./components/User/User";
function App() {         
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/dashboard" element={<Dashbord />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/profile" element={<Profile  />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/Assets" element={<AssetsDashboard  />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/Adminusers" element={<AdminUsers />} />
        <Route path="/user" element={<User  />} />
      </Routes>
    </Router>
  );
}

export default App;
