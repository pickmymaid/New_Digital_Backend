/* `import passport from 'passport';` is importing the Passport library in a TypeScript file. Passport
is a popular authentication middleware for Node.js that provides various authentication strategies,
such as Google OAuth, Facebook OAuth, and local authentication. By importing Passport, the code can
utilize its functionality to implement authentication mechanisms in the application. */
import passport from 'passport';
import {Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { createCustomer, getCustomerWithEmail, getCustomerWithEmailOrAccountId, getCustomerWithID, updateUserInfo } from '../queries/user.queries';
import {Strategy as FacebookStrategy, Profile as FBProfile} from 'passport-facebook'
import {Strategy as LocalStrategy} from 'passport-local'
import { passwordValidator } from '../utils/passwordValidator/passwordValidator';
import { createUserID } from '../utils/createUserID/createUserID';
import AppleStrategy from 'passport-apple';
import jwt, { decode } from 'jsonwebtoken'
import path from 'path';
import logger from './logger';

passport.serializeUser((user:any , done) => {
    done(null,user._id)
})

passport.deserializeUser(async(id:any, done) => {
    let user:any = await getCustomerWithID(id as string)
    user = {...user}
    user._id = user?.user_id
    done(null, user as Express.User)
})

console.log({clientId:process.env.GOOGLE_CLIENT_ID , clientSecret: process.env.GOOGLE_CLIENT_SECRET});


/*=====================================
 *      Google Strategy
 ======================================*/
passport.use( new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: `${process.env.BASE_API_URL}/api/v2/auth/google/redirect`,
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
}, async (accessToken: string, refreshToken: string, profile: Profile, done) => {
    let user:any = await getCustomerWithEmailOrAccountId(profile.id,profile?._json?.email as string)

    if(!user){
        return done(null, false as any, {message: "User account doesn't exist!"})
    }else if(user && !user?.account_id){
        await updateUserInfo({
            account_id: profile?.id as string,
            email: profile?._json?.email as string,
            first_name: (profile?._json?.name as string),
            profile: (profile?._json?.profile as string),
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
    clientID: process.env.FB_APP_ID!,
    clientSecret: process.env.FB_APP_SECRET!,
    callbackURL: `${process.env.BASE_API_URL}/api/v2/auth/facebook/redirect`
}, async (accessToken: string, refreshToken: string, profile: FBProfile, done) => {
    // let user:any = await getCustomerWithEmail(profile?._json?.email as string)
    console.log(profile, 'this is profile');
    

    // if(!user){
    //     user = await createCustomer({
    //         first_name: (profile?._json?.name as string),
    //         profile: (profile?._json?.profile as string),
    //         type: "google",
    //         email: (profile?._json?.email as string)
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
            const isValidPassword = await passwordValidator(password, user?.password as string)
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
    }catch(error:any){
        logger.error(error?.message || error , {meta: {body: email}})
        return done(true, error)
    }
}))

passport.use(new AppleStrategy({
    clientID: process.env.APPLE_CLIENT_ID!,
    teamID: process.env.APPLE_TEAM_ID!,
    keyID: process.env.APPLE_KEY_ID!,
    privateKeyLocation:  "/app/AuthKey.p8",
    callbackURL: `${process.env.BASE_API_URL}/api/v2/auth/apple/redirect`, // Redirect URL
    scope: ['name', 'email'],
    passReqToCallback: true
}, async (req, accessToken, refreshToken, idToken, profile, done) => {

    const decodedToken:any = jwt.decode(idToken);

    let user:any = await getCustomerWithEmailOrAccountId(decodedToken?.sub,decodedToken.email as string)

    if(!user){
        return done(null, false as any, {message: "User account doesn't exist!"})
    }else if(user && !user?.account_id){
        await updateUserInfo({
            email: decodedToken?.sub as string,
            account_id: decodedToken?.sub as string,
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