import { Router } from "express";
import { id, makePassword, sendEmail } from "../../utils/functions";
import { issueJWT, PRIV_KEY } from "../../utils/passport";
import { getUser, updateUser, updateUsers, user } from "../../utils/users";
import * as jsonwebtoken from "jsonwebtoken";
import * as crypto from "crypto";

const router = Router();



/**
 * 
 * sends code to email
 * 
 * @param { string } email - email to reset the password
 * 
 * 
 * code is saved in user object in mongodb
 * 
 * @returns { success: boolean; }
 * 
 * @throws { status: 403; reason: "UnknownEmailAddress" } - email address is not registered
 * 
 */
router.post("/send-code", async (req, res) => {
    const { email } = req.body;


    const code = Math.floor(100000 + Math.random() * 900000);


    const update = await updateUser({ email }, { $set: { "security.code": code.toString() } });


    if(update.ok != 1 || !update.user) {
        return res.status(403).send({ reason: "UnknownEmailAddress" });
    }

    const message = await sendEmail(email, "Strava Email Confirmation",
        `
        Hello from Strava. Use this code to confirm an action on Strava platform, please don't share this code with anybody.
        Code: ${code}
        `
    );


    const token = issueJWT(update.user._id.toString());

    await updateUser({ email }, { $set: { "security.codeToken": token.token } });

    res.send({ success: true, token: token.token });
});


/**
 * checks if token is valid
 * 
 * @param { string } token
 * 
 * @throws { status: 422; reason: "InvalidToken" } - token is invalid
 * @throws { status: 403; reason: "TokenExpired" } - token is expired
 * @throws { status: 403; reason: "InvalidError" } - either user doesn't exist or user doesn't have codeToken property
 * 
 * @returns { success: boolean; }
 * 
 */
router.post("/check", async (req, res) => {
    const { token } = req.body;

    if(!token || typeof token != "string") {
        return res.status(422).send({ reason: "InvalidToken" });
    }

    const data: { userId: string; iat: number; exp: number; } = jsonwebtoken.verify(token, PRIV_KEY, { algorithms: ["RS256"] }) as any;

    if (Date.now() > data.exp) {
        return res.status(403).send({ reason: "TokenExpired" });
    }

    if (!data.userId) {
        return res.status(422).send({ reason: "InvalidToken" });
    }

    const user = await getUser(data.userId, { projection: { security: { codeToken: 1 } } });

    if(!user || !user.security?.codeToken) {
        return res.status(403).send({ reason: "InvalidError" });
    }

    
    res.send({ success: true });
});



/**
 * confirms password for email
 * 
 * @param { string } token - token saved at POST /send-code
 * @param { string } code - 6 length string code sent to email
 * 
 * @throws { status: 422; reason: "InvalidToken" } - invalid token
 * @throws { status: 422; reason: "InvalidCode" } - invalid code
 * @throws { status: 403; reason: "TokenExpired" } - token expired
 * @throws { status: 403; reason: "InvalidError" } - something else
 * @throws { status: 403; reason: "IncorrectCode" } - code is incorrect
 * 
 * 
 * @returns { token: string; } - created token
 */
router.post("/confirm-code", async (req, res) => {
    const { token, code } = req.body;

    if(!token || typeof token != "string") {
        return res.status(422).send({ reason: "InvalidToken" });
    } else if(!code || typeof code != "string" || code.length != 6) {
        return res.status(422).send({ reason: "InvalidCode" });
    }

    const data: { userId: string; iat: number; exp: number; } = jsonwebtoken.verify(token, PRIV_KEY, { algorithms: ["RS256"] }) as any;

    if (Date.now() > data.exp) {
        return res.status(403).send({ reason: "TokenExpired" });
    }

    if (!data.userId) {
        return res.status(422).send({ reason: "InvalidToken" });
    }

    const user = await getUser(data.userId, { projection: { security: { code: 1 } } });

    if(!user) {
        return res.status(403).send({ reason: "InvalidError" });
    }

    if(user.security?.code != code) {
        return res.status(403).send({ reason: "IncorrectCode" });
    }

    const update = await updateUser({ _id: id(data.userId) }, { $set: { "security.code": null!, } });


    res.send({ success: update.ok == 1 });
});



/**
 * 
 * @param { string } token - token
 * @param { string } password - 8 or more char string password
 * 
 * @throws { status: 422; reason: "InvalidToken" } - invalid token
 * @throws { status: 422; reason: "InvalidPassword" } - invalid password
 * @throws { status: 403; reason: "TokenExpired" } - invalid password
 * 
 * @returns { success: boolean; }
 */
router.post("/password", async (req, res) => {
    const { token, password } = req.body;


    if(!token || typeof token != "string") {
        return res.status(422).send({ reason: "InvalidToken" });
    } else if(!password || typeof password != "string" || password.length < 8) {
        return res.status(422).send({ reason: "InvalidPassword" });
    }

    let data: { userId: string; iat: number; exp: number; };

    try {
        data = jsonwebtoken.verify(token, PRIV_KEY, { algorithms: ["RS256"] }) as any;

        if (Date.now() > data.exp) {
            return res.status(403).send({ reason: "TokenExpired" });
        }

        if (!data.userId) {
            return res.status(422).send({ reason: "InvalidToken" });
        }
    } catch (e) {
        return res.status(422).send({ reason: "InvalidToken" });
    }


    const newPassword = makePassword(password);


    const update = await updateUser({ _id: id(data.userId) }, { $set: { password: newPassword! } });


    res.send({ success: update.ok == 1 });
});



export {
    router as ResetRouter
}