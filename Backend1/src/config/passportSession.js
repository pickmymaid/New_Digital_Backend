// Backend1 does not initiate OAuth logins (that's Backend2's job) —
// it only needs to decode the shared session cookie into req.user for
// endpoints guarded by validateUser (blog comments/likes, wishlist, etc).
// cookie-session stores session data in the cookie itself (signed with
// COOKIE_KEY), so any service with the same key + this same
// serialize/deserialize pair can read it — no shared session store needed.
const passport = require('passport');
const { getCustomerWithID } = require('../queries/user.queries');

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  let user = await getCustomerWithID(id);
  user = { ...user };
  user._id = user?.user_id;
  done(null, user);
});

module.exports = passport;
