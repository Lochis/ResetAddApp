/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import express from 'express';
var router = express.Router();


router.get('/', function (req, res, next) {
  res.render('index', {
    title: 'AMDSB Application Approvals',
    page: false,
    isAuthenticated: req.session.isAuthenticated,
    name: req.session.account?.name,
  });
});

module.exports = router;
