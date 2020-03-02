const express = require('express')
const Event = require('../models/event')

const router = express.Router()



router.post('/events', auth, async (req,res) => {
    const event = new Event(req.body);

    try {
        await event.save()

        res.status(201).send(event)
    }catch(error) {
        res.status(500).send(error.message)
    }
})

router.get('/events/:id', async (req, res) => {
    const event = await Event.findById(req.params.id)
    try {
        if (!event) {
            return res.status(404).send()
        }

        res.send(event)
    } catch (error) {
        res.status(500).send(error.message)
    }

})

router.get('/events', async (req, res) => {
    try{
        console.log(req.query)





        const events = Event.find({})
    }catch(error) {
        res.status(500).send(error.message)
    }
})