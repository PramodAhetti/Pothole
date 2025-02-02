

const express = require('express');
const https = require('https');
const fs = require('fs');
const axios=require('axios')
const path = require('path');
const { v4: uuidv4 } = require('uuid');  // Import UUID library for unique ID generation
const app = express();


// Load SSL certificates
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
};

const server = https.createServer(options,app);
const io = require('socket.io')(server);
// Create a folder to store the images and location data (if they don't already exist)
const imagesDir = './frames';
const locationDir = './locations';
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}
if (!fs.existsSync(locationDir)) {
  fs.mkdirSync(locationDir);
}

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('streamVideo', (data) => {
    // Generate a unique identifier for each frame
    const uniqueId = uuidv4();  // Using UUID for unique ID

    // Filenames for the image and location data based on the unique ID
    const imageFilename = `frame-${uniqueId}.jpg`;
    const locationFilename = `frame-${uniqueId}.json`;

    const imageFilePath = path.join(imagesDir, imageFilename);
    const locationFilePath = path.join(locationDir, locationFilename);

    console.log("frames coming")
    const payload = {
      image: data.imageData
  };

  // Send the POST request to the Flask API
  const url = 'http://192.168.1.6:5000/predict'; // Update with the correct URL if needed
  axios.post(url, payload)
      .then((response) => {
          console.log('Predicted classes:', response.data.predicted_classes);
          console.log('Class names:', response.data.class_names);
      })
      .catch((error) => {
          console.error('Error:', error.response ? error.response.data : error.message);
      });
    // Save the image
    if (data.imageData) {
      const buffer = Buffer.from(data.imageData, 'base64');
      
      fs.writeFile(imageFilePath, buffer, (err) => {
        if (err) {
          console.error('Error saving the image:', err);
        } else {
          console.log('Frame saved as:', imageFilename);
        }
      });
    }

    // Save the location data with the same unique identifier
    if (data.location) {
      const locationData = {
        id: uniqueId,  // Add the unique ID to the location data
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        timestamp: data.location.timestamp,
      };

      fs.writeFile(locationFilePath, JSON.stringify(locationData, null, 2), (err) => {
        if (err) {
          console.error('Error saving location data:', err);
        } else {
          console.log('Location data saved as:', locationFilename);
        }
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

server.listen(3000,'0.0.0.0', () => {
  console.log('Server is running on http://localhost:3000');
});
