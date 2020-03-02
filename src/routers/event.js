const express = require('express')
const auth = require('../middleware/auth')
const Event = require('../models/event')

const router = express.Router()



router.post('/events', auth, async (req,res) => {

    try {
        const event = new Event({...req.body, artist: req.user._id});
        await event.save()
        res.status(201).send(event)
    }catch(error) {
        res.status(500).send(error.message)
    }
})

router.get('/events/:id', async (req, res) => {

    try {
        const event = await Event.findById(req.params.id)
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

        const queryCriteria = {}
        const sort = {}

        if(req.query.sortBy) {
            const sortingQuery = req.query.sortBy.split(':')
            sort[sortingQuery[0]] = sortingQuery[1] === 'desc'? -1: 1
        }

        if(req.query.artist) {
            queryCriteria.artist = req.query.artist
        }
        const events = await Event.find(queryCriteria).setOptions({
            sort
        })

        if(!events) {
            return res.status(404).send()
        }

        res.send(events)
    }catch(error) {
        res.status(500).send(error.message)
    }
})

router.patch('/events/:id', auth, async (req, res) => {
    try {
        const event = Event.findById(req.params.id)
        if(!event) {
            return res.status(401).send()
        }

        res.send(event)

    }catch(error) {
        res.status(500).send(error.message)
    }
})

router.delete('/events/:id', auth, async (req, res) => {
    try {
        const event = await Event.findOne({_id: req.params.id, artist: req.user._id})

        if(!event) {
            return res.status(401).send()
        }

        await event.delete()
        res.send()
    }catch(error) {
        res.status(500).send()
    }
})

module.exports = router