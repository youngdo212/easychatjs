const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const session = require('express-session');
const mongoose = require('mongoose');
const io = require('socket.io')();

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const projectsRouter = require('./routes/projects');
const usersRouter = require('./routes/users');
const friendrequestsRouter = require('./routes/friendrequests');
const roomsRouter = require('./routes/rooms');

const app = express();

// mongoose setup
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', console.log.bind(console, 'mongoose is connected!'));
mongoose.connect('mongodb://localhost:27017/messengerdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// express-session setup
const sess = {
  secret: 'mandosecret',
  resave: true,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: false, // change to true, if using https
  },
};

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  sess.cookie.secure = true;
  sess.cookie.sameSite = 'none';
}

const sessionMiddleware = session(sess);
app.use(sessionMiddleware);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:8080'
        : 'https://youngdocheon.com',
    credentials: true,
  })
);

// socket.io setup
app.io = io;
app.use((req, res, next) => {
  req.io = io;
  next();
});
io.use((socket, next) => {
  sessionMiddleware(socket.request, socket.request.res, next);
});

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/projects', projectsRouter);
app.use('/users', usersRouter);
app.use('/friendrequests', friendrequestsRouter);
app.use('/rooms', roomsRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

io.on('connection', (socket) => {
  console.log('someone socket is connected!');

  socket.request.session.socketId = socket.id;
  socket.request.session.save((error) => {
    if (error) console.error(error);
  });
});

console.log(`process.env.NODE_ENV : ${process.env.NODE_ENV}`);

module.exports = app;
