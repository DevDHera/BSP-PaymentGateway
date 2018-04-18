const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const Nexmo = require('nexmo');
const { ensureAuthenticated } = require('../helpers/auth');

//Load Keys
const keys = require('../config/keys');

//Init Nexmo
const nexmo = new Nexmo({
    apiKey: keys.nexmoApiKey,
    apiSecret: keys.nexmoApiSecret
}, {debug:true});


//Load User Model
require('../models/User');
const User = mongoose.model('customers');

//Load Transaction Model
require('../models/Transaction');
const Transaction = mongoose.model('transactions');

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
    let sum = 0;

    if (isNaN(req.body.transferaccount)) {
        errors.push({ text: 'Account Number Must Be Numeric' });
    }
    if (isNaN(req.body.amount)) {
        errors.push({ text: 'Amount Must be Numeric' });
    }

    if (errors.length > 0) {
        res.render('users/transaction', {
            errors: errors,
            transferaccount: req.body.transferaccount,
            amount: req.body.amount
        })
    } else {
        User.findOne({ accountid: req.body.transferaccount })
            .then(transcustomer => {
                if (transcustomer) {
                    Transaction.aggregate([
                        {
                            $match: {
                                account: new mongoose.Types.ObjectId(req.user.id),
                                type: 'deposit'
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                sum: { $sum: "$amount" }
                            }
                        }
                    ], function (err, deposit) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        Transaction.aggregate([
                            {
                                $match: {
                                    account: new mongoose.Types.ObjectId(req.user.id),
                                    type: 'withdraw'
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    sum: { $sum: "$amount" }
                                }
                            }
                        ], function (err, withdraw) {
                            if (err) {
                                console.log(err);
                                return;
                            }
                            Transaction.aggregate([
                                {
                                    $match: {
                                        account: new mongoose.Types.ObjectId(req.user.id),
                                        type: 'transfer'
                                    }
                                },
                                {
                                    $group: {
                                        _id: null,
                                        sum: { $sum: "$amount" }
                                    }
                                }
                            ], function (err, transfer) {
                                if (err) {
                                    console.log(err);
                                    return;
                                }
                                Transaction.aggregate([
                                    {
                                        $match: {
                                            transferaccount: new mongoose.Types.ObjectId(req.user.id),
                                            type: 'transfer'
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: null,
                                            sum: { $sum: "$amount" }
                                        }
                                    }
                                ], function (err, trdepo) {
                                    if (err) {
                                        console.log(err);
                                        return;
                                    }
                                    let depositSum = 0;
                                    let transferSum = 0;
                                    let withdrawSum = 0;
                                    let trdepoSum = 0;
                                    let balance = 0;
                                    if (deposit.length > 0) {
                                        depositSum = deposit[sum].sum;
                                    }
                                    if (transfer.length > 0) {
                                        transferSum = transfer[sum].sum;
                                    }
                                    if (withdraw.length > 0) {
                                        withdrawSum = withdraw[sum].sum;
                                    }
                                    if (trdepo.length > 0) {
                                        trdepoSum = trdepo[sum].sum;
                                    }

                                    balance = depositSum - transferSum - withdrawSum + trdepoSum
                                    if (balance - req.body.amount > 500) {
                                        const newTransaction = {
                                            account: req.user.id,
                                            transferaccount: transcustomer.id,
                                            type: 'transfer',
                                            amount: req.body.amount,                                            
                                        }
                                        new Transaction(newTransaction)
                                            .save()
                                            .then(transaction => {
                                                //Customer.update({accountid: req.body.accountid},{$set:{transaction: transaction.id}});
                                                /*fetch('/', {
                                                    method: 'post',
                                                    headers: {
                                                        'Content-type': 'application/json'
                                                    },
                                                    body: JSON.stringify({number: req.user.contact, text: req.body.amount})
                                                })
                                                .then(function(res){
                                                    console.log(res)
                                                })
                                                .catch(function(err){
                                                    console.log(err);
                                                })*/

                                                //SMS Sending Initiation

                                                //Slicing Number to add 94 to front
                                                let number = req.user.contact;

                                                number = '94'+number.slice(1);
                                                
                                                let smsmessage = `Thank You for banking with BSP. Rs.${req.body.amount} transfered to account ${req.body.transferaccount}`

                                                nexmo.message.sendSms('NEXMO', number, smsmessage, {type: 'unicode'},
                                                    (err, responseData) => {
                                                        if(err){
                                                            console.log(err);
                                                        }else{
                                                            console.dir(responseData);
                                                        }
                                                    }
                                                )
                                                req.flash('success_msg', 'Transaction Completed :)');
                                                res.redirect('/');
                                            });
                                    } else {
                                        req.flash('error_msg', 'No Money.. Duka Tma.... :(');
                                        res.redirect('transaction' ,'/', {
                                            transferaccount: req.body.transferaccount,                                            
                                            amount: req.body.amount,                                            
                                        });
                                    }
                                })
                            })
                        })
                    })
                } else {
                    req.flash('error_msg', 'Transfer Account ID Mismatch :(');
                    res.redirect('transaction' ,'/', {                        
                        amount: req.body.amount,
                        transferaccount: req.body.transferaccount
                    });
                }
                //req.flash('success_msg', 'Transation Success');
                //res.redirect('/users/transaction');
            }
    
        );
    }
});

//Logout User
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are Logged out');
    res.redirect('/users/login');
});

module.exports = router;