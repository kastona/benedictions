const express = require('express')
const User = require('../models/user')

const router = express.Router()

router.get('/me', async (req, res) => {
    const user = new User({
        name: 'My Name',
        email: 'stephenkastona@gmail.com',
        password: 'siekkdkdiekdie',
        locations: [
            {
                location: 'Abuja'
            }
        ],
        genre: 'Gospel',
        label: 'G-Club',
        tokens: [
            {
             token: 'mytoken'
            }
        ],
        usedSpace: 30
    })

    try {
        await user.save()
        res.send(user)
    }
    catch(error) {
        res.status(401).send(error)
    }
})


module.exports = router