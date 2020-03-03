const express = require('express')
const multer = require('multer')
const auth = require('../middleware/auth')
const Song = require('../models/song')
const User = require('../models/user')



const router = express.Router()




const upload = multer({
    limits: {
        fileSize: 15428000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(mp3|mp4)/)) {
            cb(new Error('Please Upload a valid file'))
        }

        cb(undefined, true)
    }
})



router.post('/songs', auth,upload.single('song'), async (req, res) => {


    const song = new Song({...req.body, songBuffer: req.file.buffer, artist: req.user._id})



    try {
        await song.save()
        res.status(201).send(song)
    }catch(error) {
        res.status(500).send(error.message)
    }

})



router.get('/songs/:id', async (req, res) => {
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



router.get('/songs/:id/:download', async (req, res) => {
    try {
        const song = await Song.findById(req.params.id)
        if(!song) {
            return res.status(404).send()
        }


        const artist = await User.findById(song.artist)

        let attachment = 'attachment;'
        if(req.params.download === 'song') {
            attachment = ''
        }


        const filename = `${artist.name}-ft-${song.featured}--${song.title}| Benedictions ${song.audio? '.mp3': '.mp4'}`


        song.audio? res.set('Content-Type', 'audio/mpeg'): res.set('Content-Type', 'video/mp4')
        res.set('Content-Disposition', `${attachment} filename=${filename}`)
        res.send(song.songBuffer)
    }catch(error) {
        res.status(500).send(error.message)
    }
})


router.get('/songs', async (req, res) => {

    const searchCriteria = {}
    const sort= {}

    const queryOptions = ['artist', 'genre', 'rating']


    if(req.query.sortBy) {
        const sortingQuery = req.query.sortBy.split(':')
        sort[sortingQuery[0]] = sortingQuery[1] === 'desc'? -1: 1
    }



    queryOptions.forEach(query => {
        if(req.query[query])
            searchCriteria[query] = req.query[query]
    })


    try {
        const songs = await Song.find(searchCriteria).setOptions({
            limit: parseInt(req.query.limit),
            skip: parseInt(req.query.skip),
            sort
        })
        if(!songs) {
            return res.status(401).send()
        }

        res.send(songs)
    }catch(error) {
        res.status(500).send()
    }
})
//for some reason /songs/* doesn't work
router.get('/mysongs',auth, async (req, res) => {


    const match= {}
    const sort = {}
    const queryOptions = ['rating', 'genre']

    if(req.query.sortBy) {
        const sortParams = req.query.sortBy.split(':')

        sort[sortParams[0]] = sortParams[1] === 'desc'? -1:1
    }

    queryOptions.forEach(query => {
        if(req.query[query])
            match[query] = req.query[query]
    })

    try {

        await req.user.populate({
            path: 'songs',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()

        if(!req.user.songs) {
            return res.status(404).send()
        }
        res.send(req.user.songs)


    }catch(error) {
        res.status(500).send({error: error.message})
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
        const song = await Song.findOne({_id: songId, artist: req.user._id})


        if(!song) {
            return res.status(401).send()
        }
        await song.delete()

        res.send()
    }catch(error) {
        res.status(500).send(error.message)
    }
})


module.exports = router