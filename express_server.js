const express = require("express"); // Require Express Framework (Server)
const cookieParser = require('cookie-parser'); // Require Cookie Parser (Parses string to cookie)
const morgan = require('morgan'); // Require Morgan (Logs all requests received)
const bcrypt = require("bcryptjs"); // Require Bcrypt (Hashes/Encryts Passwords)
const cookieSession = require('cookie-session'); // Require Cookie Session (Stores the session data on the client within a cookie)

const app = express(); // Sets up Server
const PORT = 8080; // default port 8080

app.set("view engine", "ejs"); // Renders EJS

const { users, urlDatabase, } = require("./database"); // Database to test

//////////  Middlewares  //////////
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ["I have a secret"],
  maxAge: 24 * 60 * 60 * 1000
}));
app.use((req, res, next) => { 
  // Middleware that checks if you are logged in, else sends an error message
  const id = req.session.user_id;
  const whiteList = ["/", "/login", "/register", "/logout", "/u/:id"];
  if (id || whiteList.includes(req.url) || req.url.slice(0, 3) === "/u/") {
    return next();
  }
  res.send("Please login or register");
});

//////////  Helper Functions  //////////
const {
  urlsForUser,
  generateRandomString,
  getUserByEmail,
  addUser,
} = require("./helpers");

//////////  GET routes  //////////
app.get("/", (req, res) => {
  const id = req.session.user_id;
  // Checks if user is logged in, else redirects to login page
  if(id) {
    res.redirect("/urls");
  }
  res.redirect("/login");
});

app.get("/register", (req, res) => {
  // Checks if user is not logged in to render register page, else redirects to URL page
  if(!req.session.user_id) {
    const id = req.session.user_id;
    const user = users[id];
    const templateVars = {
      urls: urlDatabase,
      user,
    };
    res.render("urls_register", templateVars);
  }
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  // Renders login page
  const id = req.session.user_id;
  const user = users[id];
  const templateVars = {
    urls: urlDatabase,
    user,
  };
  res.render("urls_login", templateVars);
});

app.get("/urls", (req, res) => {
  // Renders URL page
  const id = req.session.user_id;
  const user = users[id];
  const templateVars = {
    urls: urlsForUser(id, urlDatabase),
    user,
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  // Renders Create New URL page
  const id = req.session.user_id;
  const user = users[id];
  const templateVars = {
    urls: urlDatabase,
    user,
  };
  res.render("urls_new",templateVars);
});

app.get("/urls/:id", (req, res) => {
  // Renders Edit page
  for (const i in urlDatabase) {
    if (i === req.params.id) {
      const user = users[req.session.user_id];
      const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, user, };
      res.render("urls_show", templateVars);
    }
  }
  return res.send("Error! The ID you are trying to reach does not exist");
});

app.get("/u/:id", (req, res) => {
  // Redirects to proper URL
  for (const i in urlDatabase) {
    if (i === req.params.id) {
      const longURL = urlDatabase[req.params.id].longURL;
      res.redirect(longURL);
    }
  }
  return res.send("Error! The ID you are trying to reach does not exist");
});

//////////  POST routes  //////////
app.post("/urls", (req, res) => {
  // Create Tiny URL
  const id = generateRandomString();
  urlDatabase[id] = { longURL: req.body.longURL, userID: req.session.user_id, };
  res.redirect(`/urls/${id}`);
});

app.post("/urls/:id", (req, res) => {
  // Checks if user is authorized to short URL
  if (!req.session.user_id) {
    return res.send("You have to be logged in to shorten a URL");
  }
  if (!req.params.id) {
    return res.send("Invalid ID");
  }
  const userId = req.session.user_id;
  if (!urlsForUser(userId, urlDatabase)) {
    return res.send("You do not have access to this URL");
  }
  // Short URL
  const id = req.params.id;
  res.redirect(`/urls/${id}`);
});

app.post("/urls/:id/edit", (req, res) => {
  // Checks if user is authorized to edit URL
  if (!req.session.user_id) {
    return res.send("You have to be logged in to edit this URL");
  }
  if (!req.params.id) {
    return res.send("Invalid ID");
  }
  const userId = req.session.user_id;
  if (!urlsForUser(userId, urlDatabase)) {
    return res.send("You do not have access to this URL");
  }
  // Edits URL
  const id = req.params.id;
  const newUrl = req.body.newUrl;
  urlDatabase[id].longURL = newUrl;
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  // Checks if user is authorized to delete URL
  if (!req.session.user_id) {
    return res.send("You have to be logged in to delete this URL");
  }
  if (!req.params.id) {
    return res.send("Invalid ID");
  }
  const userId = req.session.user_id;
  if (!urlsForUser(userId, urlDatabase)) {
    return res.send("You do not have access to this URL");
  }
  // Delete URL
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const loginEmail = req.body.email;
  // Checks if email exists in database
  if (!getUserByEmail(loginEmail, users)) {
    return res.send("Incorrect login");
  }
  // Checks if encrypted password matches with the given email
  const pass = req.body.password;
  for (const id in users) {
    if (bcrypt.compareSync(pass, users[id].password) && users[id].email === loginEmail) {
      req.session.user_id = id;
      res.redirect("/urls");
    }
  }
  // Else send error message
  return res.send("Incorrect login");
});

app.post("/logout", (req, res) => {
  // Clears cookie session and redirects to login page
  res.clearCookie("session");
  res.redirect('/login');
});

app.post("/register", (req, res) => {
  //1. Checking for the email and password is null or not?
  if (req.body.email === "" || req.body.password === "") {
    return res.sendStatus(400);
  }
  //2. Check for the email is not already registered
  if (getUserByEmail(req.body.email, users)) {
    return res.send("Email is already registered. Please try again");
  } else {
    //3. Everything is fine and we can register the new users
    const id = generateRandomString();
    const { email, password } = req.body;
    addUser(users, email, password, id);
    req.session.user_id = id;
    res.redirect('/urls');
  }
});

// Logs that Server is up
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});