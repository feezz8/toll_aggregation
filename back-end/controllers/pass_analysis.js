const { pool } = require('../utils/database');
const { validateFields } = require('../utils/missing_params')
const { Parser } = require('json2csv');



exports.get_data = async (req, res, next) => {
    const {station_op_id, tag_op_id, start_date, end_date}  = req.params;

    const required_params = ['stationOpID', 'tagOpID', 'date_from', 'date_to'];
    const missing_params = validateFields(req, 'query', required_params);

    if(missing_params.length > 0) {
        return res.status(400).json({message: `Missing query parameters: ${missingParams.join(', ')}` });
    }

    const query = `
        SELECT 
            p.tollOpID,
            p.tagHomeID,
            NOW() AS requestTimestamp,
            ? AS periodFrom, 
            ? AS periodTo,
            COUNT(p.ID) OVER(PARTITION BY p.tollID, p.tagHomeID) AS nPasses,
            ROW_NUMBER() OVER (PARTITION BY p.tollID ORDER BY p.ID) AS passIndex,
            p.ID,
            p.tollID
            p.timestamp,
            p.tagRef,
            p.charge
        FROM passes p
        WHERE p.tollOpID = ? 
        AND p.tagHomeID = ?
        AND p.timestamp BETWEEN ? AND ?
        ORDER BY p.tollID, p.timestamp;
    `;

   // Execute the query
    pool.getConnection((err, connection) => {

        if(err) return res.status(500).json({message: 'Connection pool is saturated'});

        connection.query(query, [start_date, end_date, station_op_id, tag_op_id, , start_date, end_date], (err, rows) =>{
            connection.release(); //Release the connection from the pool
            if(err) return res.status(500).json({message: 'Internal Server Error'});
            
            // Check for format query parameter
            if (req.query.format === 'csv') {
                try {
                    const formatted_rows = rows.flatMap(row =>
                        row.passList.map((pass, index) => ({
                            stationID: row.stationID,
                            tagOpId: row.tagOpID,
                            requestTimestamp: row.requestTimestamp,
                            periodFrom: row.periodFrom,
                            periodTo: row.periodTo,
                            npasses: row.npasses,
                            passIndex: index + 1, // Pass number
                            passID: pass.passID,
                            stationID: pass.stationID,
                            timestamp: pass.timestamp,
                            tagID: pass.tagID,
                            passCharge: pass.passCharge
                        }))
                    );
            
                    const fields = [
                        'stationID',
                        'tagOpID',
                        'requestTimestamp',
                        'periodFrom',
                        'periodTo',
                        'npasses',
                        'passIndex',
                        'passID',
                        'stationID',
                        'timestamp',
                        'tagID',
                        'passCharge'
                    ];

                    const parser = new Parser({ fields });
                    const csv = parser.parse(formatted_rows);

                    res.header('Content-Type', 'text/csv');
                    res.attachment('passAnalysis.csv');
                    // Return the results in csv format
                    return res.status(200).send(csv);   
                } catch (csvError) {            //Error Handling
                    console.error('Error generating CSV:', csvError);   
                    return res.status(500).json({ error: 'Error generating CSV' });
                }
            }      
         
            //Check empty dataset
            if(rows.length === 0){
                return res.json({ message: "No data found!" });
            }
            const response = {
                stationOpID: station_op_id,
                tagOpID: tag_op_id,
                requestTimestamp: new Date().toISOString(),
                periodFrom: start_date,
                periodTo: end_date,
                npasses: rows.nPasses,
                passList: rows.map(pass => ({
                    passIndex: rows.passIndex, // Pass number
                    passID: pass.passID,
                    stationID: pass.stationID,
                    timestamp: pass.timestamp,
                    tagID: pass.tagID,
                    passCharge: parseFloat(pass.passCharge)
                }))
            };
            return res.status(200).json(response);
        });
    });
};
