const Song = require('../models/song')

const rate = async (req, res, next) => {
    try {
        const song = await Song.findOne({_id: userID, 'ratedSongsIds.id': songID})

        if(song) {
            throw new Error('Song already rated by user!')
        }
        next()
    }catch (error) {
        res.status(401).send({error: 'Please authenticate properly'})
    }
}

module.exports = auth
