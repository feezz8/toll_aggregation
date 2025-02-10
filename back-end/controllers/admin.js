const { pool } = require('../utils/database');
const multer = require('multer');
const csv = require('fast-csv');
const upload = multer({ storage: multer.memoryStorage() });

exports.healthcheck = async(req, res) => {
    const query = `
    SELECT 
        COUNT(DISTINCT s.ID) as station_count,
        COUNT(DISTINCT p.tagRef) as tag_count,
        COUNT(DISTINCT p.ID) as pass_count
    FROM toll_stations s
    CROSS JOIN passes p
    LIMIT 1;
    `;
    pool.getConnection((err, connection) => {
        if(err) return res.status(500).json({ message: 'Connection pool is saturated' });

        connection.query(query, (err, rows) => {

            connection.release();
            if(err) return res.status(401).json({ status: 'failed', dbconnection:' ' }); //Error on DB connection

            const response = {
                status: 'OK',
                dbconnection: ' ', //connection string
                n_stations: rows.station_count,
                n_tags: rows.tag_count,
                n_passes: rows.pass_count
            };
            
            return res.status(200).json(response);
        });
    });
};

exports.resetstations = [   
    upload.single('file'), 
    async(req, res) => {
    if(!req.file){
        return res.status(400).json({error: 'no file '});
    }
    if(req.file.mimetype !== 'text/csv'){
        console.log('Received file:', req.file.originalname);
        console.log('filetype:', req.file.mimetype);
        return res.status(400).json({error: 'wrong format'});
    }

    pool.getConnection((err, connection) => {
        if(err) return res.status(500).json({ status: 'failed', info: 'Connection pool is saturated' });

        trunc_query =`
        TRUNCATE TABLE toll_stations;
        `;
        connection.query(trunc_query, (err) => {
            if (err) {
                console.error("Error truncating table:", err);
                return res.status(401);
            }
            console.log("Table truncated successfully.");
        });

        const csvParser = csv.parse({headers: true});

        const stations = [];
        const stream = require('stream');
        const readable = new stream.Readable();
        readable._read = () => {}; //No-op
        readable.push(req.file.buffer);
        readable.push(null);

        readable.pipe(csvParser)
            .on('data', (row) => {
                stations.push([row.OpID, row.Operator, row.TollID,
                    row.Name, row.PM, row.Locality, row.Road, row.Lat, 
                    row.Long, row.Email, row.Price1, row.Price2, row.Price3]);
            })
            .on('end', async () => {
                if (stations.length > 0) {
                    const insert_query = `
                    INSERT INTO toll_stations (OpID, TollOperator, TollID, TollName, PM, Locality, Road, Latitude, Longtitude, Email, Price1, Price2, Price3) VALUES ?
                    `;
                    connection.query(insert_query, [stations], (err) => {
                        console.log(err);
                        if(err) return res.status(401).json({status: 'failed', info: 'DB connection refused'});

                        connection.release();
                        return res.status(200).json({status: 'OK'});
                    });
                }
            });  
    });
}];

exports.resetpasses = async(req, res) => {
    const query = `
    TRUNCATE TABLE passes
    `;

    pool.getConnection((err, connection) => {
        if(err) return res.status(500).json({ status: 'failed', info: 'Connection pool is saturated' });

        connection.query(query, (err, rows) => {
            connection.release();
            if(err) return res.status(401).json({ status: 'failed', dbconnection:' ' }); //Error on DB connection          
            return res.status(200).json({status: 'OK'});
        });
    });
};

exports.addpasses = [
    upload.single('file'), 
    async(req, res) => {
    if(!req.file){
        return res.status(400).json({error: 'no file '});
    }
    if(req.file.mimetype !== 'text/csv'){
        console.log('Received file:', req.file.originalname);
        console.log('filetype:', req.file.mimetype);
        return res.status(400).json({error: 'wrong format'});
    }

    pool.getConnection((err, connection) => {
        if(err) return res.status(500).json({ status: 'failed', info: 'Connection pool is saturated' });
        

        const csvParser = csv.parse({headers: true});

        const passes = [];
        const stream = require('stream');
        const readable = new stream.Readable();
        readable._read = () => {}; //No-op
        readable.push(req.file.buffer);
        readable.push(null);

        readable.pipe(csvParser)
            .on('data', (row) => {
                passes.push([row.timestamp, row.tollID, row.tagRef, row.tagHomeID, row.charge]);
            })
            .on('end', async () => {
                if (passes.length > 0) {
                    const query = `
                    INSERT INTO passes (timestamp, tollID, tagRef, tagHomeID, charge) VALUES ?
                    `;
                    connection.query(query, [passes], (err) => {
                        console.log(err);
                        if(err) return res.status(401).json({status: 'failed', info: 'DB connection refused'});
    
                        connection.release();
                        return res.status(200).json({status: 'OK'});
                    });
                }
            });  
    });
}];