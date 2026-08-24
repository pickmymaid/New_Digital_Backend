const createUserID = (firstName) => {
  var randomNumber = Math.floor(100000 + Math.random() * 900000);

  // Get the current timestamp
  var timestamp = Date.now();

  // Combine the random number and timestamp to create the user ID
  var userID = firstName.toLowerCase().replace(/\s/g, '') + randomNumber.toString() + timestamp.toString();

  return userID;
}

module.exports = { createUserID };
