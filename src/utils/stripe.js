import Stripe from "stripe";
export const stripe = new Stripe(process.env.PAYMENT_GATEWAY_KEY);
