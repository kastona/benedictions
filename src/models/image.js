const mongoose = require('mongoose')

const imageSchema = new mongoose.Schema({

    buffer: {
        type: Buffer,
    },
    dummy: {
        type: Boolean,
        default: true,
        required: true
    }
}, {
    timestamps: true
})

const Image = mongoose.model('Image', imageSchema)

module.exports = Image



