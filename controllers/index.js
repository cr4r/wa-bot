const fs = require('fs-extra');
const { phoneNumberFormatter } = require('./format-number')
const isArray = (a) => {
  return (!!a) && (a.constructor === Array);
};

const isObject = (a) => {
  return (!!a) && (a.constructor === Object);
}
const listDir = (lok = "", mode = "all") => {
  mode = mode.toLowerCase();
  let listnya = fs.readdirSync(lok, { withFileTypes: true }).filter(dirent => mode === "file" ? dirent.isFile() : mode === "folder" ? dirent.isDirectory() : dirent).map(dirent => dirent.name)
  return listnya
}

const catat = (namaFile, note) => {
  fs.appendFile(`${namaFile}`, note + '\n', function (err) {
    if (err) throw err;
  });
}

const edit_db = (namaFile, catat) => {

}

module.exports = {
  listDir,
  catat,
  isArray, isObject,
  phoneNumberFormatter,
}