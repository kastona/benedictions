const validator = require('validator')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

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
        type: String,
        required: true,
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
        throw new Error('Unable to login')
    }

    const passwordCorrect = await bcrypt.compare(password, user.password)

    if(!passwordCorrect) {
        throw new Error('Unable to login')
    }

    return user;
}

userSchema.methods.generateAuthToken = async function() {
    const user = this
    const token = jwt.sign({_id: user._id}, 'myman')
    user.tokens = user.tokens.concat({token})
    return token
}

userSchema.methods.toJSON = function() {
    const user = this
    const userObject = user.toObject()
    delete userObject.tokens
    delete userObject.password

    return userObject
}

userSchema.pre('save', async function (next) {
    const user = this
    const passwordModified = user.isModified('password')
    if(passwordModified) {
        user.password = bcrypt.hash(user.password, 8)
    }
})

const User = mongoose.model('User', userSchema)
module.exports = User