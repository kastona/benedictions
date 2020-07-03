const express = require('express')
const cors = require('cors')
require('dotenv').config()
require('./db/mongoose')
const userRouter = require('./routers/user')
const songRouter = require('./routers/song')
const eventRouter = require('./routers/event')
const imageRouter = require('./routers/image')
const detailRouter = require('./routers/bene')
const app = express()




app.use(express.json())
app.use(cors())
app.use(userRouter)
app.use(songRouter)
app.use(eventRouter)
app.use(imageRouter)
app.use(detailRouter)
const PORT = process.env.PORT




app.listen(PORT, () => {
    console.log(`Listening on ${PORT}`)
})