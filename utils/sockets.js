const Room = require('../models/room');
const Card = require('../models/card');
const SpecialConditionCards = require('../models/specialConditionCards');
const Shelter = require('../models/shelter');
const Apocalypse = require('../models/apocalypse');
const { shuffle, sortCards } = require('./services');

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

      const specialConditionCards = await SpecialConditionCards.find({});
      shuffle(specialConditionCards[0].specialConditionCards);
      room.users.forEach((user, userIndex) => {
        room.users[userIndex].specialConditionCards.push(
          ...specialConditionCards[0].specialConditionCards.splice(0, 2)
        );

        user.cards.sort(sortCards);
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

function openSpecialExchangeCardHandler(ws, msg, aWss) {
  let firstCard = null;
  let secondCard = null;

  Room.findById(msg.id).then(async (room) => {
    room.users.forEach((user) => {
      if (user.userId === msg.user.userId) {
        user.cards.forEach((card, index) => {
          if (card.type === msg.user.card.changeType) {
            firstCard = user.cards.splice(index, 1)[0];
          }
        });
      }

      if (user.userId === msg.selectedUser.userId) {
        user.cards.forEach((card, index) => {
          if (card.type === msg.user.card.changeType) {
            secondCard = user.cards.splice(index, 1)[0];
          }
        });
      }

      if (msg.user.userId === user.userId) {
        user.specialConditionCards.forEach((card) => {
          if (String(card.id) === msg.user.card.id) {
            card.isVisible = true;
          }
        });
      }
    });

    room.users.forEach((user) => {
      if (user.userId === msg.user.userId) {
        user.cards.push(secondCard);
      }

      if (user.userId === msg.selectedUser.userId) {
        user.cards.push(firstCard);
      }

      user.cards.sort(sortCards);
    });

    await Room.findOneAndUpdate(
      { _id: msg.id },
      {
        $set: {
          users: room.users,
        },
      }
    ).clone();

    broadcastConnection(ws, msg, aWss, room);
  });
}

function openSpecialOpeningCardHandler(ws, msg, aWss) {
  Room.findById(msg.id).then(async (room) => {
    room.users.forEach((user) => {
      if (msg.user.userId === user.userId) {
        user.specialConditionCards.forEach((card) => {
          if (String(card.id) === msg.user.card.id) {
            card.isVisible = true;
          }
        });
      }

      if (msg.selectedUser.userId === user.userId) {
        user.cards.forEach((card) => {
          if (card.type === msg.user.card.changeType) {
            card.isVisible = true;
          }
        });
      }
    });

    room.users.forEach((user) => {
      user.cards.sort(sortCards);
    });

    await Room.findOneAndUpdate(
      { _id: msg.id },
      {
        $set: {
          users: room.users,
        },
      }
    ).clone();

    broadcastConnection(ws, msg, aWss, room);
  });
}

function openSpecialShuffleCardHandler(ws, msg, aWss) {
  let shuffledCards = [];
  Room.findById(msg.id).then(async (room) => {
    room.users.forEach((user) => {
      user.cards.forEach((card, index) => {
        if (card.type === msg.user.card.changeType) {
          user.cards.splice(index, 1);
          shuffledCards.push(card);
        }
      });

      if (msg.user.userId === user.userId) {
        user.specialConditionCards.forEach((card) => {
          if (String(card.id) === msg.user.card.id) {
            card.isVisible = true;
          }
        });
      }
    });

    shuffle(shuffledCards);

    room.users.forEach((user, userIndex) => {
      room.users[userIndex].cards.push(shuffledCards.shift());

      user.cards.sort(sortCards);
    });

    await Room.findOneAndUpdate(
      { _id: msg.id },
      {
        $set: {
          users: room.users,
        },
      }
    ).clone();

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
  openSpecialExchangeCardHandler,
  openSpecialOpeningCardHandler,
  openSpecialShuffleCardHandler,
};
