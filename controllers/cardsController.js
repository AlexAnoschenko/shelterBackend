const mongoose = require('mongoose');

const Room = require('../models/room');
const Card = require('../models/card');

// function randomCard(arr) {
//   let rand = Math.floor(Math.random() * arr.length);
//   return arr[rand];
// }

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

class cardsController {
  async getCards(req, res) {
    try {
      const room = await Room.findOne({
        _id: req.body.params.id,
      });

      const cards = await Card.find({});

      room.users.forEach((user, userIndex) => {
        cards[0].cards.forEach((type, cardsIndex) => {
          for (let key in type) {
            shuffle(type[key]);
            room.users[userIndex].cards.push(type[key].shift());
          }
        });
      });

      await Room.findOneAndUpdate(
        { _id: req.body.params.id },
        {
          $set: {
            users: room.users,
          },
        },
        () => {
          return room;
          //   res.json(room);
        }
      );
    } catch (e) {}
  }
}

module.exports = new cardsController();
