import { StringMapWithRename } from "@angular/compiler/src/compiler_facade_interface";

interface NewUser {
    username: string;
    password: string;
    email: string;
}

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

interface Payments {
    types: ("only-card" | "only-cash" | "all" | "self-card" | "self-cash" | "self-all" | "self-all" | "everything")[];
}

interface Restaurant {
    name: string;
    sname: string;
    _id: string;
}
interface Restaurant2 {
    name: string;
    workers: { _id: string }[];
    invitations: string[];
    _id: string;
}

export {
    NewUser,
    Restaurant2,
    User,
    PostResult,
    UserInfo,
    LoginData,
    Restaurant,
    Payments,
    NewRestaurant,
    UserResponse
}