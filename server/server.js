const express = require('express');
const uuid = require('uuid/v4')
const session = require('express-session')
const FileStore = require('session-file-store')(session);
const bodyParser = require('body-parser');
const passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

// create the server
const app = express();

const users = [{id:'123456', username:'Jura', password:'12345678'}];

passport.use(new LocalStrategy(
  (username, password, done) => {
    console.log('Inside local strategy callback')
    // here is where you make a call to the database
    // to find the user based on their username or email address
    // for now, we'll just pretend we found that it was users[0]
    const user = users[0]
    if(username === user.username && password === user.password) {
      console.log('Local strategy returned true')
      return done(null, user)
    }
  }
));

passport.serializeUser((user, done) => {
  console.log('Inside serializeUser callback. User id is save to the session file store here')
  done(null, user.id);
});
passport.deserializeUser((id, done) => {
  console.log('Inside deserializeUser callback')
  console.log(`The user id passport saved in the session file store is: ${id}`)
  const user = users[0].id === id ? users[0] : false;
  done(null, user);
});

// add & configure middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// add & configure middleware
app.use(session({
  genid: (req) => {
    console.log('Inside the session middleware')
    console.log(req.sessionID)
    return uuid() // use UUIDs for session IDs
  },
  store: new FileStore(),
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie:{maxAge:1000*60*60}
}))

app.use(passport.initialize());
app.use(passport.session());


// create the homepage route at '/'
app.get('/', (req, res) => {
  console.log('Inside GET /authrequired callback')
  console.log(`User authenticated? ${req.isAuthenticated()}`)
  if(req.isAuthenticated()) {
    res.send('you hit the authentication endpoint\n')
  } else {
    res.redirect('/login')
  }
})
app.get('/login', (req, res) => {
    res.send('Login page - yet to be built\n')
})
app.post('/login', (req, res, next) => {
  console.log('Inside POST /login callback')
  passport.authenticate('local', (err, user, info) => {
    console.log('Inside passport.authenticate() callback');
    console.log(`req.session.passport: ${JSON.stringify(req.session.passport)}`)
    console.log(`req.user: ${JSON.stringify(req.user)}`)
    req.login(user, (err) => {
      console.log('Inside req.login() callback')
      console.log(`req.session.passport: ${JSON.stringify(req.session.passport)}`)
      console.log(`req.user: ${JSON.stringify(req.user)}`)
      return res.send('You were authenticated & logged in!\n');
    })
  })(req, res, next);
})

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

// tell the server what port to listen on
app.listen(3003, () => {
  console.log('Listening on localhost:3003')
})
