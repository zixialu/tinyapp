const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const app = express();
const PORT = 8080;

// Set view engine to ejs
app.set('view engine', 'ejs');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride('_method'));


// MARK: - Data
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
  "000000": {
    id: "000000",
    email: "zixialu@gmail.com",
    password: "hunter2"
  }
};


// MARK: - Helpers

// Generate a string to assign as a new shortURL
function generateRandomString() {
  const SHORT_URL_LENGTH = 6;
  const LEGAL_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomAlphanumerics = [];
  for (let i = 0; i < SHORT_URL_LENGTH; i++) {
    const random = Math.floor(Math.random() * LEGAL_CHARACTERS.length);
    randomAlphanumerics.push(LEGAL_CHARACTERS[random]);
  }
  return randomAlphanumerics.join('');
}

// Returns the user with an email, or null if email can't be found
function getUserWithEmail(email) {
  for (userId in users) {
    if (users[userId].email.toLowerCase() === email) { return users[userId]; }
  }
  return null;
}


// MARK: - Endpoints

// Url list
app.get('/urls', (req, res) => {
  // cookieParser()
  console.log(req.cookies);
  const templateVars = { urls: urlDatabase, user: users[req.cookies['user_id']] };
  res.render('urls_index', templateVars);
});

// POST new url form data
app.post('/urls', (req, res) => {
  let shortURL = generateRandomString();

  // Ensure new shortURL is unique
  while (urlDatabase[shortURL]) {
    shortURL = generateRandomString();
  }
  urlDatabase[shortURL] = req.body.longURL;

  // Send a 303 redirect to /urls/<shortURL>
  res.redirect(303, `/urls/${shortURL}`);
});

// New url form
app.get('/urls/new', (req, res) => {
  const templateVars = { user: users[req.cookies['user_id']] };
  res.render('urls_new', templateVars);
});

// View single url
app.get('/urls/:id', (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];
  const templateVars = { shortURL, longURL, user: users[req.cookies['user_id']] };
  res.render('urls_show', templateVars);
});

// Update url
app.put('/urls/:id', (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect(303, '/urls');
});

// Delete url
app.delete('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  // Send a 303 redirect to /urls
  res.redirect(303, `/urls`);
});


// MARK: - Authentication

// Redirect to longURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// Login form
app.get('/login', (req, res) => {
  const templateVars = { user: users[req.cookies['user_id']] };
  res.render('login', templateVars);
});

// Login
app.post('/login', (req, res) => {
  const userMatch = getUserWithEmail(req.body.email);
  // Handle bad credentials
  if (!userMatch || userMatch.password !== req.body.password) {
    res.status(400).send('400: The email or password you have entered is incorrect');
  }

  res.cookie('user_id', userMatch.user_id);
  res.redirect(303, '/urls');
});

// Logout
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect(303, '/urls');
});

// Register user form
app.get('/register', (req, res) => {
  const templateVars = { user: users[req.cookies['user_id']] };
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
  if (!email || !password) { res.status(400).send('400: Bad request'); }
  if (getUserWithEmail(email)) { res.status(400).send('400: Bad request'); }

  // Add new user to 'db'
  users[id] = {
    id,
    email: req.body.email,
    password: req.body.password
  };

  // Set cookie
  res.cookie('user_id', id);

  res.redirect(303, '/urls');
});


//MARK: - Ports

// Listening for requests
app.listen(PORT, () => {
  console.log(`tinyApp listening on port ${PORT}!`);
});
