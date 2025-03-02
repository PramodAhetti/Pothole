<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Real-Time Video Streaming</title>
  <link rel="stylesheet" href="/style.css">
  <style>
    body {
      font-family: Arial, sans-serif;
      text-align: center;
      background-color: #f4f4f4;
      padding: 20px;
    }

    h1 { color: #333; }

    #video-container {
      position: relative;
      display: inline-block;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
    }

    video {
      border-radius: 10px;
      border: 3px solid #333;
    }

    #startStream {
      margin-top: 10px;
      padding: 10px 20px;
      font-size: 16px;
      border: none;
      border-radius: 5px;
      background-color: #007BFF;
      color: white;
      cursor: pointer;
      transition: background 0.3s;
    }

    #startStream:hover {
      background-color: #0056b3;
    }

    #status {
      margin-top: 15px;
      font-size: 18px;
      color: #555;
    }

    /* Flash effect when capturing a frame */
    .flash {
      animation: flashEffect 0.2s ease-out;
    }

    @keyframes flashEffect {
      0% { opacity: 0.5; }
      100% { opacity: 1; }
    }
  </style>
</head>
<body>

  <h1>Real-Time Webcam Streaming</h1>
  <div id="video-container">
    <video id="liveVideo" width="640" height="360" autoplay></video>
  </div>
  <br>
  <button id="startStream">Start Stream</button>
  <p id="status">Waiting to start...</p>

  <script src="/socket.io/socket.io.js"></script>
  <script>
    document.getElementById('startStream').addEventListener('click', () => {
      const liveVideo = document.getElementById('liveVideo');
      const statusText = document.getElementById('status');
      const socket = io();
      
      const constraints = { video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 360 } } };

      navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
          console.log('Webcam stream started');
          liveVideo.srcObject = stream;

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 640; // Reduce resolution
          canvas.height = 360;

          const captureFrame = () => {
            console.log('Capturing frame...');
            statusText.innerText = "📸 Capturing frame...";

            ctx.drawImage(liveVideo, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.6); // Reduce quality

            getLocation((location) => {
              console.log('Sending frame and location to server');
              statusText.innerText = "📤 Sending frame...";
              liveVideo.classList.add('flash');

              socket.emit('streamVideo', { imageData: dataUrl.split(',')[1], location });

              setTimeout(() => {
                statusText.innerText = "✅ Frame sent!";
                liveVideo.classList.remove('flash');
              }, 800);
            });
          };

          const frameInterval = setInterval(captureFrame, 5000); // Reduce interval to 5s

          socket.on('disconnect', () => {
            console.log('Disconnected from server');
            clearInterval(frameInterval);
            statusText.innerText = "🔴 Disconnected!";
          });

        })
        .catch((error) => {
          console.error('Error accessing webcam:', error);
          statusText.innerText = "⚠️ Webcam access denied!";
        });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        statusText.innerText = "⚠️ Server connection error!";
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
        statusText.innerText = "⚠️ Streaming error!";
      });
    });

    // Get geolocation using async function to prevent blocking
    function getLocation(callback) {
      navigator.geolocation.getCurrentPosition((position) => {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp
        });
      }, (error) => {
        console.error('Error getting location:', error);
        callback(null);
      }, { timeout: 5000 }); // Set timeout to avoid delays
    }
  </script>
</body>
</html>
