import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    name : {
        type : String,
         required : [true, "Subscription name is required"],
         trim : true,
            minlength : 2,  
            maxlenghth : 100
    },
    price : {
        type : Number,
        required : [true, "Subscription price is required"],
        min : [0, "Price cannot be negative"],
        max : [10000, "Price cannot exceed 10000"]
    },
    currency : {
        type : String,
        enum : ["USD", "EUR", "INR", "GBP", "AUD", "CAD", "JPY"],
        default : "USD"
    },
    frequency : {
        type : String,
        enum : ["Monthly", "Yearly", "Weekly", "Daily"]
    },
    categor : {
        type : String,
        enum : ["Entertainment", "Productivity", "Education", "Health", "Other"],
        default : "Other",
        required : true,
    },
    paymentMethod : {
        type : String,
        enum : ["Credit Card", "Debit Card", "PayPal", "Bank Transfer", "Other"],
        trim : true,
        required : true,
    },
    startDate : {
        type : Date,
        required : [true, "Start date is required"],
        validate : {
            validator : function(value) {
                return value <= new Date();
            }
        }
    },
    renwalDate : {
        type : Date,
        validate : {
            validator : function(value) {
                return value > this.startDate;
            }
        }
    },
    user: {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true,
        index : true
    }
    
}, { timestamps: true });

subscriptionSchema.pre('save', function(next) {
    if (!this.renwalDate) {
        const renwalPeriod = {
            'Daily': 1,
            'Weekly': 7,
            'Monthly': 30,  
            'Yearly': 365
        };this.
        this.renewalDate.setDate(this.renewalDate.getDate() + renwalPeriod[this.frequency]);
    }
    if (this.renwalDate <= this.startDate) {
        return next(new Error("Renewal date must be after start date"));
    }
    next();
});

const Subscription = mongoose.model("Subscription", subscriptionSchema);    
export default Subscription;