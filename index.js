///// GLOBAL
global.path_cont = `${__dirname}/controllers/`
global.path_web = `${__dirname}/web/`

// BOT Wa
const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');

// Web Server
const express = require('express');
// const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const app = express();
const http = require('http');
const server = http.createServer(app);
const fs = require('fs');
const qrcode = require('qrcode');

const hostname = process.env.YOUR_HOST || '0.0.0.0';
const port = process.env.PORT || '1380';

const socketIO = require('socket.io');

const root = require(path_web + 'routes/root')

/////////// Menyiapkan status untuk bot berjalan atau tidak
const jsonDB = require('simple-json-db');
let status_bot = new jsonDB(__dirname + '/status-bot.json')
let status_bot_default = require(__dirname + '/status-bot.json')
status_bot.JSON(status_bot_default)


app.enable('trust proxy');
app.use(cookieParser())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }))
// app.use(fileUpload({ debug: true }));
app.set('view engine', 'ejs');
app.set('views', path_web + 'views')
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

// RUN BOT WHATSAPP
global.client = new Client({
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
  // authTimeoutMs: 60000,
  authStrategy: new LocalAuth({
    dataPath: "./.auth",
  }),
});
///////////////////////////////////////

global.io = socketIO(server);
// TRACKING CPU
const os = require('os');
var oldCPUTime = 0
var oldCPUIdle = 0
function getLoad() {
  var cpus = os.cpus()
  var totalTime = -oldCPUTime
  var totalIdle = -oldCPUIdle
  for (var i = 0; i < cpus.length; i++) {
    var cpu = cpus[i]
    for (var type in cpu.times) {
      totalTime += cpu.times[type];
      if (type == "idle") { totalIdle += cpu.times[type]; }
    }
  }
  var CPUload = 100 - Math.round(totalIdle / totalTime * 100)
  oldCPUTime = totalTime;
  oldCPUIdle = totalIdle
  return { CPU: CPUload, mem: 100 - Math.round(os.freemem() / os.totalmem() * 100) }
}

io.on('connection', async function (socket) {

})
//////////////////

///////// Socket IO
io.on('connection', async function (socket) {
  status_bot.set('status', 'Sedang menjalankan bot')
  status_bot.set('error', '')
  socket.emit('message', 'Sedang menjalankan Bot');
  socket.emit('.status', 'Sedang menjalankan Bot');

  //   client.on('qr', (qr) => {
  //     console.log('QR RECEIVED');
  //     status_bot.set('status_qr', 'QR telah siap, silahkan scan!')
  //     // qrcode.generate(qr, { small: true });
  //     qrcode.toDataURL(qr, (err, url) => {
  //       socket.emit('qr', url);
  //       socket.emit('message', 'QR telah siap, silahkan scan!');
  //     });
  //   });

  //   client.on('ready', () => {
  //     kata_ready = 'Bot Whatsapp telah siap!'
  //     status_bot.set('ready', true)
  //     status_bot.set('status', kata_ready)
  //     socket.emit('ready', kata_ready;
  //     socket.emit('message', kata_ready;
  //   });

  //   client.on('auth_failure', function (session) {
  //     kata_eror = 'Login gagal, restart bot dulu!'
  //     socket.emit('message', kata_eror);
  //     status_bot.set('error', {status: true, pesan: kata_eror})
  //     status_bot.set('status', kata_eror)
  //   });

  //   client.on('disconnected', (reason) => {
  //     kata_dis = 'Koneksi whatsapp terputus!'
  //     socket.emit('message',kata_dis);
  //     status_bot.set('status',kata_dis);
  /////     fs.unlinkSync(SESSION_FILE_PATH, function (err) {
  /////       if (err) return console.log(err);
  /////       console.log('Session file deleted!');
  /////     });
  //     status_bot.set('status','Mematikan bot whatsapp')
  //     client.destroy();
  //     status_bot.set('status','Memulai ulang whatsapp')
  //     client.initialize();
  //   });
  //   client.initialize();

  setInterval(() => {
    let hasil_cek = getLoad();

    let cpu_live = hasil_cek.CPU;
    let ram_live = parseInt(os.freemem() / 1024 / 1024);
    let total_ram = parseInt(os.totalmem() / 1024 / 1024);

    socket.emit('cpu-live', cpu_live + ' %');
    socket.emit('ram-live', hasil_cek.mem + ' %')
    socket.emit('total-ram', `${ram_live} mb from ${total_ram} mb`)
  }, 6)
});

app.use("/", express.static(`${path_web}/public/`));
app.use('/', root)

server.listen(port, hostname, function () {
  console.log('App running on ' + hostname + ':' + port);
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