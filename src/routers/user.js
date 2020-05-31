const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const Song = require('../models/song')
const auth = require('../middleware/auth')

const router = express.Router()

const upload = multer({
    limits: {
        fileSize: 3000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpeg|jpg|png|gif)/)) {
            return cb(new Error('Please upload an image'))
        }

        cb(undefined, true)
    }
})



router.post('/users', async (req, res) => {
    const user = new User(req.body)


    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})
    }
    catch(error) {
        console.log(error.message)
        res.status(401).send(error)
    }
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        await user.save()
        res.send({token})

    }catch(error) {
        res.status(400).send(error)
    }
})

router.post('/users/logout', auth, async (req, res) => {
    req.user.tokens = []
    await req.user.save()
    res.send()
})

router.get('/users/me',auth, async (req,res) =>{
    try {
        const user = req.user
        res.send({user})
    }catch(err) {
        res.status(400).send()
    }
})

router.patch('/users/me/password', auth, async (req, res) => {
    try {
        await req.user.changePassword(req.body.password, req.body.newPassword)

        req.user.save()

        res.send(req.user)
    }catch(error) {
        res.status(400).send(error)
    }
})

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)

    const allowedUpdates = ['name', 'email', 'stageName', 'location', 'bio','genre', 'label']

    const isValidOperation = updates.every(update => {
        return allowedUpdates.includes(update)
    })

    if(!isValidOperation) {
        return res.status(400).send({error: 'Invalid update'})
    }

    try {
        updates.forEach(update => {
            req.user[update] = req.body[update]
        })

        await req.user.save()
        res.send(req.user)
    }catch(error) {
        console.log(error.message)
        res.status(500).send()

    }

})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    try {
        const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer()
        req.user.avatar = buffer
        await req.user.save()
        res.send()
    }catch (error) {
        res.status(500).send()
    }



})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if(!user) {
            return res.status(404).send()
        }
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    }catch(error) {
        console.log(error.message)
        res.status(500).send()
    }
})

router.get('/users/me/can-upload', auth, async (req, res) => {
    try {
        const song = await Song.findOne({artist: req.user._id, approved: false})
        if(song) {
            console.log(song)
            return res.send(false)
        }

        res.send(true)
    }catch(error) {
        console.log(error.message)
        res.status(500).send()
    }
})

router.get('/users/me/can-rate/:id', auth, async (req, res) => {
    try {
        let canRate;// = await req.user.canRate(req.params.id)
        const user = await User.findOne({_id: req.user._id, 'ratedSongs.ratedSong': req.params.id})

        if(user) {
            canRate = false
        }else {
            canRate = true
        }

        res.send(canRate)
    }catch(error) {
        console.log(error.message)
        res.status(401).send()
    }

})

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        res.send()
    }catch(error) {
        res.status(500).send()
    }
})

module.exports = router