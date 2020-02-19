const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')

const router = express.Router()

router.post('/users', async (req, res) => {
    const user = new User(req.body)


    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})
    }
    catch(error) {
        res.status(401).send(error)
    }
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        await user.save()
        res.send({user, token})

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
        res.send(user)
    }catch(err) {
        res.status(400).send()
    }
})

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'location', 'genre', 'label', 'accountType']

    const isValidOperation = updates.every(update => {
        return allowedUpdates.includes(update)
    })

    if(!isValidOperation) {
        res.status(400).send({error: 'Invalid update'})
    }

    try {
        updates.forEach(update => {
            req.user[update] = req.body[update]
        })

        await req.user.save()
        res.send(req.user)
    }catch(error) {
        res.status(500).send()
    }

})

router.delete('/user/me', auth, async (req, res) => {
    try {
        await req.user.delete()
        res.send()
    }catch(error) {
        res.status(500).send()
    }
})

module.exports = router