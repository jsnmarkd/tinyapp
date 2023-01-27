const bcrypt = require("bcryptjs"); // Require Bcrypt (Hashes/Encryts Passwords)
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};
const hashedPassword3 = bcrypt.hashSync("p4ss", 10);
const hashedPassword2 = bcrypt.hashSync("dishwasher-funk", 10);
const hashedPassword1 = bcrypt.hashSync("purple-monkey-dinosaur", 10);
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: hashedPassword1,
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: hashedPassword2,
  },
  aJ48lW: {
    id: "aJ48lW",
    email: "user4@example.com",
    password: hashedPassword3,
  },
};

module.exports = { users, urlDatabase };