const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportlocalMongoose = require('passport-local-mongoose');
const userSchema = new Schema({
    username: {
        type: String,
        required: [true, "email cant be blank"],
        unique: true
    }
});

userSchema.plugin(passportlocalMongoose); //adds passprod
module.exports = mongoose.model('User', userSchema);