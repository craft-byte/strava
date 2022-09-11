
interface User {
    username?: string;
    password?: string;
    email?: string;
    avatar?: any;
    works: string[];
    _id?: string;
    phone?: string;
    restaurants?: string[];
    invitations?: any[];
    name?: string;
    feedbacks?: Feedback[];
}

interface LoginData {
    username: string;
    password: string;
}


interface UserInvitation {
    restaurant: string;
    restaurantId: string;
    role: string;
    date: string;
    _id: string;
}



export {
    UserInvitation,
    User,
    LoginData,
}