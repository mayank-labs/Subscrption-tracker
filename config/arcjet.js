import arcjet, { shield, detectBot, tokenBucket } from "@arcjet/node";
import { ARCJET_KEY } from "./env.js";

const aj = arcjet({
    key: ARCJET_KEY,
    rules: [
        shield({ mode: "LIVE" }),
        detectBot({
            mode: "LIVE",
            allow: [
                "CATEGORY:SEARCH_ENGINE,POSTMAN",
            ],
        }),
        tokenBucket({
            mode: "LIVE",

            refillRate: 1,
            interval: 5,
            capacity: 5,
        }),
    ],
});

export default aj;