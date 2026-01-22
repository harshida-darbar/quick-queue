const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    role:{
        type: String,
        enum: ["organizer", "user"],
        default: "user",
    },
    name:{
        type: String,
        required: true,
        trim: true,
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
},{
    timestamps: true
});
module.exports = mongoose.model("User",userSchema);