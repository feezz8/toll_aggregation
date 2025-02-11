const { pool } = require('../utils/database');
const { validateFields } = require('../utils/missing_params')
const { Parser } = require('json2csv');


exports.get_data = async (req, res, next) => {
    const {tollStationID, date_from, date_to}  = req.params;

    const required_params = ['tollStationID', 'date_from', 'date_to'];
    const missing_params = validateFields(req, 'params', required_params);

    if(missing_params.length > 0) {
        return res.status(400).json({message: `Missing query parameters: ${missing_params.join(', ')}` });
    }

 // SQL query to fetch the required data
    const query = `
        SELECT 
            p.tollID, 
            p.tollOpID, 
            NOW() AS requestTimestamp, 
            ? AS periodFrom, 
            ? AS periodTo, 
            COUNT(p.ID) OVER (PARTITION BY p.tollID) AS nPasses,  -- Running total of passes
            ROW_NUMBER() OVER (PARTITION BY p.tollID ORDER BY p.ID) AS passIndex,  -- Pass sequence per station
            p.ID,
            p.timestamp,
            p.tagRef,
            p.tagHomeID,
            p.passType,
            p.charge
        FROM passes p
        WHERE 
            p.tollID = ? 
        AND timestamp BETWEEN 
            STR_TO_DATE(?, '%Y%m%d') 
        AND 
            STR_TO_DATE(?, '%Y%m%d') + INTERVAL 1 DAY - INTERVAL 1 SECOND        
        ORDER BY p.tollID, p.timestamp;
        `;
   // Execute the query
    pool.getConnection((err, connection) => {

        if(err) return res.status(500).json({message: 'Connection pool is saturated!'});

        connection.query(query, [date_from, date_to, tollStationID, date_from, date_to], (err, rows) =>{
            connection.release(); //Release the connection from the pool
            if(err) return res.status(500).json({message: 'Internal Server Error'});

            //Check empty dataset
            if(rows.length === 0){
                return res.status(204).json({ message: "No data found!" });
            }

            const response = {
                stationID: tollStationID,
                stationOperator: rows[0].tollOpID,
                requestTimestamp: new Date().toISOString(),
                periodFrom: date_from,
                periodTo: date_to,
                nPasses: rows[0].nPasses,
                passList: rows.map(pass => ({
                    passIndex: pass.passIndex, // Pass number
                    passID: pass.ID,
                    timestamp: pass.timestamp,
                    tagID: pass.tagRef,
                    tagProvider: pass.tagHomeID,
                    passType: pass.passType,
                    passCharge: parseFloat(pass.charge)
                }))
            };

            // Check for format query parameter
            if (req.query.format === 'csv') {
                try {
                    const formatted_rows = response.passList.flatMap(pass => ({
                        stationID: response.stationID,
                        stationOperator: response.stationOperator,
                        requestTimestamp: response.requestTimestamp,
                        periodFrom: response.periodFrom,
                        periodTo: response.periodTo,
                        npasses: response.npasses,
                        ...pass
                    }));
                    const fields = [
                        'stationID',
                        'stationOperator',
                        'requestTimestamp',
                        'periodFrom',
                        'periodTo',
                        'npasses',
                        'passIndex',
                        'passID',
                        'timestamp',
                        'tagID',
                        'tagProvider',
                        'passType',
                        'passCharge'
                    ];

                    const parser = new Parser({ fields });
                    const csv = parser.parse(formatted_rows);

                    res.header('Content-Type', 'text/csv');
                    res.attachment('tollStationPasses.csv');
                    // Return the results in csv format
                    return res.status(200).send(csv);   
                } catch (csvError) {            //Error Handling
                    console.error('Error generating CSV:', csvError);   
                    return res.status(500).json({ error: 'Error generating CSV' });
                }
            }  
            
            return res.status(200).json(response);
        });
    });
};

