const replaceStream = require('replacestream');
const fs = require('fs');
const async = require('async');
const path = require('path');
const rgb2cmyk = require('./rgb2cmyk.json');
const dir = __dirname + '/files';
const commandLineArgs = require('command-line-args');
const optionDefinitions = [
  { name: 'files', alias: 'f', multiple: true, type: String }
];
const options = commandLineArgs(optionDefinitions);

var objs = [{name:'A'}, {name:'B'}, {name:'C'}];

function convert2cmyk(file, cb) {
  var writableStream = fs.createWriteStream(path.join(dir, file + '_cmyk.ps'));
  var originData = fs.readFileSync(path.join(dir, file + '.ps')).toString().split("\n");
  originData.splice(63, 0, "/cmy { setcmykcolor } bind def");
  var text = originData.join("\n");
  fs.writeFile(path.join(dir, file + '.ps'), text, function (err) {
    if (err) return console.log(err);
  });
  // console.log(path.join(dir, '1015.ps'));
  fs.createReadStream(path.join(dir, file + '.ps'))
  .pipe(replaceStream(/(\d+(\.\d+)?\s){3}rg/g, replaceFn))
  .pipe(replaceStream(/1 g/g, replaceFn))
  // .pipe(process.stdout)
  .pipe(writableStream);
  // console.log("我在做" + obj + "这件事!");
  cb(null, file);
}

async.eachSeries(options.files, function(file, callback) {
  async.setImmediate(function() {
    convert2cmyk(file, function() {
      callback();
    });
  });
}, function(err){
    // console.log("err is:" + err);
});


// for (var i = 0; i < options.files.length; i++) {
//   var writableStream = fs.createWriteStream(path.join(dir, options.files[i] + '_cmyk.ps'));
//   var originData = fs.readFileSync(path.join(dir, options.files[i] + '.ps')).toString().split("\n");
//   originData.splice(63, 0, "/cmy { setcmykcolor } bind def");
//   var text = originData.join("\n");
//   fs.writeFile(path.join(dir, options.files[i] + '.ps'), text, function (err) {
//     if (err) return console.log(err);
//   });
//   // console.log(path.join(dir, '1015.ps'));
//   fs.createReadStream(path.join(dir, options.files[i] + '.ps'))
//   .pipe(replaceStream(/(\d+(\.\d+)?\s){3}rg/g, replaceFn))
//   .pipe(replaceStream(/1 g/g, replaceFn))
//   // .pipe(process.stdout)
//   .pipe(writableStream);
// }

function replaceFn(match) {
  // todo calculate #hex color code
  var splitRGB = match.split(' ');
  var cmykCode = '';
  var popRGB = splitRGB.pop();
  if (popRGB == 'g') {
    splitRGB.push(splitRGB[0]);
    splitRGB.push(splitRGB[0]);
  }
  // console.log(splitRGB);
  var hexCode = '#';
  for (var i = 0; i < splitRGB.length; i++) {
    var hexNum = parseFloat(splitRGB[i]) * 255;
    hexNum = Math.round(hexNum);
    hexNum = hexNum.toString(16);
    hexNum = padLeft(hexNum, 2);
    hexCode += hexNum;
  }
  // console.log(hexCode);
  // todo get cmyk code
  for (var j = 0; j < rgb2cmyk.length; j++) {
    if (rgb2cmyk[j][hexCode]) {
      cmykCode = rgb2cmyk[j][hexCode]['mappedCMYK'] + ' cmy';
    }
  }

  // console.log(cmykCode);
  return cmykCode;
}

function padLeft(str,lenght) {
  if (str.length >= lenght) {
    return str;
  }
  else {
    return padLeft("0" +str,lenght);
  }
}
