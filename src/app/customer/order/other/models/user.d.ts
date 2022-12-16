interface User {
    _id: string;
    avatar: any;
    name: {
        first: string;
        last: string;
    };
}

type UserStatus = "loggedin" | "loggedout" | "noinfo";

export {
    UserStatus,
    User
}