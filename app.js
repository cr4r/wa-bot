const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fs = require('fs');
// Web Server
const express = require('express');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const hostname = process.env.YOUR_HOST || '0.0.0.0';
const port = process.env.PORT || '1380';
// const hostname = 'api.evoting.ft.uts.ac.id' || '127.0.0.1';

const root = require('./routes/root')

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.enable('trust proxy');
app.use(cookieParser())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }))
app.use(fileUpload({ debug: true }));
app.set('view engine', 'ejs');

app.use((req, res, next) => {
  // if (req.protocol === 'https') return res.redirect('http://' + req.hostname + req.url);
  res.header({
    'Access-Control-Allow-Origin': `*`,
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
    'Strict-Transport-Security': 'max-age=15552000; includeSubDomains',
    'X-XSS-Protection': '1;mode=block',
    'X-Content-Type-Options': 'nosniff',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'X-DNS-Prefetch-Control': 'on',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': 'frame-ancestors \'none\'',
    'x-powered-by': 'Coders Family - 2019',
  });
  // res.set('Cache-Control', 'public, max-age=31557600');
  next()
})

const client = new Client({
  restartOnAuthFail: true,
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      // '--single-process', // <- this one doesn't works in Windows
      '--disable-gpu',
      "--aggressive-cache-discard",
      "--disable-cache",
      "--disable-application-cache",
      "--disable-offline-load-stale-cache",
      "--disk-cache-size=0"
    ],
  },
  authTimeoutMs: 60000,
  authStrategy: new LocalAuth({
    dataPath: "./.auth",
  }),
});

client.on('message', msg => {
  if (msg.body == '!ping') {
    msg.reply('pong');
  } else if (msg.body == 'good morning') {
    msg.reply('selamat pagi');
  }
  // else if (msg.body == '!groups') {
  //   client.getChats().then(chats => {
  //     const groups = chats.filter(chat => chat.isGroup);

  //     if (groups.length == 0) {
  //       msg.reply('You have no group yet.');
  //     } else {
  //       let replyMsg = '*YOUR GROUPS*\n\n';
  //       groups.forEach((group, i) => {
  //         replyMsg += `ID: ${group.id._serialized}\nName: ${group.name}\n\n`;
  //       });
  //       replyMsg += '_You can use the group id to send a message to the group._'
  //       msg.reply(replyMsg);
  //     }
  //   });
  // }
});

client.initialize();

// Socket IO
io.on('connection', function (socket) {
  socket.emit('message', 'Connecting...');

  client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit('qr', url);
      socket.emit('message', 'QR Code received, scan please!');
    });
  });

  client.on('ready', () => {
    socket.emit('ready', 'Whatsapp is ready!');
    socket.emit('message', 'Whatsapp is ready!');
  });

  client.on('auth_failure', function (session) {
    socket.emit('message', 'Auth failure, restarting...');
  });

  client.on('disconnected', (reason) => {
    socket.emit('message', 'Whatsapp is disconnected!');
    fs.unlinkSync(SESSION_FILE_PATH, function (err) {
      if (err) return console.log(err);
      console.log('Session file deleted!');
    });
    client.destroy();
    client.initialize();
  });
});

app.use("/", express.static(`${__dirname}/public/`));
app.use('/', root)

server.listen(port, hostname, function () {
  console.log('App running on ' + hostname + ':' + port);
});
