const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');
const bcrypt = require('bcrypt');
const dateFormat = require('dateformat');
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
    keys: [process.env.COOKIE_SESSION_KEY],

    // Cookie Options
    // Persist cookie for 24 hours
    maxAge: 24 * 60 * 60 * 1000
  })
);
app.use(methodOverride('_method'));

// MARK: - Data
const urlDatabase = {
  'b2xVn2': {
    longURL: 'http://www.lighthouselabs.ca',
    userId: 'userRandomID',
    dateCreated: new Date(),
    visits: 0,
    uniqueVisits: 0
  },
  '9sm5xK': {
    longURL: 'http://www.google.com',
    userId: 'userRandomID',
    dateCreated: new Date(),
    visits: 0,
    uniqueVisits: 0
  }
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

// Redirect from root
app.get('/', (req, res) => {
  if (req.session.userId) {
    // User is logged in, show /urls
    res.redirect('/urls');
  } else {
    // User must log in first
    res.redirect('/login');
  }
});

// Url list
app.get('/urls', (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    // Guests cannot access this page
    res.status(401).send('401: You must be logged in to view urls');
  } else {
    const formattedDate = dateFormat(users[userId].dateCreated, 'isoDate');
    const templateVars = {
      urls: getUsersURLs(userId),
      user: users[userId],
      formattedDate
    };
    res.render('urls_index', templateVars);
  }
});

// POST new url form data
app.post('/urls', (req, res) => {
  if (!req.session.userId) {
    // Handle user not logged in
    res.status(401).send('401: You must be logged in to shorten a url');
  } else {
    let shortURL = generateRandomString();

    // Ensure new shortURL is unique
    while (urlDatabase[shortURL]) {
      shortURL = generateRandomString();
    }
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userId: req.session.userId,
      dateCreated: new Date(),
      visits: 0,
      uniqueVisits: 0
    };

    // Send a 303 redirect to /urls/<shortURL>
    res.redirect(303, `/urls/${shortURL}`);
  }
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
  if (!urlDatabase[shortURL]) {
    // Handle invalid shortURL
    res.status(400).send('400: Bad request');
    // Check that the user owns the link
  } else if (urlDatabase[shortURL].userId === req.session.userId) {
    const longURL = urlDatabase[shortURL].longURL;
    const formattedDate = dateFormat(
      urlDatabase[shortURL].dateCreated,
      'isoDate'
    );
    const templateVars = {
      shortURL,
      longURL,
      visits: urlDatabase[shortURL].visits,
      uniqueVisits: urlDatabase[shortURL].uniqueVisits,
      user: users[req.session.userId],
      formattedDate
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
/*
 * FIXME: Logging out clears cookies, allowing a user to repeatedly increment
 * the unique visits counter. Maybe create a second cookie session if possible
 * to save login and visit data seperately?
 */
app.get('/u/:shortURL', (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    // Handle invalid shortURL
    res.status(400).send('400: Bad request');
  } else {
    // Increment visits
    urlDatabase[req.params.shortURL].visits++;
    // Increment unique visits based on cookies
    // Could be accomplished in other ways, such as by tracking fingerprints
    const visitCookieKey = 'visit' + req.params.shortURL;
    if (!req.session[visitCookieKey]) {
      // User has not visitied this shortURL before; count it as a unique visit
      req.session[visitCookieKey] = true;
      urlDatabase[req.params.shortURL].uniqueVisits++;
    }
    // Redirect to target
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  }
});

// MARK: - Authentication

// Login form
app.get('/login', (req, res) => {
  if (req.session.userId) {
    // User is logged in, redirect to /urls
    res.redirect('/urls');
  } else {
    const templateVars = { user: users[req.session.userId] };
    res.render('login', templateVars);
  }
});

// Login
app.post('/login', (req, res) => {
  // Get userId for provided login email
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
    // User and password hashes match, successful login
    req.session.userId = userMatch.id;
    res.redirect(303, '/urls');
  }
});

// Logout
app.post('/logout', (req, res) => {
  // Delete cookie
  req.session = null;
  /*
   * FIXME: Requirements state logout should redirect to /urls, but accessing
   * /urls while logged out will redirect to a 401 error page. Should this be
   * changed to a redirect to /login?
   */
  res.redirect(303, '/urls');
});

// Register user form
app.get('/register', (req, res) => {
  if (req.session.userId) {
    // User is logged in, redirect to /urls
    res.redirect('/urls');
  } else {
    const templateVars = { user: users[req.session.userId] };
    res.render('register', templateVars);
  }
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
    res.status(400).send('400: Bad request—email and password can\'t be empty');
  }
  if (getUserWithEmail(email)) {
    res.status(409).send('409: email is taken');
  }

  // Add new user to db
  users[id] = {
    id,
    email: req.body.email,
    // Save only the hashed password
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
