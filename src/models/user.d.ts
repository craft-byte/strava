interface UserResponse {
    acknowledged: boolean;
    error?: string;
}


interface User {
    username?: string;
    password?: string;
    email?: string;
    avatar?: string;
    works: string[];
    _id?: string;
    phone?: string;
    restaurants?: string[];
    invitations?: string[];
    name?: string;
    feedbacks?: Feedback[];
}

interface Feedback {
    worked: number;
    role: string;
    restaurant: string;
    feedback: {
        comment: string;
        stars: number;
    }
}
interface ConvertedFeedback {
    worked: string;
    role: string;
    restaurant: string;
    comment: string;
    stars: number;
}

interface PostResult {
    acknowledged: boolean;
    info?: string;
    insertedId?: string;
}

interface UserInfo {
    username: string;
    restaurants: Restaurant[];
    invites?: string[];
    _id?: string;
    works?: string[];
    password?: string;
    name?: string;
}

interface LoginData {
    username: string;
    password: string;
}

interface NewRestaurant extends Payments {
    name: string;
    sname: string;
    kitchenPassword: string;
    adminPassword: string;
}


type Payments = ("only-card" | "only-cash" | "all" | "self-card" | "self-cash" | "self-all" | "self-all" | "everything")[];



interface UserInvitation {
    restaurant: string;
    restaurantId: string;
    role: string;
    joined: string;
    _id: string;
}




export {

    UserInvitation,



    Restaurant2,
    User,
    PostResult,
    UserInfo,
    LoginData,
    Restaurant,
    Payments,
    NewRestaurant,
    UserResponse,
    ConvertedFeedback,
    Feedback
}