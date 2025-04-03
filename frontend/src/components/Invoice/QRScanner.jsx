// src/components/Invoice/QRScanner.jsx
import React, { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader } from "@zxing/library";
import axios from "axios";

const QRScanner = () => {
  const videoRef = useRef(null);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const codeReader = new BrowserQRCodeReader();
    codeReader.decodeFromVideoDevice(null, videoRef.current, async (result, err) => {
      if (result) {
        setResult(result.text);
        try {
          const token = localStorage.getItem("token");
          await axios.put(result.text, {}, { headers: { Authorization: `Bearer ${token}` } });
          alert("Invoice accepted successfully!");
        } catch (err) {
          setError("Error accepting invoice: " + (err.response?.data?.message || err.message));
        }
      }
      if (err && !(err instanceof NotFoundException)) {
        setError("Error scanning QR code: " + err.message);
      }
    });

    return () => codeReader.reset(); // Nettoyer lors du démontage
  }, []);

  return (
    <div className="qr-scanner" style={{ padding: "20px" }}>
      <h2>Scan QR Code to Pay</h2>
      <video ref={videoRef} style={{ width: "100%", maxWidth: "400px" }} />
      <p>Scanned Result: {result}</p>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default QRScanner;