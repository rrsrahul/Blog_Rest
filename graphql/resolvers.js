const bcrypt = require('bcryptjs');
const User = require('../models/user'); 
const validator = require('validator');

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
        


    }
}