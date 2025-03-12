import { useState, useEffect } from "react";
import './user.css';
import customer from './assets/customer.png';
import revenue from './assets/revenue.png';
import profit from './assets/profit.png';
import expenses from './assets/expenses.png';
import CoolSidebar from "../sidebarHome/newSidebar";
import Navbar from "../navbarHome/NavbarHome";
import Calendar from "react-calendar";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";

// Register Chart.js components globally
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// TransactionList Component with Bar Chart
const TransactionList = ({ walletId }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + (6 - now.getDay())); // Saturday

      try {
        const response = await axios.get(
          `http://localhost:3000/transactions/getTransactions/${walletId}`,
          {
            params: {
              startDate: startOfWeek.toISOString(),
              endDate: endOfWeek.toISOString(),
            },
          }
        );
        setTransactions(response.data);
        setError("");
      } catch (err) {
        setError("Erreur lors de la récupération des transactions");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (walletId) fetchTransactions();
  }, [walletId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (transactions.length === 0) return <p>No transactions this week.</p>;

  const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
  const labels = sortedTransactions.map(t => new Date(t.date).toLocaleString());
  const amounts = sortedTransactions.map(t => t.type === "income" ? t.amount : -t.amount);
  const backgroundColors = sortedTransactions.map(t => t.type === "income" ? "#4caf50" : "#f44336");

  const data = {
    labels: labels,
    datasets: [
      {
        label: "Transactions",
        data: amounts,
        backgroundColor: backgroundColors,
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Amount" },
      },
      x: {
        title: { display: true, text: "Date and Time" },
      },
    },
    plugins: {
      legend: { display: false },
      title: { display: true, text: "Weekly Transactions" },
    },
  };

  return (
    <div>
      <h4>Weekly Activity</h4>
      <Bar data={data} options={options} />
    </div>
  );
};

// Dashboard Component with Dynamic Invoices
const Dashbord = () => {
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState({});
  const [newEvent, setNewEvent] = useState("");
  const [users, setUsers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const walletId = "67c4412beda8f25b329e2987"; // Remplacez par une valeur dynamique si nécessaire

  useEffect(() => {
    setEvents(loadEventsFromLocalStorage());

    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found. Please log in.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Récupérer les utilisateurs
        const usersResponse = await axios.get('http://localhost:3000/users/getall', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(usersResponse.data);

        // Récupérer les factures
        const invoicesResponse = await axios.get('http://localhost:3000/invoices/my-invoices', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInvoices(invoicesResponse.data);
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors du chargement des données');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDateChange = (selectedDate) => setDate(selectedDate);

  const getRandomColor = () => {
    const colors = ["#FF0000", "#800080", "#008000"]; // Red, Purple, Green
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const addEvent = () => {
    if (newEvent.trim() !== "") {
      const formattedDate = date.toDateString();
      const updatedEvents = {
        ...events,
        [formattedDate]: [...(events[formattedDate] || []), { description: newEvent, color: getRandomColor() }],
      };
      setEvents(updatedEvents);
      setNewEvent("");
      saveEventsToLocalStorage(updatedEvents);
    }
  };

  const saveEventsToLocalStorage = (events) => localStorage.setItem("events", JSON.stringify(events));
  const loadEventsFromLocalStorage = () => JSON.parse(localStorage.getItem("events")) || {};

  const tileContent = ({ date, view }) => {
    if (view === "month") {
      const formattedDate = date.toDateString();
      const dayEvents = events[formattedDate] || [];
      if (dayEvents.length > 0) {
        return (
          <div className="event-dots">
            {dayEvents.slice(0, 3).map((event, index) => (
              <span
                key={index}
                className="event-dot"
                style={{ backgroundColor: event.color }}
              />
            ))}
            {dayEvents.length > 3 && <span className="event-dot">...</span>}
          </div>
        );
      }
    }
    return null;
  };

  const handleAcceptInvoice = async (invoiceId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:3000/invoices/${invoiceId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoices(invoices.map(invoice => 
        invoice._id === invoiceId ? { ...invoice, status: 'PAID' } : invoice
      ));
      alert('Facture acceptée avec succès !');
    } catch (error) {
      console.error('Erreur lors de l’acceptation:', error);
      setError(error.response?.data?.message || 'Échec de l’acceptation de la facture');
    }
  };

  return (
    <>
      <div className="container">
        <CoolSidebar />
        <div className="main">
          <Navbar />
          <div className="content">
            <div className="stats-cards">
              <div className="card-dashboard" style={{ display: 'flex' }}>
                <div><img src={customer} alt="Customers" className="icon" /></div>
                <div>
                  <h3>Customers</h3>
                  <p>1,456</p>
                  <small>+ 56 last week</small>
                </div>
              </div>
              <div className="card-dashboard" style={{ display: 'flex' }}>
                <div><img src={revenue} alt="Revenue" className="iconrevenue" /></div>
                <div style={{ marginLeft: '50px' }}>
                  <h3>Revenue</h3>
                  <p>$23k</p>
                  <small>+ 2.3k last week</small>
                </div>
              </div>
              <div className="card-dashboard" style={{ display: 'flex' }}>
                <div><img src={profit} alt="Profit" className="iconrevenue" /></div>
                <div style={{ marginLeft: '50px' }}>
                  <h3>Profit</h3>
                  <p>60%</p>
                  <small>+ 6% last week</small>
                </div>
              </div>
              <div className="card-dashboard" style={{ display: 'flex' }}>
                <div><img src={expenses} alt="Expenses" className="iconexpenses" /></div>
                <div style={{ marginLeft: '40px' }}>
                  <h3>Expenses</h3>
                  <p>1,345</p>
                  <small>+ 145 last week</small>
                </div>
              </div>
            </div>

            <div className="charts">
              <div className="chart-box">
                <TransactionList walletId={walletId} />
              </div>
              <div className="chart-box">
                <h4>Calendar</h4>
                <div className="calendar-container">
                  <Calendar
                    onChange={handleDateChange}
                    value={date}
                    className="react-calendar"
                    tileContent={tileContent}
                  />
                  <input
                    type="text"
                    placeholder="Add event..."
                    value={newEvent}
                    onChange={(e) => setNewEvent(e.target.value)}
                    className="event-input"
                  />
                  <button onClick={addEvent} className="calendar-button">
                    Save Event
                  </button>
                  <div className="event-list">
                    {events[date.toDateString()]?.map((event, index) => (
                      <p key={index}>- {event.description}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="recent-invoices">
              <h4>Recent Invoices</h4>
              {loading ? (
                <p>Loading invoices...</p>
              ) : error ? (
                <p style={{ color: "red" }}>{error}</p>
              ) : invoices.length === 0 ? (
                <p>No invoices available.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Creator</th>
                      <th>Category</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Price</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice, index) => (
                      <tr key={invoice._id}>
                        <td>#{index + 1}</td>
                        <td>{invoice.creator_id.fullname}</td>
                        <td>{invoice.category || 'N/A'}</td>
                        <td>{new Date(invoice.due_date).toLocaleDateString()}</td>
                        <td>
                          <span className={`status ${invoice.status.toLowerCase()}`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td>{invoice.amount} TND</td>
                        <td>
                          {invoice.status === 'PENDING' && (
                            <button
                              onClick={() => handleAcceptInvoice(invoice._id)}
                              className="accept-button"
                              disabled={loading}
                            >
                              Accept
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashbord;