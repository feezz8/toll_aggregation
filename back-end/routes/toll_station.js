const express = require('express');
const auth = require('../middlewares/auth');
const toll_station_passes = require('../controllers/toll_station_passes');
const pass_analysis = require('../controllers/pass_analysis');
const passes_cost = require('../controllers/passes_cost');
const charges_by = require('../controllers/charges_by');

const router = express.Router();

router.get('/tollStationPasses/:tollStationID/:date_from/:date_to', auth, toll_station_passes.get_data);
router.get('/passAnalysis/:stationOpID/:tagOpID/:date_from/:date_to', auth, pass_analysis.get_data);
router.get('/passesCost/:tollOpID/:tagOpID/:date_from/:date_to', auth, passes_cost.get_data);
router.get('/chargesBy/:tollOpID/:date_from/:date_to', auth, charges_by.get_data);


module.exports = router;
