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
    broadcastConnection(ws, msg, aWss, { room: room });
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

    broadcastConnection(ws, msg, aWss, {
      room: room,
      method: 'snackbar',
      snackbar: `${
        msg.user.nickname
      } opened his ${msg.user.card.type.toUpperCase()}!`,
    });
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

    broadcastConnection(ws, msg, aWss, {
      room: room,
      method: 'snackbar',
      snackbar: `${
        msg.user.nickname
      } exchanged ${msg.user.card.changeType.toUpperCase()} with ${
        msg.selectedUser.nickname
      }!`,
    });
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

    broadcastConnection(ws, msg, aWss, {
      room: room,
      method: 'snackbar',
      snackbar: `${msg.user.nickname} opened ${
        msg.selectedUser.nickname
      }'s ${msg.user.card.changeType.toUpperCase()}!`,
    });
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

    broadcastConnection(ws, msg, aWss, {
      room: room,
      method: 'snackbar',
      snackbar: `${
        msg.user.nickname
      } shuffled all ${msg.user.card.changeType.toUpperCase()}!`,
    });
  });
}

function openVotingModalAllHandler(ws, msg, aWss) {
  Room.findById(msg.id).then(async (room) => {
    room.isDraw = false;
    room.users.forEach((user) => {
      user.votes = 0;
      user.isVoted = false;
    });

    await Room.findOneAndUpdate(
      { _id: msg.id },
      {
        $set: {
          users: room.users,
          isDraw: false,
        },
      }
    ).clone();

    broadcastConnection(ws, msg, aWss, {
      room: room,
      method: 'openVotingModalAll',
    });
  });
}

function votePlayerHandler(ws, msg, aWss) {
  Room.findById(msg.id).then(async (room) => {
    room.users.forEach((user) => {
      if (user.userId === msg.selectedUser.userId) {
        user.votes += 1;
      }

      if (user.userId === msg.player.userId) {
        user.isVoted = true;
      }
    });

    await Room.findOneAndUpdate(
      { _id: msg.id },
      {
        $set: {
          users: room.users,
        },
      }
    ).clone();

    broadcastConnection(ws, msg, aWss, {
      room: room,
    });
  });
}

function getVotingResultHandler(ws, msg, aWss) {
  let kickedOutPlayers = 0;
  let kickedOutPlayer = null;
  let maxVotes = 0;
  let drawPlayers = 0;
  const result = [];

  Room.findById(msg.id).then(async (room) => {
    room.users.forEach((user) => {
      if (user.votes >= maxVotes) {
        maxVotes = user.votes;
        result.push(user);
      }
    });

    let filteredResult = result.filter((user) => user.votes === maxVotes);

    if (filteredResult.length > 1) {
      room.isDraw = true;
      room.drawPlayers = filteredResult;
      room.users.forEach((user) => {
        user.votes = 0;
        user.isVoted = false;
      });

      await Room.findOneAndUpdate(
        { _id: msg.id },
        {
          $set: {
            users: room.users,
            isDraw: true,
            drawPlayers: filteredResult,
          },
        }
      ).clone();

      broadcastConnection(ws, msg, aWss, {
        room: room,
        drawPlayers: drawPlayers,
        method: 'draw',
      });
    } else {
      room.users.forEach((user) => {
        if (user.userId === filteredResult[0].userId) {
          user.isKickedOut = true;
          kickedOutPlayer = filteredResult[0].nickname;
        }

        if (user.isKickedOut) {
          kickedOutPlayers += 1;
        }
      });

      if (Math.ceil(room.numberOfPlayers / 2) === kickedOutPlayers) {
        await Room.findOneAndUpdate(
          { _id: msg.id },
          {
            $set: {
              users: room.users,
              isEndGame: true,
            },
          }
        ).clone();

        broadcastConnection(ws, msg, aWss, {
          room: room,
          kickedOutPlayer: kickedOutPlayer,
          method: 'endGame',
        });
      } else {
        await Room.findOneAndUpdate(
          { _id: msg.id },
          {
            $set: {
              users: room.users,
            },
          }
        ).clone();

        broadcastConnection(ws, msg, aWss, {
          room: room,
          kickedOutPlayer: kickedOutPlayer,
          method: 'getVotingResult',
        });
      }
    }
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
  openVotingModalAllHandler,
  votePlayerHandler,
  getVotingResultHandler,
};
