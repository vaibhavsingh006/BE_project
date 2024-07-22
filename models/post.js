const mongoose = require("mongoose");

const postSchema = mongoose.Schema({
    content: String,
    date: {
        type: Date,
        default: Date.now
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        }
    ],
    user: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        }
    ],
});

module.exports = mongoose.model("post", postSchema);
