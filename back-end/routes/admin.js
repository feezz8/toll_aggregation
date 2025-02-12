const express = require('express');
const auth  = require('../middlewares/auth');
const admin = require('../controllers/admin');


const router = express.Router();

router.get('/healthcheck', admin.healthcheck);
router.post('/resetstations', admin.resetstations);
router.post('/resetpasses', admin.resetpasses);
router.post('/addpasses', admin.addpasses);


module.exports = router;
