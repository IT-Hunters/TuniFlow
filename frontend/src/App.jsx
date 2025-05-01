import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Dashbord from "./components/dashboard/Dashbord";
import AuthPage from "./components/Auth/Authpage";
import Profile from "./components/Profile/Profile";
import AssetsDashboard from "./layers/ProjectAssets/AssetsDashboard";
import EditProfile from "./components/Profile/EditProfile";
import HomePage from "./components/Homepage/HomePage";
import ResetPassword from "./components/forgetpassword/resetpassword";
import ForgotPassword from "./components/forgetpassword/forgetpassword";
import AdminUsers from "./components/Admin/AdminUsers";
import User from "./components/User/User";
import Chat from "./components/Chat/chat";
import ChatAdmin from "./components/ChatAdmin/chatAdmin";
import ProjectView from "./components/Project/ProjectView";
import ProjectDetails from "./components/Project/ProjectDetails";
import OwnerProjectsView from "./components/Project/OwnerProjectsView";
import CreateInvoice from "./components/Invoice/CreateInvoice";
import SendInvoice from "./components/Invoice/SendInvoice";
import Wallet from "./components/Wallet/Wallet";
import Tessst from "./components/tessst/Tessst";
import Depossit from "./components/tessst/Depossit";
import Transfer from "./components/tessst/Transfer";
import Withdraw from "./components/tessst/Withdraw";
import FinancialStatements from "./components/tessst/FinancialStatements";
import AddProject from "./components/Project/AddProject";
import MyProject from "./components/Project/MyProject";
import ObjectiveManagement from "./components/Objectif/ObjectifManagement";
import AddObjective from "./components/Objectif/AddObjectif";
import EditObjective from "./components/Objectif/EditObjectif";
import ObjectifDetails from "./components/Objectif/ObjectifDetails";
import CreateManager from "./components/Project/Createmanager";
import ManagerList from "./components/Project/ManagerList";
import AddUser from "./components/Project/AddUser";
import OwnerInvoices from "./components/Invoice/OwnerInvoices";
import ManagerInvoices from "./components/Invoice/ManagerInvoices";
import AddEmployee from "./components/Project/AddEmployee";
import UpdateProject from "./components/Project/UpadateProject";
import ObjectiveAnalytics from "./components/Objectif/ObjectiveAnalytics";
import UserUpdate from "./components/Project/UserUpdate";
import EmployeeTable from "./components/Project/EmployeeTable";
import Updatebymanager from "./components/Project/Updatebymanager";
import Conversation from "./components/Project/Conversation";
import Room from './components/Project/Room';
import CreateRoomModal from './components/Project/CreateRoomModal';

function App() {
  return (
    <Router>
      <ToastContainer
        position="top-center"
        autoClose={7000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/dashboard" element={<Dashbord />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/Assets" element={<AssetsDashboard />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/Adminusers" element={<AdminUsers />} />
        <Route path="/user" element={<User />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/chatadmin" element={<ChatAdmin />} />
        <Route path="/invoice" element={<CreateInvoice />} />
        <Route path="/owner-invoices" element={<OwnerInvoices />} />
        <Route path="/manager-invoices" element={<ManagerInvoices />} />
        <Route path="/send-invoice" element={<SendInvoice />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/Transaction" element={<Tessst />} />
        <Route path="/Depossit" element={<Depossit />} />
        <Route path="/Transfer" element={<Transfer />} />
        <Route path="/Withdraw" element={<Withdraw />} />
        <Route path="/financial-statements" element={<FinancialStatements />} />
        <Route path="/AddProject" element={<AddProject />} />
        <Route path="/MyProject" element={<MyProject />} />
        <Route path="/ObjectiveManagement" element={<ObjectiveManagement />} />
        <Route path="/AddObjective" element={<AddObjective />} />
        <Route path="/EditObjective" element={<EditObjective />} />
        <Route path="/ObjectifDetails" element={<ObjectifDetails />} />
        <Route path="/CreateManager" element={<CreateManager />} />
        <Route path="/ManagerList" element={<ManagerList />} />
        <Route path="/AddUser" element={<AddUser />} />
        <Route path="/projectview" element={<ProjectView />} />
        <Route path="/OwnerProjectsView" element={<OwnerProjectsView />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />
        <Route path="/add-employee" element={<AddEmployee />} />
        <Route path="/projects/:id/edit" element={<UpdateProject />} />
        <Route path="/ObjectiveAnalytics" element={<ObjectiveAnalytics />} />
        <Route path="/edit-manager/:id" element={<UserUpdate />} />
        <Route path="/Updatebymanager/:id" element={<Updatebymanager />} />
        <Route path="/findemploye" element={<EmployeeTable />} />
        <Route path="/conversation" element={<Conversation />} />
        <Route path="/rooms/:projectId" element={<Room />} />
        <Route path="/CreateRoomModal" element={<CreateRoomModal />} />
      </Routes>
    </Router>
  );
}

export default App;