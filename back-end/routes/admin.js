const express = require('express');
const auth  = require('../middlewares/auth');
const admin = require('../controllers/admin');


const router = express.Router();

router.get('/healthcheck', auth, admin.healthcheck);
router.post('/resetstations', auth, admin.reset_stations);
router.post('/resetpasses', auth, admin.reset_passes);
router.post('/addpasses', auth, admin.add_passes);


module.exports = router;
