const Room = require('../models/room');
const Card = require('../models/card');
const Shelter = require('../models/shelter');
const Apocalypse = require('../models/apocalypse');
const { shuffle } = require('./services');

function connectionHandler(ws, msg, aWss) {
  broadcastConnection(ws, msg, aWss, `user ${msg.nickname} connected`);
}

function addUserHandler(ws, msg, aWss) {
  Room.findById(msg.id).then(async (room) => {
    room.users.push(msg.user);
    room.save();
    if (room.users.length === room.numberOfPlayers) {
      const cards = await Card.find({});
      room.users.forEach((user, userIndex) => {
        cards[0].cards.forEach((type, cardsIndex) => {
          for (let key in type) {
            shuffle(type[key]);
            room.users[userIndex].cards.push(type[key].shift());
          }
        });
      });

      const shelters = await Shelter.find({});
      shuffle(shelters);
      shelters[0].capacity = Math.floor(room.users.length / 2);

      const apocalypses = await Apocalypse.find({});
      shuffle(apocalypses);

      await Room.findOneAndUpdate(
        { _id: msg.id },
        {
          $set: {
            users: room.users,
            shelter: shelters[0],
            apocalypse: apocalypses[0],
          },
        }
      ).clone();
    }
    broadcastConnection(ws, msg, aWss, room);
  });
}

function openCardHandler(ws, msg, aWss) {
  Room.findById(msg.id).then(async (room) => {
    room.users.forEach((user) => {
      if (msg.user.userId === user.userId) {
        user.cards.forEach(async (card) => {
          if (String(card.id) === msg.user.card.id) {
            card.isVisible = true;
            await Room.findOneAndUpdate(
              { _id: msg.id },
              {
                $set: {
                  users: room.users,
                },
              }
            ).clone();
          }
        });
      }
    });
    broadcastConnection(ws, msg, aWss, room);
  });
}

const broadcastConnection = (ws, msg, aWss, response) => {
  ws.id = msg.id;
  aWss.clients.forEach((client) => {
    if (client.id === msg.id) {
      client.send(JSON.stringify(response));
    }
  });
};

module.exports = {
  connectionHandler,
  addUserHandler,
  openCardHandler,
};
