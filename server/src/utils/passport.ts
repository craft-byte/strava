import { compare } from "./functions";
import { byUsername } from "./users";

async function passportFunction(username: string, password: string, done: Function) {

    const user = await byUsername(username, { projection: { password: 1 } });

    if(!user) {
        return done(null, null);
    }

    if(compare(password, user.password!)) {
        return done(null, { username, _id: user._id!.toString() });
    } else {
        return done("no access", null);
    }
}


export {
    passportFunction
}