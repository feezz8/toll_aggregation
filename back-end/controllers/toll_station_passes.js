const { pool } = require('../utils/database');
const { validateFields } = require('../utils/missing_params')
const { Parser } = require.apply('json2csv');


exports.get_data = async (req, res, next) => {
    const {station_id, start_date, end_date}  = req.params;

    const required_params = ['tollStationID', 'date_from', 'date_to'];
    const missing_params = validateFields(req, 'query', required_params);

    if(missing_params.length > 0) {
        return res.status(400).json({message: `Missing query parameters: ${missingParams.join(', ')}` });
    }
    /*
    let limit = undefined;
    if(req.query.limit){
        limit = Number(req.query.limit);
        if(!Number.isInteger(limit)) return res.status(400).json({ message: 'Limit query param should be an Integer'});
    }
    */
 // SQL query to fetch the required data
    const query = `
        SELECT 
            p.tollStationID, 
            p.stationOperator, 
            NOW() AS requestTimestamp, 
            ? AS periodFrom, 
            ? AS periodTo, 
            COUNT(p.passID) OVER (PARTITION BY p.stationID) AS nPasses,  -- Running total of passes
            ROW_NUMBER() OVER (PARTITION BY p.stationID ORDER BY p.passID) AS passIndex,  -- Pass sequence per station
            p.passID,
            p.timestamp,
            p.tagID,
            p.tagProvider,
            p.passType,
            p.passCharge
        FROM toll_passes p
        WHERE 
            p.tollStationID = ? 
            AND p.passDate BETWEEN ? AND ?
        ORDER BY p.stationID, p.timestamp;
    `;
   // Execute the query
    pool.getConnection((err, connection) => {

        if(err) return res.status(500).json({message: 'Cannot connect to DB!'});

        connection.query(query, [start_date, end_date, station_id, start_date, end_date], (err, rows) =>{
            connection.release(); //Release the connection from the pool
            if(err) return res.status(500).json({message: 'Internal Server Error'});
            
            // Check for format query parameter
            if (req.query.format === 'csv') {
                try {
                    const formatted_rows = rows.flatMap(row =>
                        row.passList.map((pass, index) => ({
                            stationID: row.stationID,
                            stationOperator: row.stationOperator,
                            requestTimestamp: row.requestTimestamp,
                            periodFrom: row.periodFrom,
                            periodTo: row.periodTo,
                            npasses: row.npasses,
                            passIndex: index + 1, // Pass number
                            passID: pass.passID,
                            timestamp: pass.timestamp,
                            tagID: pass.tagID,
                            tagProvider: pass.tagProvider,
                            passType: pass.passType,
                            passCharge: pass.passCharge
                        }))
                    );
            
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
            
            //Check empty dataset
            if(rows.length === 0){
                return res.json({ message: "No data found!" });
            }
            const response = {
                stationID: station_id,
                stationOperator: rows.stationOperator,
                requestTimestamp: new Date().toISOString(),
                periodFrom: start_date,
                periodTo: end_date,
                npasses: rows.nPasses,
                passList: rows.map(pass => ({
                    passIndex: rows.passIndex, // Pass number
                    passID: pass.passID,
                    timestamp: pass.timestamp,
                    tagID: pass.tagID,
                    tagProvider: pass.tagProvider,
                    passType: pass.passType,
                    passCharge: parseFloat(pass.passCharge)
                }))
            };

            return res.status(200).json(response);
        });
    });
};



