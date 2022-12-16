import { User } from "./general";
import { Restaurant } from "./Restaurant";

interface Locals {
    user: User;
    restaurant: Restaurant;
    stripeAccountId: string;
}

type StripeOrderMetadata = {
    by: "customer" | "staff";
    sessionId: string;
    restaurantId: string;
}

export {
    Locals,
    StripeOrderMetadata,
}