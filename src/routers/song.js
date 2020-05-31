const express = require('express')
const sharp = require('sharp')
const NodeID3 = require('node-id3')
const multer = require('multer')
const ID3Writer = require('browser-id3-writer');
const auth = require('../middleware/auth')
const Song = require('../models/song')
const User = require('../models/user')
const Image = require('../models/image')


const router = express.Router()


const upload = multer({
    limits: {
        fileSize: 15428000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(mp3|mp4)/)) {
            cb(new Error('Please Upload a valid file'))
        }

        cb(undefined, true)
    }
})


router.post('/songs', auth, upload.single('song'), async (req, res) => {

    try {
        const temp = await Image.findOne()

        let tags = NodeID3.read(req.file.buffer)
        const imageBuffer = tags.image ? await sharp(tags.image.imageBuffer).png().toBuffer() : temp.buffer


        const writer = new ID3Writer(req.file.buffer);
        writer.setFrame('TIT2', `${req.body.title} | benectionz.com`)
            .setFrame('TPE1', [`${req.body.artistName}`, `${req.body.featured}`])
            .setFrame('APIC', {
                type: 3,
                data: temp.buffer,
                description: 'Benedictionz'
            });
        writer.addTag();

        const taggedSongBuffer = Buffer.from(writer.arrayBuffer);


        const song = new Song({...req.body, songBuffer: taggedSongBuffer, imageBuffer, artist: req.user._id})

        song.approved = false
        song.promoted = false


        await song.save()
        const seoTitle = `${(song.title + ' by ' + song.artistName).replace(/ /g, '-')}`

        song.seoTitle = seoTitle
        await song.save()
        res.status(201).send(song)
    } catch (error) {
        console.log(error.message)
        res.status(500).send(error.message)
    }

})

router.post('/songs/rate/:id', auth, async (req, res) => {
    try {
        const ratedSong = req.params.id
        const song = await Song.findById(ratedSong)

        if (!song) {
            return res.status(400).send()
        }

        let rating = req.body.rating;

        if (song.rateCount !== 0) {
            rating = ((song.rating * song.rateCount) + rating) / (song.rateCount + 1)
        }

        song.rating = rating
        song.rateCount += 1;

        song.raters = song.raters.concat({rater: req.user._id})
        await song.save()

        res.send(false)
    } catch (error) {
        console.log(error.message)
        res.status(500).send()
    }
})

router.get('/songs/can-rate/:id', auth, async (req, res) => {
    const songId = req.params.id

    const song = await Song.findById(songId)

    if (!song) {
        return res.status(400).send({error: 'song not found'})
    }

    const song1 = await Song.findOne({_id: songId, 'raters.rater': req.user._id})
    let canRate = false;
    if (!song1) {
        canRate = true
    }
    res.send(canRate)
})

router.get('/songs/:id', async (req, res) => {
    const songId = req.params.id
    try {
        const song = await Song.findById(songId)
        if (!song) {
            return res.status(401).send()
        }

        res.send(song)
    } catch (error) {
        res.status(500).send()
    }
})


router.get('/songs/:id/:download', async (req, res) => {
    try {
        const song = await Song.findById(req.params.id)
        if (!song) {
            return res.status(404).send()
        }


        let attachment = 'attachment;'
        if (req.params.download === 'song') {
            attachment = ''
        } else {
            song.hits += 1;
            await song.save();
        }


        const filename = `${song.artistName} ${song.featured !== '' ? '-ft ' + song.featured : ''}- ${song.title}| Benedictions.com${song.audio ? '.mp3' : '.mp4'}`
        song.audio ? res.set('Content-Type', 'audio/mpeg') : res.set('Content-Type', 'video/mp4')
        res.set('Content-Disposition', `${attachment} filename=${filename}`)
        res.send(song.songBuffer)
    } catch (error) {
        res.status(500).send(error.message)
    }
})

router.get('/search/:searchTerm/', async (req, res) => {
    try {
        const songs = await Song.fuzzySearch({query: req.params.searchTerm, prefixOnly: true})


        if (req.query['just-search']) {
            const songsNames = songs.map(song => {
                return song.title + ' by ' + song.artistName
            })
            return res.send(songsNames)
        }

        return res.send(songs)
    } catch (error) {
        console.log(error)
        res.send(error.message)
    }
})

router.get('/images/:id', async (req, res) => {
    const song = await Song.findById(req.params.id)
    if (!song) {

        return res.status(404).send()
    }


    res.set('Content-Type', 'image/png')
    res.status(200).send(song.imageBuffer)
})


router.get('/songs', async (req, res) => {

    const searchCriteria = {}
    const sort = {}

    const queryOptions = ['artist', 'genre', 'rating']


    if (req.query.sortBy) {
        const sortingQuery = req.query.sortBy.split(':')
        sort[sortingQuery[0]] = sortingQuery[1] === 'desc' ? -1 : 1
    }


    queryOptions.forEach(query => {
        if (req.query[query])
            searchCriteria[query] = req.query[query]
    })


    try {
        const songs = await Song.find(searchCriteria).setOptions({
            limit: parseInt(req.query.limit),
            skip: parseInt(req.query.skip),
            sort
        })
        if (!songs) {
            return res.status(401).send()
        }

        res.send(songs)
    } catch (error) {
        res.status(500).send()
    }
})
//for some reason /songs/* doesn't work
router.get('/mysongs', auth, async (req, res) => {


    const match = {}
    const sort = {}
    const queryOptions = ['rating', 'genre', 'audio']

    if (req.query.sortBy) {
        const sortParams = req.query.sortBy.split(':')

        sort[sortParams[0]] = sortParams[1] === 'desc' ? -1 : 1
    }

    queryOptions.forEach(query => {
        if (req.query[query])
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

        if (!req.user.songs) {
            return res.status(404).send()
        }
        res.send(req.user.songs)


    } catch (error) {
        res.status(500).send({error: error.message})
    }
})

router.patch('/songs/:id', auth, async (req, res) => {
    const songId = req.params.id
    try {
        const song = await Song.findOne({_id: songId, artist: req.user._id})
        if (!song) {
            return res.status(401).send()
        }


        const allowedUpdates = ['title', 'rating', 'hits', 'description', 'lyrics', 'artistName', 'featured', 'genre']
        const updates = Object.keys(req.body)

        const isValidUpdate = updates.every(update => {
            return allowedUpdates.includes(update)
        })

        if (!isValidUpdate) {
            return res.status(400).send()
        }
        updates.forEach(update => {
            song[update] = req.body[update]
        })

        await song.save()

        res.send(song)


    } catch (error) {
        res.status(500).send()
    }
})

router.delete('/songs/:id', auth, async (req, res) => {
    const songId = req.params.id
    try {
        const song = await Song.findOne({_id: songId, artist: req.user._id})


        if (!song) {
            return res.status(401).send()
        }
        await song.delete()

        res.send()
    } catch (error) {
        res.status(500).send(error.message)
    }
})


module.exports = router