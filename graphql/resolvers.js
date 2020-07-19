const bcrypt = require('bcryptjs');

const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user'); 
const Post = require('../models/post');

module.exports = {
    createUser: async function({ userInput },req){
        //const email =  args.userInput.email;
        const errors = [];
        if(!validator.isEmail(userInput.email))
        {
                errors.push({message:'Email is invalid'});
        }
        if(validator.isEmpty(userInput.password) || 
        !validator.isLength(userInput.password,{ min: 5 }))
        {
            errors.push({message:'password too short'});
        }

        if(errors.length>0)
        {
            const err = new Error('Invalid Input');
            err.data = errors;
            err.code = 422;
            throw err;
        }

        const existingUser = await User.findOne({email:userInput.email});

        if(existingUser)
        {
            const error = new Error('User already exists');
            throw error;
        }
        const hashedPassword = await bcrypt.hash(userInput.password,12);

        const user = new User({
            email: userInput.email,
            name: userInput.name,
            password:hashedPassword
        });

        const createdUser = await user.save();

        return { ...createdUser._doc,_id:createdUser._id.toString()};
        
    },
    login: async function({ email,password },req)
    {
        const user = await User.findOne({email:email});

        if(!user)
        {
            const err = new Error('No user with the given email');
            err.status = 401;
            throw err;
        }
        console.log(user.name);
        const isEqual = await bcrypt.compare(password,user.password);

        if(!isEqual)
        {
            const err = new Error('Passwords Do not match');
            err.status = 403;
            throw err;
        }

        const token =  jwt.sign({
            userId:user._id.toString(),
            email: user.email
        },'supersecretsecret',
        {
            expiresIn:'1h'
        });

        return {token:token,userId:(await user)._id.toString()};

    },
    createPost : async function({ postInput },req)
    {
        const errors = [];

        if(validator.isEmpty(postInput.title) || !validator.isLength(postInput.title,{ min:3}))
        {
            errors.push({message:'Title is too short'});
        }

        if(validator.isEmpty(postInput.content) || !validator.isLength(postInput.content,{ min:3}))
        {
            errors.push({message:'Content is too short'});
        }

        if(errors.length>0)
        {
            const err = new Error('Invalid Input');
            err.data = errors;
            err.code = 422;
            throw err;
        }

        const post = new Post({
            title:postInput.title,
            content:postInput.content,
            imageUrl:postInput.imageUrl
        });

        const createdPost = await post.save();

        return {...createdPost._doc, _id:createdPost._id.toString(),
            createdAt: createdPost.createdAt.toString(),updatedAt:createdPost.updatedAt.toISOString()
        };
    }
}