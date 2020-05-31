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

    const buffer = await sharp(req.file.buffer).png().toBuffer()
    const image = new Image({buffer, dummy: true})
    image.buffer = buffer
    await image.save()

    res.send()
})

router.get('/cover', async (req, res) => {

    const imageBuffer = await Image.findOne()
    if(!imageBuffer) {

        return res.status(404).send()
    }


    res.set('Content-Type', 'image/png')
    res.status(200).send(imageBuffer.buffer)

})



module.exports = router