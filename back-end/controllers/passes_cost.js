const { pool } = require('../utils/database');
const { validateFields } = require('../utils/missing_params')
const { Parser } = require('json2csv');



exports.get_data = async (req, res, next) => {
    const {tollOpID, tagOpID, date_from, date_to}  = req.params;

    const required_params = ['tollOpID', 'tagOpID', 'date_from', 'date_to'];
    const missing_params = validateFields(req, 'params', required_params);

    if(missing_params.length > 0) {
        return res.status(400).json({message: `Missing query parameters: ${missing_params.join(', ')}` });
    }

    const query = `
        SELECT 
            p.tollOpID,
            p.tagHomeID,
            NOW() AS requestTimestamp,
            ? AS periodFrom, 
            ? AS periodTo,
            COUNT(*) OVER (PARTITION BY p.tollOpID, p.tagHomeID) AS nPasses,
            SUM(p.charge) OVER (PARTITION BY p.tollOpID, p.tagHomeID) AS passesCost
        FROM passes p
        WHERE 
            p.tollOpID = ? 
            AND p.tagHomeID = ?
            AND p.timestamp BETWEEN 
                STR_TO_DATE(?, '%Y%m%d') 
            AND 
                STR_TO_DATE(?, '%Y%m%d') + INTERVAL 1 DAY - INTERVAL 1 SECOND  
        ORDER BY p.tollOpID, p.timestamp;
    `;

   // Execute the query
   pool.getConnection((err, connection) => {

    if(err) return res.status(500).json({message: 'Connection pool is saturated!'});

    connection.query(query, [date_from, date_to, tollOpID, tagOpID, date_from, date_to], (err, rows) =>{
        connection.release(); //Release the connection from the pool
        console.log(err);
        if(err) return res.status(500).json({message: 'Internal Server Error'});
        //Check empty dataset

        if(rows.length === 0){
            const no_data ={
                message:'no data found'
            };
            return res.status(400).json(no_data);
        }

        const response = {
            tollOpID: tollOpID,
            tagOpID: tagOpID,
            requestTimestamp: new Date().toISOString(),
            periodFrom: date_from,
            periodTo: date_to,
            nPasses: parseInt(rows[0].nPasses),
            passesCost: parseFloat(rows[0].passesCost)
        };
        
        // Check for format query parameter
        if (req.query.format === 'csv') {
            try {     
                const fields = [
                    'tollOpID',
                    'tagOpID',
                    'requestTimestamp',
                    'periodFrom',
                    'periodTo',
                    'nPasses',
                    'passesCost'
                ];

                const parser = new Parser({ fields });
                const csv = parser.parse(response);

                res.header('Content-Type', 'text/csv');
                res.attachment('passesCost.csv');
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