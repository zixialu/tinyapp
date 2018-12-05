const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;

// Set view engine to ejs
app.set('view engine', 'ejs');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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
  let templateVars = { urls: urlDatabase, username: req.cookies['username']};
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
  let templateVars = { username: req.cookies['username'] };
  res.render('urls_new', templateVars);
});

// View single url
app.get('/urls/:id', (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];
  let templateVars = { shortURL, longURL, username: req.cookies['username'] };
  res.render('urls_show', templateVars);
});

app.post('/urls/:id', (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect(303, '/urls');
});

// Delete url
// TODO: Change this to use DELETE and not POST
app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  // Send a 303 redirect to /urls
  res.redirect(303, `/urls`);
});

// Redirect to longURL
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
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

// Listening for requests
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
