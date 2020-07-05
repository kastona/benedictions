const express = require('express')
const sharp = require('sharp')
const NodeID3 = require('node-id3')
const multer = require('multer')
const cloudinary = require('cloudinary').v2
const fs = require('fs')
const { promisify } = require('util')
const unlinkAsync = promisify(fs.unlink)
const auth = require('../middleware/auth')
const Song = require('../models/song')
const User = require('../models/user')
const Image = require('../models/image')


const router = express.Router()



cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret
});


const upload = multer({
    limits: {
        fileSize: 6000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(mp3|mp4|jpeg|jpg|png)/)) {
            cb(new Error('Please Upload a valid file'))
        }

        cb(undefined, true)
    },

    storage: multer.diskStorage({
        destination: 'temp',
        filename: function (req, file, cb) {
            cb(null, file.originalname + '-' + Date.now())
        }
    })
})


router.post('/songs', auth, upload.array('songs',2), async (req, res) => {

    try {

        let artFile = req.files[1], songFile = req.files[0];


        if(songFile.mimetype === 'audio/mp3') {
            const temp = await Image.findOne({dummy: false})
            let tags = {
                title: req.body.title + '| Benedictionz.com',
                artist: req.body.artistName,
                image: {
                    imageBuffer: temp.buffer
                }
            }
            await NodeID3.update(tags, songFile.path)
        }

        const result = await cloudinary.uploader.upload(songFile.path, { resource_type: "auto", use_filename: true})
        const artResult = await cloudinary.uploader.upload(artFile.path, { resource_type: "auto", use_filename: true})
        await unlinkAsync(songFile.path)
        await unlinkAsync(artFile.path)
        const song = new Song({...req.body, artId: artResult.public_id, artUrl: artResult.secure_url, songUrl: result.secure_url, cloudinaryId: result.public_id, artist: req.user._id})

        song.approved = false
        song.promoted = false
        const seoTitle = `${(song.title + ' by ' + song.artistName).replace(/ /g, '-')}`

        song.seoTitle = seoTitle
        await song.save()
        req.user.songsCount +=1;
        await req.user.save()
        res.status(201).send(song)

        res.send()
    } catch (error) {
        console.log(error)
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

/*

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
*/

router.get('/search/:searchTerm/', async (req, res) => {
    try {
        const songs = await Song.fuzzySearch({query: req.params.searchTerm, prefixOnly: true}, {approved: true})


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

    const queryOptions = ['artist', 'audio', 'promoted', 'approved', 'genre', 'rating']


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


    const songsCount = await Song.countDocuments()

        res.send({songs, songsCount})
    } catch (error) {
        res.status(500).send()
    }
})

router.get('/featuredSongs', async (req, res) => {

    try {
        const featuredSongs = await Song.find({approved: true}).setOptions({
            limit: 10
        })
        res.send(featuredSongs)
    }catch(error) {
        console.log(error.message)
        res.status(500).send()
    }
})

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

router.patch('/songs/:id/upgrade', auth, async (req, res) => {
    try {
        if(!req.user.admin) {
            return res.status
        }
        const song = await Song.findById(req.params.id)
        if(!song) {
            return res.status(404).send()
        }
        Object.keys(req.body).forEach(e => {
                song[e] = req.body[e]
        })

        await song.save()


        res.send(song)
    }catch(error) {
        res.status(500).send()
    }
})

router.patch('/songs/:id/downloads', async (req, res) => {
    try {
        const song = await Song.findById(req.params.id)

        if(!song) {
            return res.status(401).send()
        }

        song.hits +=1;
        await song.save()
        res.send()
    }catch(error) {
        res.status(500).send()
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
        let song;
        if(req.user.admin) {
            song = await Song.findOne({_id: songId})
        }else {
          song = await Song.findOne({_id: songId, artist: req.user._id})
        }

        if (!song) {
            return res.status(401).send()
        }

        const user = await User.findById(song.artist)
        if(user) {
            if(user.songsCount >0) {
                user.songsCount -= 1
                await user.save()
            }
        }

        await cloudinary.uploader.destroy(song.cloudinaryId, {resource_type: 'video'});
        await cloudinary.uploader.destroy(song.artId, {resource_type: 'image'});
        await song.delete()

        res.send()
    } catch (error) {
        res.status(500).send(error.message)
    }
})


module.exports = router