/* `const passport = require('passport');` is importing the Passport library. Passport
is a popular authentication middleware for Node.js that provides various authentication strategies,
such as Google OAuth, Facebook OAuth, and local authentication. By importing Passport, the code can
utilize its functionality to implement authentication mechanisms in the application. */
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { createCustomer, getCustomerWithEmail, getCustomerWithEmailOrAccountId, getCustomerWithID, updateUserInfo } = require('../queries/user.queries');
const { Strategy: FacebookStrategy } = require('passport-facebook');
const { Strategy: LocalStrategy } = require('passport-local');
const { passwordValidator } = require('../utils/passwordValidator/passwordValidator');
const { createUserID } = require('../utils/createUserID/createUserID');
const AppleStrategy = require('passport-apple');
const jwt = require('jsonwebtoken');
const path = require('path');
const logger = require('./logger');

passport.serializeUser((user , done) => {
    done(null,user._id)
})

passport.deserializeUser(async(id, done) => {
    let user = await getCustomerWithID(id)
    user = {...user}
    user._id = user?.user_id
    done(null, user)
})

console.log({clientId:process.env.GOOGLE_CLIENT_ID , clientSecret: process.env.GOOGLE_CLIENT_SECRET});


/*=====================================
 *      Google Strategy
 ======================================*/
passport.use( new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_API_URL}/api/v2/auth/google/redirect`,
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
}, async (accessToken, refreshToken, profile, done) => {
    let user = await getCustomerWithEmailOrAccountId(profile.id,profile?._json?.email)

    if(!user){
        return done(null, false, {message: "User account doesn't exist!"})
    }else if(user && !user?.account_id){
        await updateUserInfo({
            account_id: profile?.id,
            email: profile?._json?.email,
            first_name: (profile?._json?.name),
            profile: (profile?._json?.profile),
            type: "google",
        })
        user.account_id = profile?.id
    }

    const resProfile = {
        _id: user.user_id,
        first_name: user.first_name,
        email: user?.email,
        type: user?.type,
        profile: user?.profile,
        accountId: user?.account_id
    }

    return done(null, resProfile)
}))


/*=====================================
 *      Facebook Strategy
 ======================================*/
passport.use( new FacebookStrategy({
    clientID: process.env.FB_APP_ID,
    clientSecret: process.env.FB_APP_SECRET,
    callbackURL: `${process.env.BASE_API_URL}/api/v2/auth/facebook/redirect`
}, async (accessToken, refreshToken, profile, done) => {
    // let user = await getCustomerWithEmail(profile?._json?.email)
    console.log(profile, 'this is profile');


    // if(!user){
    //     user = await createCustomer({
    //         first_name: (profile?._json?.name),
    //         profile: (profile?._json?.profile),
    //         type: "google",
    //         email: (profile?._json?.email)
    //     })
    // }

    // const resProfile = {
    //     first_name: user.first_name,
    //     email: user?.email,
    //     type: user?.type,
    //     profile: user?.profile
    // }

    return done(null, profile)
}))


/*=====================================
 *      Local Strategy
 ======================================*/
passport.use(new LocalStrategy( { usernameField: 'email', passwordField: 'password' }, async (email, password, done) => {
    try{
        const user = await getCustomerWithEmail(email);
        if(!user){
            return done(null, false, {message: "User account doesn't exist!"})
        }else if(!user?.password){
            return done(null, false, {message: "Please login with other methods!"})
        }else{
            const isValidPassword = await passwordValidator(password, user?.password)
            if(!isValidPassword){
                return done(null, false, {message: "Incorrect password"})
            }else{
                const profile = {
                    _id: user.user_id,
                    first_name: user.first_name,
                    email: user?.email,
                    type: user?.type,
                    profile: user?.profile,
                    accountId: user?.account_id
                }
                return done(null,profile)
            }
        }
    }catch(error){
        logger.error(error?.message || error , {meta: {body: email}})
        return done(true, error)
    }
}))

passport.use(new AppleStrategy({
    clientID: process.env.APPLE_CLIENT_ID,
    teamID: process.env.APPLE_TEAM_ID,
    keyID: process.env.APPLE_KEY_ID,
    privateKeyLocation:  "/app/AuthKey.p8",
    callbackURL: `${process.env.BASE_API_URL}/api/v2/auth/apple/redirect`, // Redirect URL
    scope: ['name', 'email'],
    passReqToCallback: true
}, async (req, accessToken, refreshToken, idToken, profile, done) => {

    const decodedToken = jwt.decode(idToken);

    let user = await getCustomerWithEmailOrAccountId(decodedToken?.sub,decodedToken.email)

    if(!user){
        return done(null, false, {message: "User account doesn't exist!"})
    }else if(user && !user?.account_id){
        await updateUserInfo({
            email: decodedToken?.sub,
            account_id: decodedToken?.sub,
            type: "apple",
        })
        user.account_id = decodedToken?.sub
        user.type = "apple";
    }

    const resProfile = {
        _id: user.user_id,
        first_name: user.first_name,
        email: user?.email,
        type: user?.type,
        profile: user?.profile,
        accountId: user?.account_id
    }

    return done(null, resProfile)
}))
