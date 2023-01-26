const express = require("express"); // Require Express Framework (Server)
const cookieParser = require('cookie-parser'); // Require Cookie Parser (Parses string to cookie)
const morgan = require('morgan'); // Require Morgan (Logs all requests received)
const bcrypt = require("bcryptjs"); // Require Bcrypt (Hashes/Encryts Passwords)

const app = express(); // Sets up Server
const PORT = 8080; // default port 8080

app.set("view engine", "ejs"); // Renders EJS

// Middlewares
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Helper Functions
const { 
  urlsForUser, 
  generateRandomString, 
  getUserByEmail,
  addUser, 
} = require("./helpers");

app.get("/", (req, res) => {
  // res.send("Hello!");
  res.redirect("/login");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// Database
const { users, urlDatabase, } = require("./database");

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/register", (req, res) => {
  const id = req.cookies.user_id;
  const user = users[id];
  const templateVars = { 
    urls: urlDatabase,
    user, 
  };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const user = users[req.cookies.user_id];
  const templateVars = { 
    urls: urlDatabase,
    user, 
  };
  res.render("urls_login", templateVars);
});

app.get("/urls", (req, res) => {
  if (!req.cookies.user_id) {
    return res.send("Please login or register.")
  }
  const id = req.cookies.user_id;
  const user = users[id];
  const templateVars = { 
    urls: urlsForUser(id),
    user, 
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!req.cookies.user_id) {
    return res.redirect("/login");
  }
  const user = users[req.cookies.user_id];
  const templateVars = { 
    urls: urlDatabase,
    user, 
  };
  res.render("urls_new",templateVars);
});

app.get("/urls/:id", (req, res) => {
  for (const i in urlDatabase) {
    if (i === req.params.id) {
      const user = users[req.cookies.user_id];
      const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, user, };
      res.render("urls_show", templateVars);
    }
  }
  return res.send("Error! The ID you are trying to reach does not exist");
});

app.get("/u/:id", (req, res) => {
  for (const i in urlDatabase) {
    if (i === req.params.id) {
      const longURL = urlDatabase[req.params.id].longURL;
      res.redirect(longURL);
    }
  }
  return res.send("Error! The ID you are trying to reach does not exist");
});

app.post("/urls", (req, res) => {
  if (!req.cookies.user_id) {
    return res.send("You have to be logged in to shorten a URL")
  }
  const id = generateRandomString();
  urlDatabase[id] = { longURL: req.body.longURL, userID: req.cookies.user_id, };
  res.redirect(`/urls/${id}`);
});

app.post("/urls/:id", (req, res) => {
  if (!req.cookies.user_id) {
    return res.send("You have to be logged in to shorten a URL")
  }
  if (!req.params.id) {
    return res.send("Invalid ID")
  }
  const userId = req.cookies.user_id;
  if (!urlsForUser(userId)) {
    return res.send("You do not have access to this URL")
  }
  const id = req.params.id;
  res.redirect(`/urls/${id}`);
})

app.post("/urls/:id/edit", (req, res) => {
  if (!req.cookies.user_id) {
    return res.send("You have to be logged in to edit this URL")
  }
  if (!req.params.id) {
    return res.send("Invalid ID")
  }
  const userId = req.cookies.user_id;
  if (!urlsForUser(userId)) {
    return res.send("You do not have access to this URL")
  }
  const id = req.params.id;
  const newUrl = req.body.newUrl;
  urlDatabase[id].longURL = newUrl;
  res.redirect("/urls");
})

app.post("/urls/:id/delete", (req, res) => {
  if (!req.cookies.user_id) {
    return res.send("You have to be logged in to delete this URL")
  }
  if (!req.params.id) {
    return res.send("Invalid ID")
  }
  const userId = req.cookies.user_id;
  if (!urlsForUser(userId)) {
    return res.send("You do not have access to this URL")
  }
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const loginEmail = req.body.email;
  if (!getUserByEmail(loginEmail)) {
    return res.send("Incorrect login");
  }
  const pass = req.body.password;
  for (const id in users) {
    if (bcrypt.compareSync(pass, users[id].password) && users[id].email === loginEmail) {
      res.cookie("user_id", id);
      res.redirect("/urls");
    }
  }
  return res.send("Incorrect login");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect('/login');
});

app.post("/register", (req, res) => {
  //1. Checking for the email and password is null or not?
  if (req.body.email === "" || req.body.password === ""){
    return res.sendStatus(400);
  }
  //2. Check for the email is not already registered
  if(getUserByEmail(req.body.email)){
    return res.send("Email is already registered. Please try again")
  } else {
    //3. Everything is fine and we can register the new users
    const id = generateRandomString();
    const { email, password } = req.body;
    addUser(users, email, password, id);
    res.cookie("user_id", id);
    res.redirect('/urls');
  }
});

// Logs that Server is up
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
