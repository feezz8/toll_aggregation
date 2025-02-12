const { pool } = require('../utils/database');
const { validateFields } = require('../utils/missing_params')
const { Parser } = require('json2csv');



exports.get_data = async (req, res, next) => {
    const {tollOpID, date_from, date_to}  = req.params;

    const required_params = ['tollOpID', 'date_from', 'date_to'];
    const missing_params = validateFields(req, 'params', required_params);

    if(missing_params.length > 0) {
        return res.status(400).json({message: `Missing query parameters: ${missing_params.join(', ')}` });
    }

    const query = `
        SELECT 
            p.tagHomeID AS visitingOpID,
            ? AS periodFrom,
            ? AS periodTo,
            COUNT(*) AS nPasses,
            SUM(p.charge) AS passesCost
        FROM passes p
        WHERE 
            p.tollOpID = ?           -- our operator (the toll station owner)
            AND p.tagHomeID <> ?   -- only include visiting operators
            AND p.timestamp BETWEEN 
                STR_TO_DATE(?, '%Y%m%d') 
            AND 
                STR_TO_DATE(?, '%Y%m%d') + INTERVAL 1 DAY - INTERVAL 1 SECOND
        GROUP BY p.tagHomeID
        ORDER BY p.tagHomeID;  
    `;
   // Execute the query
    pool.getConnection((err, connection) => {

        if(err) return res.status(500).json({message: 'Connection pool is saturated'});

        connection.query(query, [date_from, date_to, tollOpID, tollOpID, date_from, date_to], (err, rows) =>{
            
            connection.release(); //Release the connection from the pool
            if(err) return res.status(500).json({message: 'Internal Server Error'});
    
            if(rows.length === 0){
                const no_data ={
                    message:'no data found'
                };
                return res.status(400).json(no_data);
            }     

            const response = {
                tollOpID: tollOpID,
                requestTimestamp: new Date().toISOString(),
                periodFrom: date_from,
                periodTo: date_to,
                vOpList: rows.map(vOp => ({
                    visitingOpID: vOp.visitingOpID,
                    nPasses: vOp.nPasses,
                    passesCost: parseFloat(vOp.passesCost)
                }))
            };

            // Check for format query parameter
            if (req.query.format === 'csv') {
                try {
                    const formatted_rows = response.vOpList.flatMap(pass => ({
                            tollOpID: response.tollOpID,
                            requestTimestamp: response.requestTimestamp,
                            periodFrom: response.periodFrom,
                            periodTo: response.periodTo,
                            ...pass
                        }));
            
                    const fields = [
                        'tollOpID',
                        'requestTimestamp',
                        'periodFrom',
                        'periodTo',
                        'visitingOpID',
                        'nPasses',
                        'passesCost'
                    ];

                    const parser = new Parser({ fields });
                    const csv = parser.parse(formatted_rows);

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