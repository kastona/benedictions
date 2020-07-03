const mongoose = require('mongoose')

const beneSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true,
        default: 'Benedictionz',
        trim: true
    },
    welcome: {
        type: String,
        required: true,
        default: 'Your Favourite Music Platform. Enriching Lives Through Music',
        trim: true
    },
    contactMessage: {
        type: String,
        required: true,
        default: 'Benedictionz is both a media production and promotion company. Dealing with contents that enriches lives. ' +
            'Thank you as you partner with us',
        trim: true
    }


}, {
    timestamps: true
})

const Bene = mongoose.model('Bene', beneSchema)

module.exports = Bene



