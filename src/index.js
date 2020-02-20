const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user')
const songRouter = require('./routers/song')
const app = express()

app.use(express.json())
app.use(userRouter)
app.use(songRouter)

const PORT = process.env.PORT || 3000




app.listen(PORT, () => {
    console.log(`Listening on ${PORT}`)
})