const Post = require('../model/Post');
const User = require('../model/User');
const Follow = require('../model/Follow');

exports.shareProfile = async function (req, res, next) {
  let isVisitorProfile = false;
  let isFollowing = false;
  if (req.session.user) {
    isVisitorProfile = req.profileUser._id.equals(req.session.user._id);
    isFollowing = await Follow.isVistorFollowing(req.profileUser._id, req.visitorId);
  }

  req.isVisitorProfile = isVisitorProfile;
  req.isFollowing = isFollowing;
  next();
};

exports.mustBeLoggedIn = function (req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.flash('errors', 'You must be logged in to perform that action');
    req.session.save(function () {
      res.redirect('/');
    });
  }
};

exports.login = function (req, res) {
  let user = new User(req.body);
  user
    .login()
    .then(function (response) {
      req.session.user = {
        username: user.data.username,
        avatar: user.avatar,
        _id: user.data._id,
      };
      req.session.save(function () {
        res.redirect('/');
      });
    })
    .catch(function (err) {
      req.flash('errors', err);
      req.session.save(function () {
        res.redirect('/');
      });
    });
};

exports.logout = function (req, res) {
  req.session.destroy(function () {
    res.redirect('/');
  });
};

exports.register = async function (req, res) {
  let user = new User(req.body);
  user
    .register()
    .then(() => {
      req.session.user = {
        username: user.data.username,
        avatar: user.avatar,
        _id: user.data._id,
      };
      req.session.save(function () {
        res.redirect('/');
      });
    })
    .catch((regErrors) => {
      regErrors.forEach(function (error) {
        req.flash('regErrors', error);
      });
      req.session.save(function () {
        res.redirect('/');
      });
    });
};

exports.home = function (req, res) {
  if (req.session.user) {
    res.render('home-dashboard');
  } else {
    res.render('home-guest', {
      regErrors: req.flash('regErrors'),
    });
  }
};

exports.ifUserExists = function (req, res, next) {
  User.findByUsername(req.params.username)
    .then(function (userDocument) {
      req.profileUser = userDocument;
      next();
    })
    .catch(function () {
      res.render('404');
    });
};

exports.profilePostScreen = function (req, res) {
  Post.findByAuthorId(req.profileUser._id)
    .then((posts) => {
      res.render('profile', {
        posts: posts,
        profileUsername: req.profileUser.username,
        profileAvatar: req.profileUser.avatar,
        isFollowing: req.isFollowing,
        isVisitorProfile: req.isVisitorProfile,
      });
    })
    .catch(() => res.render('404'));
};

exports.profileFollowersScreen = async function (req, res) {
  try {
    let followers = await Follow.getFollowersById(req.profileUser._id);
    res.render('profile-followers', {
      followers: followers,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isVisitorProfile: req.isVisitorProfile,
    });
  } catch {
    res.render('404');
  }
};

exports.profileFollowingScreen = async function (req, res) {
  try {
    let following = await Follow.getFollowingById(req.profileUser._id);
    res.render('profile-following', {
      following: following,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isVisitorProfile: req.isVisitorProfile,
    });
  } catch {
    res.render('404');
  }
};
