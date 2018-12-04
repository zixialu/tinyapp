const express = require('express');
const bodyParser =  require('body-parser');
const app = express();
const PORT = 8080; // default port 8080

// Set view engine to ejs
app.set('view engine', 'ejs');

// Set body parsing
app.use(bodyParser.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// Url list
app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

// POST new url form
app.post('/urls', (req, res) => {
  console.log(req.body);
  // TODO: Implement actual behaviour
  res.send('Ok');
})

// New url form
app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

// View single url
app.get('/urls/:id', (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];
  let templateVars = { shortURL, longURL };
  res.render('urls_show', templateVars);
});

// app.get("/", (req, res) => {
//   res.send("Hello!");
// });

// // Adding routes
// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

// // Sending HTML
// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// Generate a string to assign as a new shortURL
function generateRandomString() {
  const SHORT_URL_LENGTH = 6;
  const LEGAL_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomAlphanumerics = [];
  for (let i = 0; i < SHORT_URL_LENGTH; i++) {
    const random = Math.floor(Math.random(LEGAL_CHARACTERS.length()));
    randomAlphanumerics.push(LEGAL_CHARACTERS[random]);
  }
  return randomAlphanumerics.join('');
}