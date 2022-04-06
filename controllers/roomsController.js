const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const Room = require('../models/room');

class roomsController {
  async createRoom(req, res) {
    try {
      const { nickname, numberOfPlayers } = req.body;

      const room = new Room({
        users: [
          {
            userId: uuidv4(),
            role: 'admin',
            nickname: nickname,
            cards: [],
          },
        ],
        shelter: null,
        apocalypse: null,
        numberOfPlayers: numberOfPlayers,
      });

      await room.save();

      res.json({
        roomId: room._id,
        user: {
          userId: room.users[0].userId,
          role: room.users[0].role,
          nickname: nickname,
          cards: [],
        },
        shelter: null,
        apocalypse: null,
        numberOfPlayers: numberOfPlayers,
      });
    } catch (e) {
      res.status(400).json({ message: 'Creating room error' });
    }
  }

  async createUser(req, res) {
    try {
      const { nickname, id } = req.body;

      const userId = uuidv4();

      await Room.findOneAndUpdate(
        { id },
        {
          $push: {
            users: {
              userId: userId,
              role: 'player',
              nickname: nickname,
              cards: [],
            },
          },
        },
        () => {
          res.json({
            roomId: id,
            user: {
              userId: userId,
              role: 'player',
              nickname: nickname,
              cards: [],
            },
          });
        }
      );
    } catch (e) {}
  }

  async getRoom(req, res) {
    try {
      await Room.findById(req.query.id, (err, doc) => {
        res.json(doc);
      });
    } catch (e) {}
  }

  async clearRoom(req, res) {
    try {
      await Room.deleteMany({}, () => {
        console.log('clear');
      });
    } catch (e) {}
  }
}

module.exports = new roomsController();
