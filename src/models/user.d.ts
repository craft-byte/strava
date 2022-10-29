
interface User {
    email?: string;
    avatar?: any;
    name: {
        first: string;
        last: string;
        
    }
    _id?: string;
    restaurants?: string[];
    name?: string;
    changedAvatar?: boolean;
}



export {
    User,
}