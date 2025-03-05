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
        // Calculate the start and end of the current week
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() + (6 - now.getDay())); // Saturday

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
      
    };

    if (walletId) fetchTransactions();
  }, [walletId]);

  // Handle loading, error, and empty states
  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (transactions.length === 0) return <p>No transactions this week.</p>;

  // Sort transactions by date
  const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

  // Prepare data for the bar chart
  const labels = sortedTransactions.map(t => new Date(t.date).toLocaleString());
  const amounts = sortedTransactions.map(t => t.type === "income" ? t.amount : -t.amount);
  const backgroundColors = sortedTransactions.map(t => t.type === "income" ? "#4caf50" : "#f44336");

  // Chart data
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

  // Chart options
  const options = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Amount",
        },
      },
      x: {
        title: {
          display: true,
          text: "Date and Time",
        },
      },
    },
    plugins: {
      legend: {
        display: false, // Hide legend since colors are intuitive
      },
      title: {
        display: true,
        text: "Weekly Transactions",
      },
    },
  };

  return (
    <div>
      <h4>Weekly Activity</h4>
      <Bar data={data} options={options} />
    </div>
  );
};

// Dashboard Component
const Dashbord = () => {
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState({});
  const [newEvent, setNewEvent] = useState("");
  const [ setUsers] = useState([]);
  const [ setLoading] = useState(true);
  const [ setError] = useState('');

  const walletId = "67c4412beda8f25b329e2987"; // Replace with dynamic value if needed

  useEffect(() => {
    setEvents(loadEventsFromLocalStorage());
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No token found. Please log in.');
          setLoading(false);
          return;
        }
        const response = await axios.get('http://localhost:3000/users/getall', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(response.data);
      
    };
    fetchUsers();
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
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Customer Name</th>
                    <th>Items</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>#045699</td>
                    <td>Eren Yeager</td>
                    <td>1 x Black Backpack</td>
                    <td>07/12/2022</td>
                    <td><span className="status paid">Paid</span></td>
                    <td>$100</td>
                  </tr>
                  <tr>
                    <td>#045700</td>
                    <td>Levi Ackerman</td>
                    <td>2 x T-Shirts</td>
                    <td>08/12/2022</td>
                    <td><span className="status pending">Pending</span></td>
                    <td>$45</td>
                  </tr>
                  <tr>
                    <td>#045701</td>
                    <td>Mikasa Ackerman</td>
                    <td>1 x Jacket</td>
                    <td>09/12/2022</td>
                    <td><span className="status refunded">Refunded</span></td>
                    <td>$75</td>
                  </tr>
                  <tr>
                    <td>#045702</td>
                    <td>Historia Reiss</td>
                    <td>2 x Bags</td>
                    <td>10/12/2022</td>
                    <td><span className="status paid">Paid</span></td>
                    <td>$120</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashbord;