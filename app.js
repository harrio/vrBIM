var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var watchr = require('watchr');
var ifcConvert = require('ifc-convert');
var multer = require('multer');
var bodyParser = require('body-parser');
var fs = require('fs');

var PythonShell = require('python-shell');

var app = express();

var nameMap = {};
var PORT = 3000;


app.use(bodyParser.json());
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules')));
app.use(express.static(path.join(__dirname, 'models')));

app.get('/', (req, res, next) => {
  fs.readdir('./models', (err, items) => {
    console.log(items);
    var models = items.filter((item) => { return item.indexOf('.js') > 0});
    res.render('models.jade', {'mode': req.query.start_mode});
  });
});

app.get('/list-models', (req, res, next) => {
  fs.readdir('./models', (err, items) => {
    console.log(items);
    var models = items.filter((item) => { return item.indexOf('.js') > 0});
    res.json({'models': models});
  });
})

// catch 404 and forward to error handler
app.use((req, res, next) => {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

var convertObjToJson = (srcPath, originalName) => {
  var options = {
    mode: 'text',
    args: ['-i', srcPath, '-o', "models/" + originalName + '.js']
  };

  PythonShell.run('convert_obj_three.py', options, function (err, results) {
    if (err) throw err;
    fs.unlink(srcPath, () => { console.log("OBJ file deleted.")})
    fs.unlink("models/" + originalName + '.mtl', () => { console.log("MTL file deleted.")})
    // results is an array consisting of messages collected during execution
    console.log('results: %j', results);
  });
}

var convertIfc = (path) => {
  var filename = path.replace(/^.*[\\\/]/, '');
  var originalName = nameMap[filename];
  console.log("CONVERT " + path + " -> " + originalName);
  var objPath = './models/' + originalName + '.obj';
  ifcConvert(path, objPath, {path: '.'})
   .then(() => {
     convertObjToJson(objPath, originalName);
  })
  .catch((e) => { console.log("IFC conversion failed", e) });
}

var fileListener = (changeType, fullPath, currentStat, previousStat) => {
  switch (changeType) {
    case 'create':
      console.log("CREATED " + fullPath);
      convertIfc(fullPath);
      break;
    }
}
var path = './ifc';
var next = (err) => {
  if (err) return console.log('watch failed on', path, 'with error', err);
  console.log('watch successful on', path);
}

var stalker = watchr.open(path, fileListener, next);

var port = process.argv[2];
port = port ? port : PORT;

app.listen(port, () => {
  console.log('Example app listening on port '+port+'!');
});

module.exports = app;
