import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashbord from "./components/Dashbord";
import AuthPage from "./components/Auth/Authpage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/dashboard" element={<Dashbord />} />
      </Routes>
    </Router>
  );
}

export default App;
