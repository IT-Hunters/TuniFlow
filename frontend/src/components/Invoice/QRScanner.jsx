// src/components/Invoice/QRScanner.jsx
import React, { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, NotFoundException } from "@zxing/library";
import axios from "axios";

const QRScanner = ({ onScan }) => {
  const videoRef = useRef(null);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isCameraActive, setIsCameraActive] = useState(false);
  const codeReaderRef = useRef(null);

  useEffect(() => {
    codeReaderRef.current = new BrowserQRCodeReader();
    console.log("QR Code Reader initialized");

    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
        console.log("QR Code Reader reset on unmount");
      }
    };
  }, []);

  useEffect(() => {
    let stream = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log("Camera stream started");

          codeReaderRef.current.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
            if (result) {
              console.log("QR Code scanned:", result.text);
              setMessage({ text: "Invoice scanned successfully!", type: "success" });

              // Extraire l'ID de la facture depuis l'URL
              const urlParts = result.text.split("/");
              const invoiceId = urlParts[urlParts.length - 2];
              onScan(invoiceId); // Appeler la prop onScan avec l'ID

              try {
                const token = localStorage.getItem("token");
                axios
                  .put(result.text, {}, { headers: { Authorization: `Bearer ${token}` } })
                  .then(() => {
                    setMessage({ text: "Invoice accepted successfully!", type: "success" });
                    setIsCameraActive(false);
                    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
                  })
                  .catch((err) => {
                    if (err.response?.status === 400 && err.response?.data?.message === "Invoice is already paid") {
                      setMessage({ text: "This invoice is already paid.", type: "error" });
                    } else {
                      setMessage({
                        text: "Error accepting invoice: " + (err.response?.data?.message || err.message),
                        type: "error",
                      });
                    }
                  });
              } catch (err) {
                setMessage({ text: "Error accepting invoice: " + err.message, type: "error" });
              }
            }
            if (err && !(err instanceof NotFoundException)) {
              console.error("Scan error:", err);
              setMessage({ text: "Error scanning QR code: " + err.message, type: "error" });
            }
          });
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setMessage({ text: "Failed to access camera: " + err.message, type: "error" });
      }
    };

    if (isCameraActive) {
      startCamera();
    } else {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
        console.log("QR Code Reader reset");
      }
      if (videoRef.current && videoRef.current.srcObject) {
        stream = videoRef.current.srcObject;
        if (stream) {
          const tracks = stream.getTracks();
          tracks.forEach((track) => track.stop());
          console.log("Camera stream stopped");
        }
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [isCameraActive, onScan]);

  const toggleCamera = () => {
    setIsCameraActive((prev) => !prev);
    setMessage({ text: "", type: "" });
  };

  return (
    <div className="qr-scanner" style={{ padding: "20px" }}>
      <h2>Scan QR Code to Pay</h2>
      {message.text && (
        <div
          style={{
            padding: "10px",
            backgroundColor: message.type === "success" ? "#28a745" : "#dc3545",
            color: "#fff",
            borderRadius: "5px",
            marginBottom: "10px",
            textAlign: "center",
          }}
        >
          {message.text}
        </div>
      )}
      <button
        onClick={toggleCamera}
        style={{
          padding: "12px 25px",
          backgroundColor: isCameraActive ? "#dc3545" : "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          marginBottom: "10px",
          fontSize: "16px",
          transition: "background-color 0.3s ease",
        }}
      >
        {isCameraActive ? "Stop Camera" : "Start Camera"}
      </button>
      {isCameraActive && (
        <video ref={videoRef} style={{ width: "100%", maxWidth: "400px", display: "block", margin: "0 auto" }} />
      )}
      {!isCameraActive && (
        <div
          style={{
            width: "100%",
            maxWidth: "400px",
            height: "200px",
            backgroundColor: "#e0e0e0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "5px",
            margin: "0 auto 10px auto",
          }}
        >
          <p style={{ color: "#666" }}>Camera is off</p>
        </div>
      )}
    </div>
  );
};

export default QRScanner;