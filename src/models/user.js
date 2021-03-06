const validator = require('validator')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Song = require('./song')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
        validate(email) {
            if(!validator.isEmail(email)) {
                throw new Error('Email is not valid')
            }
        }

    },

    stageName: {
        type: String,
        trim: true,
        unique: true
    },

    bio: {
        type: String,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minLength: 7,
        trim: true
    },
    avatar: {
        type: Buffer
    },
    locations: [
        {
            location: {
                type: String,
                required: true
            }
        }

    ],
    genre: {
        type: String
    },
    isVerified: { type: Boolean, default: false },
    confirmToken: {
      type: String
    },
    label: {
        type: String
    },
    tokens: [
        {
            token: {
                type: String,
                required: true
            }
        }
    ],
    accountType: {
        type: String,
        required: true,
        default: 'Free'
    },
    promoted: {
        type: Boolean,
        required: true
    },
    songsCount: {
      type: Number,
      default: 0
    },
    admin: {
      type: Boolean,
      required: true,
      default: false
    },
    usedSpace: {
        type: Number,
        validate(space) {
            if(space < 0) {
                throw new Error('Space Exceeded')
            }
        }
    }
}, {
    timestamps: true
})

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email})
    if(!user) {

        throw new Error(`The email ${email} is not associated with any account.`)
    }
    const passwordCorrect = await bcrypt.compare(password, user.password)

    if(!passwordCorrect) {
        throw new Error('Invalid Email of Password')
    }

    return user;
}

userSchema.methods.generateAuthToken = async function(login) {
    const user = this
    const token = jwt.sign({_id: user._id}, process.env.JSON_WEB_TOKEN_SECRET)

        user.tokens = user.tokens.concat({token})
    if(login ===false) {
        user.confirmToken = token
    }
    return token
}

userSchema.methods.canRate = async function(ratedSong) {
    const user = this

    const canRate = !user.ratedSongs.includes({ratedSong})
    return canRate
}

userSchema.methods.changePassword = async  function(oldPassword, newPassword) {
    const user = this
    const passwordCorrect = await bcrypt.compare(oldPassword, user.password)

    if(!passwordCorrect) {
        throw new Error('Wrong Password')
    }

    user.password = newPassword
}
userSchema.virtual('songs', {
    ref: 'Song',
    localField: '_id',
    foreignField: 'artist'
})

userSchema.virtual('events', {
    ref: 'Event',
    localField: '_id',
    foreignField: 'artist'
})

userSchema.methods.toJSON = function() {
    const user = this
    const userObject = user.toObject()
    delete userObject.tokens
    delete userObject.password
    delete userObject.avatar

    return userObject
}

userSchema.pre('save', async function (next) {
    const user = this
    const passwordModified = user.isModified('password')
    if(passwordModified) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

userSchema.pre('deleteOne', async function (next) {
    const user = this
    try {
        await Song.deleteMany({'artist': user._id})
    }catch(error) {

        throw new Error()
    }

    next()
})



const User = mongoose.model('User', userSchema)
module.exports = User