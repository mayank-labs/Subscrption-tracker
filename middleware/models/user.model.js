import mongoose from "mongoose";

const usserSchema = new mongoose.Schema({
    name: {
        type : String,
        required : [true, "Name is required"],
        trim : true,
        minlength : 3,
        maxlength : 50
    },
    email: {
        type : String,
        required : [true, "Email is required"],
        unique : true,
        trim : true,
        lowercase : true,
        match : [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please fill a valid email address"]
    },
    password: {
        type : String,
        required : [true, "Password is required"],
        minlength : 6
    }
}, { timestamps: true });

const user = mongoose.model("User", usserSchema);

export default user;