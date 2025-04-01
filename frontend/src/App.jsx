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
import User  from "./components/User/User";
import  Chat  from "./components/Chat/chat";
import ChatAdmin  from "./components/ChatAdmin/chatAdmin";

import CreateInvoice from './components/Invoice/CreateInvoice'; 
import SendInvoice from './components/Invoice/SendInvoice'; 
import Wallet from "./components/Wallet/Wallet";
import Tessst from "./components/tessst/Tessst";
import Depossit from "./components/tessst/Depossit";
import Transfer from "./components/tessst/Transfer";
import Withdraw from "./components/tessst/Withdraw";
import AddProject from "./components/Project/AddProject";
import MyProject from "./components/Project/MyProject";
import ObjectiveManagement from "./components/Objectif/ObjectifManagement";

function App() {         
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/dashboard" element={<Dashbord />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={<Profile  />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/Assets" element={<AssetsDashboard  />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/Adminusers" element={<AdminUsers />} />
        <Route path="/user" element={<User/>} />
        <Route path="/chat" element={<Chat/>} />
        <Route path="/chatadmin" element={<ChatAdmin  />} />
        <Route path="/invoice" element={<CreateInvoice />} />
        <Route path="/send-invoice" element={<SendInvoice />} /> 
        <Route path="/wallet" element={<Wallet />} /> 
        <Route path="/Transaction" element={<Tessst />} /> 
        <Route path="/Depossit" element={<Depossit />} /> 
        <Route path="/Transfer" element={<Transfer />} />
        <Route path="/Withdraw" element={<Withdraw />} />
        <Route path="/AddProject" element={<AddProject />} />
        <Route path="/MyProject" element={<MyProject />} />
        <Route path="/ObjectiveManagement" element={<ObjectiveManagement />} />

      </Routes>
    </Router>
  );
}

export default App;