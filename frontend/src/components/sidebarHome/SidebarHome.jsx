import './SidebarHome.css';
import { Link } from "react-router-dom";
import { LayoutDashboard, Store, Package, Users, FileText, Settings, HelpCircle, LogOut, Briefcase } from "lucide-react";

const Sidebar = () => {
  return (
    <nav className="sidebar-home">
      <div className="brand">TUNIFLOW</div>
      <ul>
        <li><a href="#0"><LayoutDashboard size={20} /> Tableau de Bord</a></li>
        <li><Link to="/adminusers"><Briefcase size={20} /> Gestion des Entreprises</Link></li>
        <li><a href="#0"><Store size={20} /> Boutique</a></li>
        <li><a href="#0"><Package size={20} /> Commandes</a></li>
        <li><a href="#0"><Users size={20} /> Clients</a></li>
        <li><a href="#0"><FileText size={20} /> Rapports</a></li>
        <li><a href="#0"><Settings size={20} /> Paramètres</a></li>
        <li><a href="#0"><HelpCircle size={20} /> Centre d'Aide</a></li>
        <li><a href="#0"><LogOut size={20} /> Déconnexion</a></li>
      </ul>
    </nav>
  );
};

export default Sidebar;
