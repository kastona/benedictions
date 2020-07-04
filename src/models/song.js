const mongoose = require('mongoose')
const mongooseFuzzySearching = require('mongoose-fuzzy-searching')

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
    rateCount: {
      type: Number ,
      default: 0
    },
    hits: {
        type: Number,
        default:0
    },

    artUrl: {
      type: String,
      required: true
    },
    songUrl: {
        type: String,
        required: true
    },

    artId: {
        type: String,
        required: true
    },
    artist: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },

    raters: [
        {
            rater: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }

        }
    ],
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
    cloudinaryId: {
        type: String,
        required: true
    },
    track: {
        type: Number
    },
    audio: {
        type: Boolean,
        required: true,
        default: true
    },
    approved: {
        type: Boolean,
        required: true,
        default: false
    },
    genre: {
      type: String,
        default: 'Not Specified'
    },
    promoted: {
        type: Boolean,
        default: false
    }
},{timestamps: true})

songSchema.methods.toJSON = function () {
    const song = this
    const songObject = song.toObject()
    delete songObject.imageBuffer

    return songObject
}


songSchema.plugin(mongooseFuzzySearching, { fields: ['title', 'artistName', 'featured', 'lyrics'] })



const Song = mongoose.model('Song', songSchema)

module.exports = Song