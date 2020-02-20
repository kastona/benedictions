const express = require('express')
const auth = require('../middleware/auth')

const router = express.Router()

const Song = require('../models/song')


router.post('/songs', auth, async (req, res) => {
    const song = new Song(req.body)
    song.artist = req.user._id
    try {
        await song.save()
        res.status(201).send(song)
    }catch(error) {
        res.status(500).send()
    }

})

router.get('/songs/:id', auth, async (req, res) => {
    const songId = req.params.id
    try {
        const song = await Song.findById(songId)
        if(!song) {
            return res.status(401).send()
        }
        res.send(song)
    }catch(error) {
        res.status(500).send()
    }
})

router.patch('/songs/:id', auth, async (req, res) => {
    const songId = req.params.id
    try{
        const song = await Song.findOne({_id: songId, artist: req.user._id})
        if(!song) {
            return res.status(401).send()
        }


        const allowedUpdates = ['title', 'rating', 'hits', 'genre']
        const updates = Object.keys(req.body)

        const isValidUpdate = updates.every(update => {
            return allowedUpdates.includes(update)
        })

        if(!isValidUpdate) {
            return res.status(400).send()
        }
        updates.forEach(update => {
            song[update] = req.body[update]
        })

        await song.save()

        res.send(song)


    }catch(error) {
        res.status(500).send()
    }
})

router.delete('/songs/:id', auth, async (req, res) => {
    const songId = req.params.id
    try {
        const song = Song.findOne({_id: songId, artist: req.user._id})


        if(!song) {
            return res.status(401).send()
        }
        await song.delete()

        res.send()
    }catch(error) {
        res.status(500).send()
    }
})


module.exports = router