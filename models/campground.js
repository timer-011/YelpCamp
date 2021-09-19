const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./review')
const CampgroundSchema = new Schema({
    title: String,
    price: Number,
    description: String,
    location: String,
    image: {
        type: String,
        default: 'https://source.unsplash.com/user/erondu/1600x900'
    },

    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ],

    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

module.exports = mongoose.model('Campground', CampgroundSchema);