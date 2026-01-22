
// quick-queue/backend/src/config/db.js
const mongoose = require("mongoose");

const connectDB = async () =>{
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("mongodb connected successfully.");
        
    } catch (error) {
        console.log("error:-",error);
        console.error("mongodb connection failed",error.message);
        process.exit(1);
    }
}
module.exports = connectDB;