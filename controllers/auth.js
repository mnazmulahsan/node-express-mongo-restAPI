const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.getsignup = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error('validation failed!');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    bcrypt.hash(password, 12)
        .then(hashedPw => {
            const user = new User({
                email: email,
                password: hashedPw,
                name: name
            });
            return user.save();
        })
        .then(result => {
            res.status(201).json({ message: 'User was created', userId: result._id});
        })
        .catch(err => {
            if(!err.status){
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.login = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let loaderUser;
    User.findOne({email: email})
        .then(user => {
            if(!user){
                const error = new Error('User not found with this email');
                error.statusCode = 401;
                throw error;
            }
            loaderUser = user;
            return bcrypt.compare(password, user.password);
        })
        .then(isEqual => {
            if(!isEqual){
                const error = new Error('Password is wrong');
                error.statusCode = 401;
                throw error;
            }
            const token = jwt.sign({
                email: loaderUser.email,
                userId: loaderUser._id.toString()
            }, 'helloBangladesh', { expiresIn: '1h'});
            res.status(200).json({ token: token, userId: loaderUser._id.toString() });
        })
        .catch(err => {
            if(!err.status){
                err.statusCode = 500;
            }
            next(err);
        });
};