const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

function generateRandomString() { 
  let result = '';
  const arrayOfLetters = 
    [
      'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
      'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 
      'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
      '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'
    ];
  for (let i = 6; i > 0; i--) {
    result += arrayOfLetters[Math.floor(Math.random() * arrayOfLetters.length)];
  }
  return result;
};

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/register", (req, res) => {
  const user = users[req.cookies.user_id];
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
  const user = users[req.cookies.user_id];
  const templateVars = { 
    urls: urlDatabase,
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
      const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], user, };
      res.render("urls_show", templateVars);
    }
  }
  return res.send("Error! The ID you are trying to reach does not exist");
});

app.get("/u/:id", (req, res) => {
  for (const i in urlDatabase) {
    if (i === req.params.id) {
      const longURL = urlDatabase[req.params.id];
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
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  res.redirect(`/urls/${id}`);
})

app.post("/urls/:id/edit", (req, res) => {
  const id = req.params.id;
  const newUrl = req.body.newUrl;
  urlDatabase[id] = newUrl;
  res.redirect("/urls");
})

app.post("/urls/:id/delete", (req, res) => {
  let id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  let loginEmail = req.body.email;
  if (!getUserByEmail(loginEmail)) {
    return res.sendStatus(403);
  }
  let pass = req.body.password;
  for (const id in users) {
    if (users[id].password === pass && users[id].email === loginEmail) {
      res.cookie("user_id", id);
      res.redirect("/urls");
    }
  }
  return res.sendStatus(403);
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect('/login');
});

function getUserByEmail(email) {
  // const arrUsers = Object.values(users) 
  for (const i in users) {
    if (users[i].email === email) {
      return users[i];
    }
  }
  return null;
}

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
    users[id] = {
      id: id,
      email: req.body.email,
      password: req.body.password,
    } 
    res.cookie("user_id", id);
    res.redirect('/urls');
  }
});