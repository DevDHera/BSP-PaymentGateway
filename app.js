const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');

const app = express();

//Load Routes
const users = require('./routes/users');

//Load Keys
const keys = require('./config/keys');

//Passport Config
require('./config/passport')(passport);

//Map Global Promises
mongoose.Promise = global.Promise;

//Connect To Mongoose
mongoose.connect(keys.mongoURI, {

})
    .then(() => console.log('MogoDB Connected'))
    .catch(err => console.log(err));


//Handlebars Middleware
app.engine('handlebars', exphbs({    
    defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

//Body Parser Middleware
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//Express Session Middleware
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,    
}));

//Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

//Connect-Flash Middleware
app.use(flash());

//Global Variables
app.use(function(req, res, next){
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;    
    next();
})

//Index Route
app.get('/', (req, res) => {
    res.render('index');
});

//Use Routes
app.use('/users', users);

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
