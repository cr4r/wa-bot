const express = require('express')
const router = express.Router()
const { body, validationResult } = require('express-validator');
const { phoneNumberFormatter } = require('../helpers/formatter');
const axios = require('axios');

const checkRegisteredNumber = async function (number) {
  const isRegistered = await client.isRegisteredUser(number);
  return isRegistered;
}

router.get('/', (req, res) => {
  res.sendFile('index.html', {
    root: __dirname
  });
});

// Send message
router.post('/send-message', [
  body('tokenapi').notEmpty(),
  body('namapil').notEmpty(),
  body('number').notEmpty(),
  body('nama').notEmpty(),
  body('token').notEmpty(),
  body('url').notEmpty(),
  // body('message').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const number = phoneNumberFormatter(req.body.number);
  const tokenapi = req.body.tokenapi;
  // const message = req.body.message;
  const message = 'Halo ' + req.body.nama + ', Data anda terkait E-Voting ' + req.body.namapil + ' sudah terverifikasi. \n\nSilahkan login menggunakan Identitas (NIM/NIP/NIDN) dan TOKEN yang anda dapatkan. \nToken anda adalah: ' + req.body.token + '\nHalaman Login: ' + req.body.url + '\n\nHubungi https://wa.me/6282260879023 jika mengalami kendala(Via Whatsapp). \nTerima Kasih, Selamat Memilih!';

  if (tokenapi != '$2y$10$DW9iRCyU1Urj5nOI6Dp4he8lISFk2cItJgCIrnkbzCxmZeo8Ca4ya') {
    return res.status(422).json({
      status: false,
      message: 'Token Missmatch!'
    });
  }
  const isRegisteredNumber = await checkRegisteredNumber(number);


  if (!isRegisteredNumber) {
    return res.status(422).json({
      status: false,
      message: 'The number is not registered'
    });
  }

  client.sendMessage(number, message).then(response => {
    res.status(200).json({
      status: true,
      response: response
    });
  }).catch(err => {
    res.status(500).json({
      status: false,
      response: err
    });
  });
});

// Send media
router.post('/send-media', async (req, res) => {
  const number = phoneNumberFormatter(req.body.number);
  const caption = req.body.caption;
  const fileUrl = req.body.file;

  // const media = MessageMedia.fromFilePath('./image-example.png');
  // const file = req.files.file;
  // const media = new MessageMedia(file.mimetype, file.data.toString('base64'), file.name);
  let mimetype;
  const attachment = await axios.get(fileUrl, {
    responseType: 'arraybuffer'
  }).then(response => {
    mimetype = response.headers['content-type'];
    return response.data.toString('base64');
  });

  const media = new MessageMedia(mimetype, attachment, 'Media');

  client.sendMessage(number, media, {
    caption: caption
  }).then(response => {
    res.status(200).json({
      status: true,
      response: response
    });
  }).catch(err => {
    res.status(500).json({
      status: false,
      response: err
    });
  });
});

const findGroupByName = async function (name) {
  const group = await client.getChats().then(chats => {
    return chats.find(chat =>
      chat.isGroup && chat.name.toLowerCase() == name.toLowerCase()
    );
  });
  return group;
}

// Send message to group
// You can use chatID or group name, yea!
router.post('/send-group-message', [
  body('id').custom((value, { req }) => {
    if (!value && !req.body.name) {
      throw new Error('Invalid value, you can use `id` or `name`');
    }
    return true;
  }),
  body('message').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  let chatId = req.body.id;
  const groupName = req.body.name;
  const message = req.body.message;

  // Find the group by name
  if (!chatId) {
    const group = await findGroupByName(groupName);
    if (!group) {
      return res.status(422).json({
        status: false,
        message: 'No group found with name: ' + groupName
      });
    }
    chatId = group.id._serialized;
  }

  client.sendMessage(chatId, message).then(response => {
    res.status(200).json({
      status: true,
      response: response
    });
  }).catch(err => {
    res.status(500).json({
      status: false,
      response: err
    });
  });
});

module.exports = router