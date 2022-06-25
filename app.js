// the code given below is kinda fixed 
const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session')
const wrap = require('./error/wrapper')
const Campground = require('./models/campground');
const passport = require('passport');
const localstrategy = require('passport-local');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const Review = require('./models/review');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const campground = require('./models/campground');
const User = require('./models/user');

mongoose.connect('mongodb://localhost:27017/yelp-camp', { useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => {
        console.log("MONGO CONNECTION OPEN!!!")
    })
    .catch(err => {
        console.log("OH NO MONGO CONNECTION ERROR!!!!")
        console.log(err)
    })


const sessionConfig = {
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,

}
app.use(session(sessionConfig));


app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')))
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new localstrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// ends the fixed code



app.use((req, res, next) => {

    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

const isAuthor = async (req, res, next) => {
    const { id } = req.params;

    const campground = await Campground.findById(id);
    console.log(campground);
    console.log(req.user);

    if (!req.isAuthenticated()) {
        req.flash('error', 'U must be signed in first');
        res.redirect('/login');
    } else {

        if (!campground.author.equals(req.user._id)) {
            req.flash('error', 'U must have permission');
            res.redirect('/campgrounds');
        } else {
            next();
        }
    }

}

const isloggedin = (req, res, next) => {

    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'You should be signed in');
        return res.redirect('/login');
    }
    next();
}

app.listen(3000, () => {
    console.log('Serving on port 3000')
})

app.get('/', (req, res) => {
    res.redirect('/campgrounds');
})

app.get('/register', (req, res) => {
    res.render('users/register');
})

app.post('/register', wrap(async (req, res) => {

    const { email, username, password } = req.body;

    const user = new User({ email, username });

    const registered = await User.register(user, password);

    req.login(registered, err => {
        if (err) return next(err);
        req.flash('success', 'Welcome to Yelp Camp!');
        res.redirect('/campgrounds');


    })
}))


app.get('/campgrounds', wrap(async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds })
}))


app.get('/campgrounds/new', (req, res) => {

    if (req.isAuthenticated()) {
        res.render('campgrounds/new');
    } else {
        req.session.return = req.originalUrl;
        req.flash('error', 'you should be signed in');
        return res.redirect('/login');
    }
})


app.get('/campgrounds/:id', wrap(async (req, res) => {

    const campground = await Campground.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author',
        }

    }).populate('author');

    res.render('campgrounds/show', { campground });
}))

app.post('/campgrounds/', wrap(async (req, res) => {

    const campground = await Campground(req.body.campground);
    campground.author = req.user._id;
    await campground.save();
    //res.send(campground);
    req.flash('success', 'Campground made successfully !!')
    res.redirect(`campgrounds/${campground._id}`);
}))

app.get('/campgrounds/:id/edit', isAuthor, wrap(async (req, res) => {

    const campground = await Campground.findById(req.params.id);

    res.render('campgrounds/edit', { campground });
}))

app.put('/campgrounds/:id', isAuthor, wrap(async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    res.redirect(`/campgrounds/${campground._id}`)
}));


app.delete('/campgrounds/:id', isAuthor, wrap(async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    res.redirect('/campgrounds');
}))




app.post('/campgrounds/:id/reviews', isloggedin, wrap(async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review);
    review.author = req.user._id;
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
}))


app.delete('/campgrounds/:id/reviews/:reviewId', isloggedin, wrap(async (req, res) => {
    const { id, reviewId } = req.params;
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/campgrounds/${id}`);
}))


app.get('/login', (req, res) => {

    res.render('users/login');

})

// app.get('/login', (req, res) => {


//     res.redirect('/campgrounds');
// })

//app.post('/login', passport.authenticate('local', { successRedirect: '/campgrounds', failureRedirect: '/login', failureFlash: true }), (req, res));

app.get('/logout', (req, res) => {
    req.logout();
    req.flash('success', 'goodbye');
    res.redirect('/campgrounds');

})

app.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), (req, res) => {

    req.flash('success', ' Welcome back ');
    const t = req.session.return;
    delete req.session.return;
    if (t) {
        res.redirect(t);
    } else {

        res.redirect('/campgrounds');
    }
})

app.use((err, req, res, next) => {
    console.log(err);

    res.send('Something went wrong')
})


