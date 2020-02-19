const express = require('express')
const User = require('../models/user')

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

router.get('/users', async (req,res) =>{
    try {
        const user = req.user
        res.send(user)
    }catch(err) {
        res.status(400).send()
    }
})


module.exports = router