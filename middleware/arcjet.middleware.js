import aj from "../config/arcjet.js";
const arcjetMiddleware = async (req, res, next) => {
    try {

        const decision = await aj.protect(req, { requested: 1 }); 
        console.log("Arcjet decision", decision);

        if (decision.isDenied()) {
            if (decision.reason.isRateLimit()) {
                return res.status(429).json({ error: "Too Many Requests" });
            } else if (decision.reason.isBot()) {
                return res.status(403).json({ error: "Bot Detected" });
            } else {
                return res.status(403).json({ error: "Forbidden" });
            }
        }
         
            next();
        
    } catch (err) {
        console.log(`Arcjet Middleware Error: ${err}`);
        next(err);
    }
};

export default arcjetMiddleware;