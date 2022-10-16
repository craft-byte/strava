import { join } from "path";
import { readFileSync } from "fs";
import * as jsonwebtoken from "jsonwebtoken";



const pathToKey = join(__dirname, "..", "..", "keys", "id_rsa_pub.pem");
const pathToKeyPrivate = join(__dirname, "..", "..", "keys", "id_rsa_priv.pem");

const PUB_KEY = readFileSync(pathToKey, "utf8");
export const PRIV_KEY = readFileSync(pathToKeyPrivate, "utf8");


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
        token: signedToken.toString(),
        expires: expiresIn,
    };
}

export function createJWT(data: { [key: string]: string; }, exp: number) {
    const payload = {
        ...data,
        iat: Date.now(),
    };

    const signedToken = jsonwebtoken.sign(payload, PRIV_KEY, {
        expiresIn: exp,
        algorithm: "RS256",
    });

    return signedToken;
}