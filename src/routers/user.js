const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const Song = require('../models/song')
const Image = require('../models/image')
const auth = require('../middleware/auth')

const router = express.Router()

const upload = multer({
    limits: {
        fileSize: 3000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpeg|jpg|png|gif)/)) {
            return cb(new Error('Please upload an image'))
        }

        cb(undefined, true)
    }
})


router.post('/users', async (req, res) => {
    const user = new User(req.body)


    try {
        user.promoted = false
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})
    } catch (error) {
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

    } catch (error) {
        console.log(error.message)
        res.status(400).send(error)
    }
})

router.post('/users/logout', auth, async (req, res) => {
    req.user.tokens = []
    await req.user.save()
    res.send()
})

router.get('/users/me', auth, async (req, res) => {
    try {
        const user = req.user
        const songs = await Song.find({artist: user._id})
        const unApproved = songs.length

        res.send( {user})
    } catch (err) {
        res.status(400).send()
    }
})

router.patch('/users/:id/upgrade', auth, async (req, res) => {
    try {
        /*if(!req.user.admin) {
            return res.status(400).send()
        }*/

        const user = await User.findById(req.params.id)

        if (!user) {
            return res.status(401).send()
        }

        Object.keys(req.body).forEach(update => {
            user[update] = req.body[update]
        })

        await user.save()
        res.send(user)
    } catch (error) {
        res.status(500).send()
    }
})

router.patch('/users/me/password', auth, async (req, res) => {
    try {
        await req.user.changePassword(req.body.password, req.body.newPassword)

        req.user.save()

        res.send(req.user)
    } catch (error) {
        res.status(400).send(error)
    }
})

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)

    const allowedUpdates = ['name', 'email', 'stageName', 'location', 'bio', 'genre', 'label']

    const isValidOperation = updates.every(update => {
        return allowedUpdates.includes(update)
    })

    if (!isValidOperation) {
        return res.status(400).send({error: 'Invalid update'})
    }

    try {
        updates.forEach(update => {
            req.user[update] = req.body[update]
        })

        await req.user.save()
        res.send(req.user)
    } catch (error) {
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
    } catch (error) {
        res.status(500).send()
    }


})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user) {
            return res.status(404).send()
        }

        res.set('Content-Type', 'image/png')
        if(!user.avatar) {
            Image.findOne({dummy: true})
        }
        res.send(user.avatar)
    } catch (error) {
        console.log(error.message)
        res.status(500).send()
    }
})

router.patch('/users/:id/admin', auth, async (req, res) => {
    try {
        if (!req.user.admin) {
            return res.status(400).send()
        }

        const user = User.findById(req.params.id);

        if (!user) {
            res.status(401).send()
        }

        user.admin = req.body.admin

        user.save()

        res.status(200).send()
    } catch (error) {
        res.status(500).send()
    }
})

router.get('/users/me/can-upload', auth, async (req, res) => {
    try {
        let canUpload = true;
        let unapproved = 0;

        const songs = await Song.find({artist: req.user._id, approved: false})
        if(!songs) {
            return res.status(400).send()
        }

        unapproved = songs.length

        if (unapproved > 3) {
            canUpload = false
        }

        res.send({canUpload, unapproved})
    } catch (error) {
        console.log(error.message)
        res.status(500).send()
    }
})

router.get('/users/me/can-rate/:id', auth, async (req, res) => {
    try {
        let canRate;// = await req.user.canRate(req.params.id)
        const user = await User.findOne({_id: req.user._id, 'ratedSongs.ratedSong': req.params.id})

        if (user) {
            canRate = false
        } else {
            canRate = true
        }

        res.send(canRate)
    } catch (error) {
        console.log(error.message)
        res.status(401).send()
    }

})

//get Profile of artist by a third party without auth
router.get('/users/third/:stageName', async (req, res) => {
    try {
        const user = await User.findOne({stageName: req.params.stageName})
        if(!user) {
            return res.status(401).send()
        }

        res.send(user)
    }catch(error) {
        console.log(error.message)
        res.status(500).send()
    }
})

router.get('/users', auth, async (req, res) => {
    try {
        if(!req.user.admin) {
            return res.status(400).send()
        }

        const users = await User.find({}).setOptions({
            limit: parseInt(req.query.limit),
            skip: parseInt(req.query.skip)
        })
        const usersCount = await User.countDocuments()

        res.send({users, usersCount})
    } catch (error) {
        res.status(500).send()
    }

})

router.delete('/users/me', auth, async (req, res) => {
    try {
        await User.deleteOne({_id: req.user._id})
        res.send()
    } catch (error) {
        res.status(500).send()
    }
})

router.get('/users/stats', auth, async (req, res) => {
    try {
        const usersCount = await User.countDocuments()
        const songsCount = await Song.countDocuments()
        const pendingRequests = await Song.find({approved: false}).countDocuments()
        res.send({usersCount, songsCount, pendingRequests})
    } catch (error) {
        res.status(400).send()
    }
})

router.delete('/users/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user) {
            return res.status(401)
        }

        if(!req.user.admin) {
            return res.status(400).send()
        }
        await User.deleteOne({_id: user._id})
        res.send()
    } catch (error) {

    }
})

module.exports = router