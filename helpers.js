const bcrypt = require("bcryptjs");

const urlsForUser = (id, database) => {
  let userUrls = {};
  for (const i in database) {
    if (id === database[i].userID) {
      userUrls[i] = database[i];
    }
  }
  return userUrls;
};

const generateRandomString = () => { 
  let result = '';
  const charList = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 6; i > 0; i--) {
    result += charList[Math.floor(Math.random() * charList.length)];
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