const express = require("express");
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const bcrypt = require("bcryptjs");
const cookieSession = require('cookie-session');

const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

const { users, urlDatabase, } = require("./database");

app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ["I have a secret"],
  maxAge: 24 * 60 * 60 * 1000
}));

/** 
 * HELPER FUNCTIONS
 */

const 
{
  urlsForUser,
  generateRandomString,
  getUserByEmail,
  addUser,
} = require("./helpers");

/** 
 * ALL GET ROUTES BELOW
 */  

app.get("/", (req, res) => {
  const id = req.session.user_id;
  if(id) {
    res.redirect("/urls");
  }
  res.redirect("/login");
});

app.get("/register", (req, res) => {
  const id = req.session.user_id;
  if(!id) {
    const user = users[id];
    const templateVars = {
      user,
    };
    res.render("urls_register", templateVars);
  }
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const id = req.session.user_id;
  if(id) {
    res.redirect("/urls");
  }
  const user = users[id];
  const templateVars = {
    urls: urlDatabase,
    user,
  };
  res.render("urls_login", templateVars);
});

app.get("/urls", (req, res) => {
  const id = req.session.user_id;
  if(!id) {
    res.send(`Please <a href="/login">login</a> or <a href="/register">register</a>`);
  }
  const user = users[id];
  const templateVars = {
    urls: urlsForUser(id, urlDatabase),
    user,
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const id = req.session.user_id;
  if(!id) {
    res.redirect("/login");
  }
  const user = users[id];
  const templateVars = {
    urls: urlDatabase,
    user,
  };
  res.render("urls_new",templateVars);
});

/**
 *  /urls/:id
 * 
 * 1. Checks IF the ID exists in the database
 * 2. Checks IF user is logged in
 * 3. Checks IF user has access to the URL
 * 
 */

app.get("/urls/:id", (req, res) => {
  const userId = req.session.user_id
  const id = req.params.id;

  if (!urlDatabase[id]) {
    return res.send("Error! The ID you are trying to reach does not exist");
  }
  if (!userId) {
    return res.send(`You have to <a href="/login">login</a> to have access to this page`);
  }
  if (!urlsForUser(userId, urlDatabase)[id]) {
    return res.send("You do not have access to this URL");
  }

  for (const i in urlDatabase) {
    if (i === req.params.id) {
      const user = users[req.session.user_id];
      const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, user, };
      res.render("urls_show", templateVars);
    }
  }
});

/**
 *  /u/:id
 * 
 * Checks IF the ID exists in the database
 * 
 */

app.get("/u/:id", (req, res) => {
  for (const i in urlDatabase) {
    if (i === req.params.id) {
      const longURL = urlDatabase[req.params.id].longURL;
      res.redirect(longURL);
    }
  }
  return res.send("Error! The ID you are trying to reach does not exist");
});

/** 
 * ALL POST ROUTES BELOW
 * 
 * 1. Checks if user is logged in
 * 
 */

app.post("/urls", (req, res) => {
  const userId = req.session.user_id

  if (!userId) {
    return res.send(`You have to <a href="/login">login</a> to have access to this page`);
  }

  const id = generateRandomString();
  urlDatabase[id] = { longURL: req.body.longURL, userID: req.session.user_id, };
  res.redirect(`/urls/${id}`);
});

/**
 * SHORTEN A URL - EDIT - DELETE
 * 
 * 1. Checks IF user is logged in
 * 2. Checks IF user has access to functionality
 * 3. Checks IF the ID exists in the database 
 * 
 */

/**
 * SHORTEN A URL
 */

app.post("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  const id = req.params.id;

  if (!userId) {
    return res.send(`You have to <a href="/login">login</a> to shorten a URL`);
  }
  if (!urlsForUser(userId, urlDatabase)[id]) {
    return res.send("You do not have access to this URL");
  }
  if (!urlDatabase[id]) {
    return res.send("This ID does not exist");
  }

  res.redirect(`/urls/${id}`);
});

/**
 * EDIT
 */

app.post("/urls/:id/edit", (req, res) => {
  const userId = req.session.user_id;
  const id = req.params.id;

  if (!userId) {
    return res.send(`You have to <a href="/login">login</a> to edit a URL`);
  }
  if (!urlsForUser(userId, urlDatabase)[id]) {
    return res.send("You do not have access to this URL");
  }
  if (!urlDatabase[id]) {
    return res.send("This ID does not exist");
  }

  const newUrl = req.body.newUrl;
  urlDatabase[id].longURL = newUrl;
  res.redirect("/urls");
});

/**
 * DELETE
 */

app.post("/urls/:id/delete", (req, res) => {
  const userId = req.session.user_id;
  const id = req.params.id;

  if (!userId) {
    return res.send(`You have to <a href="/login">login</a> to delete a URL`);
  }
  if (!urlsForUser(userId, urlDatabase)[id]) {
    return res.send("You do not have access to this URL");
  }
  if (!urlDatabase[id]) {
    return res.send("This ID does not exist");
  }

  delete urlDatabase[id];
  res.redirect("/urls");
});

/** 
 * LOGIN
 * 
 * 1. Checks IF email exists in database
 * 2. Checks IF encrypted password matches with the given email
 * 
 */

app.post("/login", (req, res) => {
  const loginEmail = req.body.email;
  const pass = req.body.password;

  if (!getUserByEmail(loginEmail, users)) {
    return res.send("Incorrect login");
  }
  for (const id in users) {
    if (bcrypt.compareSync(pass, users[id].password) && users[id].email === loginEmail) {
      req.session.user_id = id;
      res.redirect("/urls");
    }
  }

  return res.send("Incorrect login");
});

app.post("/logout", (req, res) => {
  res.clearCookie("session");
  res.redirect('/login');
});

/** 
 * REGISTER
 * 
 * 1. Checking for the email and password is null or not
 * 2. Check for the email is not already registered
 * 
 */  

app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    return res.sendStatus(400);
  }
  if (getUserByEmail(req.body.email, users)) {
    return res.send("Email is already registered. Please try again");
  } else {
    const id = generateRandomString();
    const { email, password } = req.body;
    addUser(users, email, password, id);
    req.session.user_id = id;
    res.redirect('/urls');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});