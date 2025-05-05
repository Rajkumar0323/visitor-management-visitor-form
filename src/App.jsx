import React, { useState, useRef, useEffect, useMemo } from "react";
import Webcam from "react-webcam";
import "./App.css";
import { io } from "socket.io-client";
import axios from "axios";
function App() {
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [reason, setReason] = useState("");
  const [cameraPermission, setCameraPermission] = useState(false);
  const [socketID, setSocketID] = useState("");
  const [message, setMessage] = useState("");
  const [ownerId, setOwnerId] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const socket = useMemo(
    () => io("https://chat-backend-jqfr.onrender.com"),
    []
  );
  // const socket = useMemo(() => io("http://localhost:5000"), []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const owner = params.get("ownerId");
    if (owner) {
      setOwnerId(owner);
      console.log("Owner Id----", owner);
    }

    socket.on("visitorResponse", (data) => {
      if (data.status === "accepted") {
        console.log("Owner: Wait, I'm coming!");

        setMessage("Owner: Wait, I'm coming!");
      } else {
        console.log("Owner: Sorry, request rejected.");

        setMessage("Owner: Sorry, request rejected.");
      }
    });
  }, []);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(() => setCameraPermission(true))
      .catch(() => setCameraPermission(false));
  }, []);

  const captureImage = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
  };

  // const handleSubmit = () => {
  //   if (!capturedImage || !reason) {
  //     alert("Please capture an image and enter a reason.");
  //     return;
  //   }

  //   socket.emit("visitor-data", {
  //     senderId: socketID,
  //     image: capturedImage,
  //     reason,
  //   });

  //   alert("Details submitted successfully!");
  //   setCapturedImage(null);
  //   setReason("");
  // };
  const handleSubmit = async () => {
    if (!capturedImage || !reason) {
      alert("Please provide an image and reason.");
      return;
    }
    console.log("image : ", capturedImage);

    const visitorData = { ownerId, reason, capturedImage };
    try {
      const res = await axios.post(
        "https://chat-backend-jqfr.onrender.com/api/visitor-entry",
        visitorData
      );

      socket.emit("visitorRequest", { data: visitorData, socketId: socket.id });
      setSubmitted(true);
    } catch (err) {
      alert("Failed to submit visitor details.");
    }
  };

  return (
    <div className="container">
      <h2>Capture Your Selfie</h2>

      {!submitted ? (
        <>
          {cameraPermission ? (
            <>
              {!capturedImage ? (
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="webcam"
                />
              ) : (
                <img
                  src={capturedImage}
                  alt="Captured Selfie"
                  className="captured-image"
                />
              )}
              <button
                onClick={
                  capturedImage ? () => setCapturedImage(null) : captureImage
                }
              >
                {capturedImage ? "Retake" : "Capture Image"}
              </button>
              <div className="input-container">
                <label>Reason:</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason"
                />
              </div>
              {/* <div className="input-container">
                <label>Socket Id:</label>
                <input
                  type="text"
                  value={socketID}
                  onChange={(e) => setSocketID(e.target.value)}
                  placeholder="Enter socket id"
                />
              </div> */}
              <button onClick={handleSubmit}>Call</button>
            </>
          ) : (
            <p>Camera access is required to capture your selfie.</p>
          )}
        </>
      ) : (
        <h3 className="response-msg">
          {message || "Waiting for owner response..."}
        </h3>
      )}
    </div>
  );
}

export default App;
