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
        type: Number,
        default:0
    },
    genre: {
        type: String,
        trim: true
    },
    songBuffer: {
        type: Buffer
    },
    imageBuffer: {
        type: Buffer
    },
    artist: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    artistName: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    lyrics: {
        type: String
    },
    featured: {
        type: String,
        trim: true
    },
    seoTitle: {
        type: String,
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
    delete songObject.imageBuffer

    return songObject
}



const Song = mongoose.model('Song', songSchema)

module.exports = Song