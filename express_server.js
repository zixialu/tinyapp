const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');
const bcrypt = require('bcrypt');
require('dotenv').config();
const app = express();
const PORT = 8080;
// Used to hash received passwords
const SALT_ROUNDS = 10;

// Set view engine to ejs
app.set('view engine', 'ejs');

// Trust first proxy for cookie-session
app.set('trust proxy', 1);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: 'session',
    keys: [process.env.COOKIE_SESSION_KEYS]
  })
);
console.log(process.env.COOKIE_SESSION_KEYS);
app.use(methodOverride('_method'));

// MARK: - Data
const urlDatabase = {
  'b2xVn2': { longURL: 'http://www.lighthouselabs.ca', userId: 'userRandomID' },
  '9sm5xK': { longURL: 'http://www.google.com', userId: 'userRandomID' }
};

const users = {
  'userRandomID': {
    id: 'userRandomID',
    email: 'user@example.com',
    hashedPassword: bcrypt.hashSync('aaa', SALT_ROUNDS)
  },
  'user2RandomID': {
    id: 'user2RandomID',
    email: 'user2@example.com',
    hashedPassword: bcrypt.hashSync('dishwasher-funk', SALT_ROUNDS)
  },
  '444444': {
    id: '444444',
    email: 'zixialu@gmail.com',
    hashedPassword: bcrypt.hashSync('hunter2', SALT_ROUNDS)
  }
};

// MARK: - Helpers

// Generate a string to assign as a new shortURL
function generateRandomString() {
  const SHORT_URL_LENGTH = 6;
  const LEGAL_CHARACTERS =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomAlphanumerics = [];
  for (let i = 0; i < SHORT_URL_LENGTH; i++) {
    const random = Math.floor(Math.random() * LEGAL_CHARACTERS.length);
    randomAlphanumerics.push(LEGAL_CHARACTERS[random]);
  }
  return randomAlphanumerics.join('');
}

// Returns the user given an email, or null if email can't be found
function getUserWithEmail(email) {
  const matchingId = Object.keys(users).filter(userId => {
    return users[userId].email === email;
  })[0];
  return users[matchingId];
}

// Returns the urls created by a user
function getUsersURLs(userId) {
  let usersUrls = {};
  for (shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userId === userId) {
      usersUrls[shortURL] = urlDatabase[shortURL];
    }
  }

  return usersUrls;
}

// MARK: - Endpoints

// Url list
app.get('/urls', (req, res) => {
  const userId = req.session.userId;
  const templateVars = { urls: getUsersURLs(userId), user: users[userId] };
  res.render('urls_index', templateVars);
});

// POST new url form data
app.post('/urls', (req, res) => {
  let shortURL = generateRandomString();

  // Ensure new shortURL is unique
  while (urlDatabase[shortURL]) {
    shortURL = generateRandomString();
  }
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userId: req.session.userId
  };

  // Send a 303 redirect to /urls/<shortURL>
  res.redirect(303, `/urls/${shortURL}`);
});

// New url form
app.get('/urls/new', (req, res) => {
  // Redirect guests to login form
  if (!req.session.userId) {
    res.redirect('/login');
  } else {
    const templateVars = { user: users[req.session.userId] };
    res.render('urls_new', templateVars);
  }
});

// View/edit single url
app.get('/urls/:id', (req, res) => {
  const shortURL = req.params.id;
  if (urlDatabase[shortURL].userId === req.session.userId) {
    const longURL = urlDatabase[shortURL].longURL;
    const templateVars = {
      shortURL,
      longURL,
      user: users[req.session.userId]
    };
    res.render('urls_show', templateVars);
  } else {
    res.status(401).send('401: You must be the owner of the url to edit it');
  }
});

// Update url
app.put('/urls/:id', (req, res) => {
  // Check if user has credentials to edit
  if (urlDatabase[req.params.id].userId !== req.session.userId) {
    res.status(401).send('401: You must be the owner of the url to edit it');
  } else {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect(303, '/urls');
  }
});

// Delete url
app.delete('/urls/:id/delete', (req, res) => {
  // Check if user has credentials to delete
  if (urlDatabase[req.params.id].userId !== req.session.userId) {
    res.status(401).send('401: You must be the owner of the url to delete it');
  } else {
    delete urlDatabase[req.params.id];
    res.redirect(303, `/urls`);
  }
});

// Redirect to longURL
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// MARK: - Authentication

// Login form
app.get('/login', (req, res) => {
  const templateVars = { user: users[req.session.userId] };
  res.render('login', templateVars);
});

// Login
app.post('/login', (req, res) => {
  const userMatch = getUserWithEmail(req.body.email);
  // Handle bad credentials
  if (
    !userMatch ||
    !bcrypt.compareSync(req.body.password, userMatch.hashedPassword)
  ) {
    res
      .status(401)
      .send('401: The email or password you have entered is incorrect');
  } else {
    req.session.userId = userMatch.id;
    console.log(`Logged in, userId is ${req.session.userId}`);
    res.redirect(303, '/urls');
  }
});

// Logout
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect(303, '/urls');
});

// Register user form
app.get('/register', (req, res) => {
  const templateVars = { user: users[req.session.userId] };
  res.render('register', templateVars);
});

// POST user registration
app.post('/register', (req, res) => {
  // Generate new random id, ensure new id is unique
  let id = generateRandomString();
  while (users[id]) {
    id = generateRandomString();
  }
  const { email, password } = req.body;

  // Handle bad input (empty fields, email exists)
  if (!email || !password) {
    res.status(400).send('400: Bad request');
  }
  if (getUserWithEmail(email)) {
    res.status(409).send('409: email is taken');
  }

  // Add new user to 'db'
  users[id] = {
    id,
    email: req.body.email,
    hashedPassword: bcrypt.hashSync(req.body.password, SALT_ROUNDS)
  };

  // Set cookie
  req.session.userId = id;

  res.redirect(303, '/urls');
});

//MARK: - Ports

// Listening for requests
app.listen(PORT, () => {
  console.log(`tinyApp listening on port ${PORT}!`);
});
