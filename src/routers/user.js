const express = require('express')
const User = require('../models/user')

const router = express.Router()

router.post('/users', async (req, res) => {
    const user = new User(req.body)


    try {
        const token = await user.generateAuthToken()
        await user.save()
        res.send({user, token})
    }
    catch(error) {
        res.status(401).send(error)
    }
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        if(!user) {
            throw new Error()
        }

        const token = user.generateAuthToken()
        res.send({user, token})

    }catch(error) {
        res.status(500).send()
    }
})


module.exports = router