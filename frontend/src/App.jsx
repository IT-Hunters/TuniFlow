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
import  Chat  from "./components/Chat/chat";
import ChatAdmin  from "./components/ChatAdmin/chatAdmin";
import Wallet from "./components/Wallet/Wallet";
import Transaction from "./components/Transaction/Transaction";
import CreateInvoice from './components/Invoice/CreateInvoice'; 
import SendInvoice from './components/Invoice/SendInvoice'; 
import LoginChart from './components/GetDailyLogins/getDailyLogins';
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
        <Route path="/wallet/:walletId" element={<Wallet />} /> 
        <Route path="/wallet/create" element={<Wallet />} />
        <Route path="/transactions/:walletId" element={<Transaction />} />
        <Route path="/LoginChart" element={<LoginChart />} />
      </Routes>
    </Router>
  );
}

export default App;
