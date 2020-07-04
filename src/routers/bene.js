const express = require('express')
const Bene = require('../models/bene')
const auth = require('../middleware/auth')


const router = express.Router()


router.post('/details', auth, async (req, res) => {

    try {
        if(req.user.admin !== true) {
            return res.status(401).send()
        }
        const details = new Bene({...req.body})
        await details.save()
        res.send(details)
    }catch(error) {
        res.status(500).send()
    }
})

router.get('/details', async (req, res) => {

    try{
        const details = await Bene.findOne({})
        res.send(details)
    }catch(error) {
        console.log(error.message)
        res.status(500).send()
    }
})

router.patch('/details', auth, async (req, res) => {
    try {

        if(req.user.admin !== true) {
            return res.status(401).send()
        }
        const details = await Bene.findOneAndUpdate({_id: '5f0034e5e67cbd0017a2a2b8'}, req.body)

        res.send(details)

    }catch(error) {
        console.log(error.message)
        res.status(500).send()
    }
})

module.exports = router