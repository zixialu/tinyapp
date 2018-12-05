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
  }
};


// MARK: - Endpoints

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

// Url list
app.get('/urls', (req, res) => {
  // cookieParser()
  console.log(req.cookies);
  const templateVars = { urls: urlDatabase, username: req.cookies['username']};
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
  const templateVars = { username: req.cookies['username'] };
  res.render('urls_new', templateVars);
});

// View single url
app.get('/urls/:id', (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];
  const templateVars = { shortURL, longURL, username: req.cookies['username'] };
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

// Login
app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect(303, '/urls');
});

// Logout
app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect(303, '/urls');
});

// Register account form
app.get('/register', (req, res) => {
  res.render('register');
});


//MARK: - Ports

// Listening for requests
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
