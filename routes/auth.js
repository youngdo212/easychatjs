const express = require('express');

const router = express.Router();
const Account = require('../models/account');

router.get('/signin', (req, res) => {
  if (req.session.isLogined) {
    res.redirect('/');
    return;
  }

  res.render('signin');
});

router.get('/signup', (req, res) => {
  if (req.session.isLogined) {
    res.redirect('/');
    return;
  }

  res.render('signup');
});

router.get('/signout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.err(err);

    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

router.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  const account = await Account.findOne({
    email,
    password,
  }).then();

  if (!account) {
    res.render('signin', {
      fail: true,
      failMessage: 'check your email or password',
    });
    return;
  }

  req.session.isLogined = true;
  req.session.accountId = account._id;
  req.session.nickname = account.nickname;

  res.redirect('/');
});

router.post('/signup', async (req, res) => {
  const { email, password, nickname } = req.body;
  const isDuplicatedEmail = await Account.findOne({
    email,
  }).then();

  if (isDuplicatedEmail) {
    res.render('signup', {
      fail: true,
      failMessage: 'this email has already taken!',
    });
    return;
  }

  const account = new Account({
    email,
    password,
    nickname,
  });

  account.save((err) => {
    if (err) console.error(err);
  });

  res.redirect('/auth/signin');
});

module.exports = router;
