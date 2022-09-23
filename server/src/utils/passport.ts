import { compare } from "./functions";
import { byUsername, getUserByEmail, user } from "./users";
import { ExtractJwt, StrategyOptions, Strategy as JwtStrategy } from "passport-jwt";
import { join } from "path";
import { readFileSync } from "fs";
import * as jsonwebtoken from "jsonwebtoken";


// function a () {
//     const resutl = jsonwebtoken.verify("", "");
// }


async function passportFunction(email: string, password: string, done: Function) {

    const user = await getUserByEmail(email, { projection: { password: 1 } });

    if (!user) {
        return done(null, null);
    }

    if (compare(password, user.password!)) {
        return done(null, { _id: user._id!.toString() });
    } else {
        return done("no access", null);
    }
}



const pathToKey = join(__dirname, "..", "..", "keys", "id_rsa_pub.pem");
const pathToKeyPrivate = join(__dirname, "..", "..", "keys", "id_rsa_priv.pem");

const PUB_KEY = readFileSync(pathToKey, "utf8");
export const PRIV_KEY = readFileSync(pathToKeyPrivate, "utf8");

// const options: StrategyOptions = {
//     jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//     secretOrKey: PUB_KEY,
//     algorithms: ["RS256"],
// };

export function issueJWT(userId: string) {
    const _id = userId;

    const expiresIn = 6000000;

    const payload = {
        userId: _id,
        iat: Date.now(),
    };

    const signedToken = jsonwebtoken.sign(payload, PRIV_KEY, {
        expiresIn: expiresIn,
        algorithm: "RS256",
    });

    return {
        token: "Bearer " + signedToken,
        expires: expiresIn,
    };
}



export {
    passportFunction
}