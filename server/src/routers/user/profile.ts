import { Router } from "express";
import { Locals } from "../../models/other";
import { compare, makePassword, sendEmail } from "../../utils/functions";
import { logged } from "../../utils/middleware/logged";
import { bufferFromString } from "../../utils/other";
import { updateUser } from "../../utils/users";

const router = Router();



interface Profile {
    email: string;
    name: { first: string; last: string; };
    avatar: any;
    anon: boolean;
}
/**
 * 
 * USER PROFILE
 * 
 * -email
 * -name
 * -avatar
 * -orders amount
 * -spendings amount
 * 
 * user in profile.page and settings.page
 * 
 */
router.get("/", logged({ projection: { email: 1, name: 1, avatar: { binary: 1 }, status: 1, anonymously: 1 } }), async (req, res) => {
    const { user } = res.locals as Locals;
    
    const result: Profile = {
        email: user.email!,
        name: user.name!,
        avatar: user.avatar?.binary,
        anon: user.anonymously!
    };


    res.send(result);
});


/**
 * 
 * @throws { status: 422 } - if types are incorrect
 * 
 */
router.post("/update", logged({ projection: { _id: 1, } }), async (req, res) => {
    const { anon, name: { first, last }, avatar } = req.body;
    const { user: { _id } } = res.locals as Locals;


    if(!first || !last || typeof first != "string" || typeof last != "string" || typeof anon != "boolean") {
        return res.sendStatus(422);
    }


    if(avatar) {

        const binaryAvatar = bufferFromString(avatar);

        if(binaryAvatar) {
            const update = await updateUser(_id, { $set: { name: { first, last }, anonymously: anon, avatar: { binary: binaryAvatar, modified: Date.now() } } }, { projection: { _id: 1 } });
    
            return res.send({ success: update.ok == 1 });
        }

    }
    
    const update = await updateUser(_id, { $set: { name: { first, last }, anonymously: anon } }, { projection: { _id: 1 } });
    
    res.send({ success: update.ok == 1 });
    

});



/**
 * 
 * @param {string} currentPassword
 * @param {string} newPassword
 * 
 * @returns { success: boolean }
 * 
 * @throws { status: 422; } - wrong password
 * 
 * @throws { status: 422; reason: "CurrentPasswordInvalid" } - current password is less than 8 characters
 * @throws { status: 422; reason: "NewPasswordInvalid" } - new password is less than 8 characters
 * @throws { status: 403; reason: "PasswordIncorrect" } - wrong password
 * 
 * 
 */
router.post("/password", logged({ projection: { _id: 1, password: 1, email: 1 } }), async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const { user } = res.locals as Locals;

    if(!currentPassword || !newPassword || typeof currentPassword != "string" || typeof newPassword != "string") {
        return res.sendStatus(422);
    }
    if(currentPassword.length < 8) {
        return res.status(422).send({ reason: "CurrentPasswordInvalid" });
    } else if(newPassword.length < 8) {
        return res.status(422).send({ reason: "NewPasswordInvalid" });
    }

    const same = compare(currentPassword, user.password!);
    
    if(!same) {
        return res.status(403).send({ reason: "PasswordIncorrect" });
    }

    const hash = makePassword(newPassword);


    const update = await updateUser(user._id, { $set: { password: hash! } });

    res.send({ success: update.ok == 1 });

    sendEmail(user.email!, "Password Changed", 
    `
        ${user.email} account's password has just been changed. If it was not you please contact us immediately.
    `
    );
});

export {
    router as ProfileRouter
}