const { pool } = require('../utils/database');
const { validateFields } = require('../utils/missing_params')
const { Parser } = require('json2csv');



exports.get_data = async (req, res, next) => {
    const {toll_op_id, start_date, end_date}  = req.params;

    const required_params = ['tollOpID', 'date_from', 'date_to'];
    const missing_params = validateFields(req, 'query', required_params);

    if(missing_params.length > 0) {
        return res.status(400).json({message: `Missing query parameters: ${missingParams.join(', ')}` });
    }

    const query = `
        SELECT 
            ? AS tollOpID,
            NOW() AS requestTimestamp,
            ? AS periodFrom,
            ? AS periodTo,
            p.tagHomeID AS visitingOpID,
            COUNT(p.ID) AS nPasses,
            SUM(p.charge) AS passesCost
        FROM passes p
        WHERE 
            p.tollOpID = ?  -- Filter by the toll operator
            AND p.tagHomeID <> ?  -- Ensure the visiting operator is different
            AND p.timestamp BETWEEN ? AND ?
        GROUP BY p.tagHomeID;   
    `;
   // Execute the query
    pool.getConnection((err, connection) => {

        if(err) return res.status(500).json({message: 'Connection pool is saturated'});

        connection.query(query, [toll_op_id, start_date, end_date, toll_op_id, toll_op_id, start_date, end_date], (err, rows) =>{
            
            connection.release(); //Release the connection from the pool
            if(err) return res.status(500).json({message: 'Internal Server Error'});
            
            // Check for format query parameter
            if (req.query.format === 'csv') {
                try {
                    const formatted_rows = rows.flatMap(row =>
                        row.passList.map((pass) => ({
                            tollOpID: row.tollOpID,
                            tagOpId: row.tagOpID,
                            requestTimestamp: row.requestTimestamp,
                            periodFrom: row.periodFrom,
                            periodTo: row.periodTo,
                            visitingOpID: pass.tagOpID,
                            nPasses: pass.nPasses,
                            passesCost: pass.passesCost
                        }))
                    );
            
                    const fields = [
                        'tollOpID',
                        'requestTimestamp',
                        'periodFrom',
                        'periodTo',
                        'visitingOpId',
                        'npasses',
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
            
            if(rows.length === 0){
                return res.json({ message: "No data found!" });
            }     

            const response = {
                tollOpID: toll_op_id,
                requestTimestamp: new Date().toISOString(),
                periodFrom: start_date,
                periodTo: end_date,
                vOpList: rows.map(row => ({
                    visitingOpID: row.visitingOpID,
                    nPasses: row.nPasses,
                    passesCost: parseFloat(row.passesCost)
                }))
            };
            return res.status(200).json(rows);
        });
    });
};
