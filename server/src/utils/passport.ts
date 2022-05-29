import { compare } from "./functions";
import { byUsername } from "./users";

async function passportFunction(username: string, password: string, done: Function) {

    const user = await byUsername(username, { projection: { password: 1 } });

    if(!user) {
        return done(null, false, { error: "username" });
    }

    if(compare(password, user.password!)) {
        return done(null, { username, _id: user._id!.toString() });
    } else {
        return done("unauthorized access", false, { error: "password" });
    }
}


export {
    passportFunction
}