import { Router } from "express";
import { upload } from "../../index";
import { byUsername, getUser, updateUser } from "../../utils/users";
import { readFileSync, unlinkSync } from "fs";
import { log, sendEmail } from "../../utils/functions";

const router = Router();

router.get("/", async (req, res) => {
    const user = await getUser(req.user as string, { projection: { password: 0 } });

    console.log(user);

    res.send(user);
});
router.get("/avatar", async (req, res) => {
    const user = await getUser(req.user as string, { projection: { avatar: 1 } });

    res.send(user?.avatar!);
});

router.post("/update/avatar", async (req, res) => {
    upload(req, res, async (err: any) => {
        if (err) {
            console.log(err);
            throw new Error("ADDING DISH");
        }
        let image = null;
        let path = null
        if (req.file) {
            path = `${process.cwd()}/uploads/${req.file.filename}`;
            image = readFileSync(path);
        }

        const result = await updateUser(
            req.user as string,
            {
                $set: {
                    avatar: image
                }
            }
        );

        if(result.modifiedCount > 0) {
            log("success", "updating avatar");
        } else {
            log('failed', "updating avatar");
        }
     
        res.send({ image: image });

        if (path) {
            unlinkSync(path);
        }
    });
});
router.post("/update/username", async (req, res) => {
    const { username } = req.body;

    const format = /[!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?" +"]/;

    if(format.test(username) && !await byUsername(username, { projection: { _id: 1 } })) {
        return res.send(false);
    }

    const result = await updateUser(
        req.user as string,
        { $set: {
            username
        } }
    );

    if(result.modifiedCount > 0) {
        log("success", "updating username");
    } else {
        log("failed", "updating username");
    }

    res.send(result.modifiedCount > 0);
});
router.post("/update/name", async (req, res) => {
    const { name } = req.body;

    const update = updateUser(req.user as string, { $set: { name: name.length == 0 ? null : name } });

    res.send({ error: (await update).modifiedCount > 0 ? "none" : "no" });
});
router.post("/check", async (req, res) => {
    const { username } = req.body;

    const format = /[!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?" +"]/;

    if(format.test(username)) {
        return res.send(false);
    }

    const result = await byUsername(username, { projection: { _id: 1 } });

    res.send(!!result);
});

export {
    router as AccountRouter
}