const mongoose = require('mongoose')

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true,
    },
    venue: {
        type: String,
        required: true,
    },
    when: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
})

const Event = mongoose.model('Event', eventSchema)

module.exports = Event



