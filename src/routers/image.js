const express = require('express')
const auth = require('../middleware/auth')
const Image = require('../models/image')
const multer = require('multer')
const sharp = require('sharp')
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



router.post('/images', auth, upload.single('avatar'), async (req,res) => {

    try {

        if(!req.user.admin) {
            return res.status(401).send()
        }

        let imageBuffer = await Image.findOne({dummy: false})
        if(!imageBuffer) {

            imageBuffer = new Image()
        }




        const buffer = await sharp(req.file.buffer).png().toBuffer()
        imageBuffer.buffer = buffer
        await imageBuffer.save()
        res.send()
    }catch(error) {
        res.status(500).send()
    }

})

router.get('/cover', async (req, res) => {

    try {
        const imageBuffer = await Image.findOne({dummy: false})
        if(!imageBuffer) {

            return res.status(404).send()
        }


        res.set('Content-Type', 'image/png')
        res.status(200).send(imageBuffer.buffer)
    }catch(error) {
        res.status(500).send()
    }


})



module.exports = router