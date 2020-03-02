const mongoose = require('mongoose')

const songSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    length: {
        type: Number
    },
    rating: {
        type: Number,
        validate(rating) {
            if(rating < 1 || rating > 5) {
                throw new Error('Invalid rating')
            }
        }
    },
    hits: {
        type: Number
    },
    genre: {
        type: String,
        trim: true
    },
    songBuffer: {
        type: Buffer
    },
    artist: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    featured: {
        type: String,
        trim: true
    },
    album: {
        type: String,
        trim: true
    },
    track: {
        type: Number
    },
    audio: {
        type: Boolean,
        required: true,
        default: true
    }
},{timestamps: true})

songSchema.methods.toJSON = function () {
    const song = this
    const songObject = song.toObject()
    delete songObject.songBuffer

    return songObject
}



const Song = mongoose.model('Song', songSchema)

module.exports = Song