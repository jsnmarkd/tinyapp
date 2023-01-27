const { assert } = require('chai');

const { getUserByEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    assert(user.id === expectedUserID, "Should return the expected user ID");
  });
  it('should return null if an email is not in our users database', function() {
    const user = getUserByEmail("nope@example.com", testUsers)
    const expectedOutput = null;
    assert(user === expectedOutput, "Should return undefined");
  });
});