// QRScanner.jsx
import React, { useState } from "react";
import { QrReader } from "react-qr-reader";
import axios from "axios";

const QRScanner = () => {
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const handleScan = async (data) => {
    if (data) {
      setResult(data);
      try {
        const token = localStorage.getItem("token");
        await axios.put(data, {}, { headers: { Authorization: `Bearer ${token}` } });
        alert("Invoice accepted successfully!");
      } catch (err) {
        setError("Error accepting invoice: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleError = (err) => {
    setError("Error scanning QR code: " + err.message);
    console.error(err);
  };

  return (
    <div className="qr-scanner" style={{ padding: "20px" }}>
      <h2>Scan QR Code to Pay</h2>
      <QrReader
        delay={300}
        onError={handleError}
        onScan={handleScan}
        style={{ width: "100%", maxWidth: "400px" }}
      />
      <p>Scanned Result: {result}</p>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default QRScanner;