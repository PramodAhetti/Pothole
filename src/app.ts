import express from 'express';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/authRoutes'; 
import isAuthenticated from './middleware/isAuthenticated';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import https from 'https';
import fs from 'fs';
import axios from 'axios';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Server } from 'socket.io';

const app = express();
const port = 3000;
const prisma = new PrismaClient();
// Load SSL certificates
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
};

const server = https.createServer(options, app);
const io = new Server(server);

app.use(cors());
app.use(cookieParser());
app.use(express.static('public'));
app.use(express.json()); // To parse JSON bodies

app.use('/api', authRoutes);

app.get('/check',async (req, res) => {
  res.send('Hello, TypeScript Backend!');
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('streamVideo', (data) => {
    console.log("frames coming");

    const payload = {
      image: data.imageData
    };

    // Send the POST request to the Flask API
    const url = 'http://localhost:5000/predict'; // Update with the correct URL if needed
    axios.post(url, payload)
      .then(async (response) => {
        console.log('Predicted classes:', response.data.predicted_classes);
        if(response.data.predicted_classes.length){
          console.log("saved to database")
          await prisma.pothole.create({
            data:{
              img:data.imageData,
              severity:3,
              reportedBy:"test",
              coordinates:
                {
                  latitude: data.location.latitude,
                  longitude: data.location.longitude
                
              }
            }
          });
        } 
        console.log('Class names:', response.data.class_names);
      })
      .catch((error) => {
        console.error('Error:', error.response ? error.response.data : error.message);
      });
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on https://localhost:${port}`);
});

