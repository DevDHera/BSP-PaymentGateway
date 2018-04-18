const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const {ensureAuthenticated} = require('../helpers/auth');

//Load Approval Model
require('../models/User');
const User = mongoose.model('customers');

//Login Route
router.get('/login', (req, res) => {
    res.render('users/login');
});

//Login Form POST
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/users/transaction',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
});

//Transaction Route
router.get('/transaction', ensureAuthenticated, (req, res) => {
    res.render('users/transaction');
});

//Transaction Post Route
router.post('/transaction', ensureAuthenticated, (req, res) => {
    let errors = [];

    if(isNaN(req.body.transferaccount)){
        errors.push({text: 'Account Number Must Be Numeric'});
    }
    if(isNaN(req.body.amount)){
        errors.push({text: 'Amount Must be Numeric'});
    }

    if(errors.length>0){
        res.render('users/transaction', {
            errors: errors,
            transferaccount: req.body.transferaccount,
            amount: req.body.amount
        })
    }else{
        req.flash('success_msg', 'Transation Success');
        res.redirect('/users/transaction');
    }
    
});

//Logout User
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are Logged out');
    res.redirect('/users/login');
});

module.exports = router;