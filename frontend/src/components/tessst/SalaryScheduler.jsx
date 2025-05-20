import React, { useState, useEffect } from "react";
//import axios from "axios";
import axios from '@/axios'
import "./Tessst.css";

const SalaryScheduler = ({ goBack, walletId }) => {
  const [salaryAmount, setSalaryAmount] = useState("");
  const [payDay, setPayDay] = useState("");
  const [message, setMessage] = useState("");
  const [scheduledSalaries, setScheduledSalaries] = useState([]);

  useEffect(() => {
    fetchScheduledSalaries();
  }, [walletId]);

  const fetchScheduledSalaries = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`/salary-scheduler/${walletId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScheduledSalaries(response.data);
    } catch (error) {
      setMessage("Error fetching scheduled salaries");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("You must be logged in to set up salary schedule");
        return;
      }

      if (!salaryAmount || !payDay) {
        setMessage("Please fill in all fields");
        return;
      }

      const response = await axios.post(
        `/salary-scheduler/${walletId}`,
        {
          amount: parseFloat(salaryAmount),
          payDay: parseInt(payDay)
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setMessage("Salary schedule set successfully!");
      setSalaryAmount("");
      setPayDay("");
      fetchScheduledSalaries();
    } catch (error) {
      setMessage(error.response?.data?.message || "Error setting up salary schedule");
    }
  };

  const handleDelete = async (scheduleId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/salary-scheduler/${scheduleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchScheduledSalaries();
      setMessage("Salary schedule deleted successfully");
    } catch (error) {
      setMessage("Error deleting salary schedule");
    }
  };

  return (
    <div className="wallet-container">
      <div className="wallet-header">
        <h2>Salary Scheduler</h2>
        <button className="back-button" onClick={goBack}>
          Return
        </button>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <label>
            Salary Amount:
            <input
              type="number"
              placeholder="Enter salary amount"
              value={salaryAmount}
              onChange={(e) => setSalaryAmount(e.target.value)}
              required
            />
          </label>
          <label>
            Pay Day (1-31):
            <input
              type="number"
              min="1"
              max="31"
              placeholder="Enter day of month"
              value={payDay}
              onChange={(e) => setPayDay(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="submit-button">
            Set Schedule
          </button>
        </form>
        {message && <p className="message">{message}</p>}
      </div>

      <div className="scheduled-salaries">
        <h3>Scheduled Salaries</h3>
        {scheduledSalaries.length > 0 ? (
          <ul>
            {scheduledSalaries.map((schedule) => (
              <li key={schedule._id} className="schedule-item">
                <span>Amount: {schedule.amount} TND</span>
                <span>Pay Day: {schedule.payDay}</span>
                <button
                  className="delete-button"
                  onClick={() => handleDelete(schedule._id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No scheduled salaries found</p>
        )}
      </div>
    </div>
  );
};

export default SalaryScheduler; 