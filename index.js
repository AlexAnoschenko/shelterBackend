const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

const app = express();
const WSServer = require('express-ws')(app);
const aWss = WSServer.getWss();
const roomsRouters = require('./routers/roomsRouter');
const cardsRouters = require('./routers/cardsRouter');
const Room = require('./models/room');
const Card = require('./models/card');
const {
  connectionHandler,
  addUserHandler,
  openCardHandler,
} = require('./utils/sockets');

dotenv.config();

const PORT = process.env.PORT || 5001;

app.ws('/', (ws, req) => {
  console.log('--- BACK WEBSOCKET CONNECTED ---');

  ws.on('message', (msg) => {
    msg = JSON.parse(msg);

    switch (msg.method) {
      case 'connection':
        connectionHandler(ws, msg, aWss);
        break;

      case 'addUser':
        addUserHandler(ws, msg, aWss);
        break;

      case 'openCard':
        openCardHandler(ws, msg, aWss);
        break;
    }
  });
});

app.use(cors());
app.use(express.json());
app.use('/rooms', roomsRouters);
app.use('/cards', cardsRouters);

const start = async () => {
  try {
    await mongoose.connect(
      'mongodb+srv://Elegantny:4593307899Alex@cluster0.i9e2d.mongodb.net/dbShelter?retryWrites=true&w=majority'
    );

    console.log('--- Connected DB ---');

    app.listen(PORT, () =>
      console.log(`--- Server has been started on port --- ${PORT}`)
    );
  } catch (e) {
    console.log(e);
  }
};

start();
