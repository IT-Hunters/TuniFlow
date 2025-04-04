// src/components/Invoice/QRScanner.jsx
import React, { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, NotFoundException } from "@zxing/library";
import axios from "axios";

const QRScanner = () => {
  const videoRef = useRef(null);
  const [result, setResult] = useState(""); // Message de résultat
  const [error, setError] = useState(""); // Message d'erreur
  const [successMessage, setSuccessMessage] = useState(""); // Message de succès
  const [isCameraActive, setIsCameraActive] = useState(false); // État pour activer/désactiver la caméra
  const codeReaderRef = useRef(null); // Référence pour le lecteur QR

  useEffect(() => {
    // Initialiser le lecteur QR
    codeReaderRef.current = new BrowserQRCodeReader();

    // Nettoyer lors du démontage du composant
    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, []);

  useEffect(() => {
    let stream;
    if (isCameraActive) {
      // Démarrer la caméra avec un callback
      codeReaderRef.current.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
        if (result) {
          setResult("Invoice scanned successfully!"); // Message convivial
          try {
            const token = localStorage.getItem("token");
            axios
              .put(result.getText(), {}, { headers: { Authorization: `Bearer ${token}` } }) // Utiliser getText() pour l'URL
              .then(() => {
                setSuccessMessage("Invoice accepted successfully!");
                setIsCameraActive(false); // Arrêter la caméra après un scan réussi
                setTimeout(() => setSuccessMessage(""), 3000); // Réinitialiser après 3 secondes
              })
              .catch((err) => {
                if (err.response?.status === 400 && err.response?.data?.message === "Invoice is already paid") {
                  setError("This invoice is already paid.");
                } else {
                  setError("Error accepting invoice: " + (err.response?.data?.message || err.message));
                }
              });
          } catch (err) {
            setError("Error accepting invoice: " + err.message);
          }
        }
        if (err && !(err instanceof NotFoundException)) {
          setError("Error scanning QR code: " + err.message);
        }
      });
    } else {
      // Arrêter la caméra si désactivée
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
      if (videoRef.current && videoRef.current.srcObject) {
        stream = videoRef.current.srcObject;
        if (stream) {
          const tracks = stream.getTracks();
          tracks.forEach((track) => track.stop());
        }
        videoRef.current.srcObject = null;
      }
    }

    // Nettoyer lors du changement d'état ou démontage
    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [isCameraActive]);

  const toggleCamera = () => {
    setIsCameraActive((prev) => !prev);
    // Réinitialiser les messages lors du toggle
    setResult("");
    setError("");
    setSuccessMessage("");
  };

  return (
    <div className="qr-scanner" style={{ padding: "20px" }}>
      <h2>Scan QR Code to Pay</h2>
      {successMessage && (
        <div
          style={{
            padding: "10px",
            backgroundColor: "#4caf50",
            color: "#fff",
            borderRadius: "5px",
            marginBottom: "10px",
            textAlign: "center",
          }}
        >
          {successMessage}
        </div>
      )}
      <button
        onClick={toggleCamera}
        style={{
          padding: "10px 20px",
          backgroundColor: isCameraActive ? "#f44336" : "#4caf50",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          marginBottom: "10px",
        }}
      >
        {isCameraActive ? "Stop Camera" : "Start Camera"}
      </button>
      {isCameraActive && (
        <video ref={videoRef} style={{ width: "100%", maxWidth: "400px", display: "block" }} />
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
            marginBottom: "10px",
          }}
        >
          <p style={{ color: "#666" }}>Camera is off</p>
        </div>
      )}
      {result && (
        <p style={{ color: "#333", marginTop: "10px" }}>
          {result}
        </p>
      )}
      {error && (
        <p style={{ color: "red", marginTop: "10px" }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default QRScanner;