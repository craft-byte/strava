import { Restaurant, User } from "./general";

interface Locals {
    user: User;
    restaurant: Restaurant;
    stripeAccountId: string;
}

type StripeOrderMetadata = {
    by: "customer" | "staff";
    orderId: string;
    restaurantId: string;
}

export {
    Locals,
    StripeOrderMetadata,
}