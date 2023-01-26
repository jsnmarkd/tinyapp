// Database
const { users, urlDatabase, } = require("./database");
const bcrypt = require("bcryptjs"); // Require Bcrypt (Hashes/Encryts Passwords)

const urlsForUser = (id, database) => {
  let userUrls = {};
  for (const i in database) {
    if (id === database[i].userID) {
      userUrls[i] = database[i];
    }
  }
  console.log(userUrls);
  return userUrls;
};

const generateRandomString = () => { 
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

const getUserByEmail = (email, database) => {
  for (const i in database) {
    if (database[i].email === email) {
      return database[i];
    }
  }
  return null;
};

const addUser = (database, email, password, id) => {
  const hashedPassword = bcrypt.hashSync(password, 10);
  database[id] = {
    id: id,
    email,
    password: hashedPassword,
  } 
};

module.exports = { urlsForUser, generateRandomString, getUserByEmail, addUser };