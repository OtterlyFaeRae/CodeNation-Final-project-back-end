const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true
    }, 
    email: {
        type: String,
        unique: true,
        required:true
    },
    pass: {
        type: String,
        required: true
    },
    cash: {
        type: Number,
        required: true,
        default: 5000
    }, 
    stocks: [],
    history: []
});

const User = mongoose.model('user', userSchema);

module.exports = User
