const { pool } = require('../utils/database');
const { fs } = require('fs');
const { path } = require('path');
const { csv } = require('csv-parser');
const { multer } = require('multer');


const upload = multer({ storage: multer.memoryStorage() });

exports.healthcheck = async(res) => {
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

exports.reset_stations = async(req, res) => {
    const tollstations2024 = path.dirname('../utils/tollstations2024.csv');
    const stations = [];

    pool.getConnection((err, connection) => {

        if(err) return res.status(500).json({ message: 'Connection pool is saturated' });

        fs.create_read_stream(tollstations2024)
        .pipe(csv())
        .on('data', (row) => {
            stations.push([row.OpId, row.Operator, row.TollID,
                        row.Name, row.PM, row.Locality, row.Road, row.Lat, 
                        row.Long, row.Email, row.Price1, row.Price2, row.Price3]);
        })
        .on('end', async() => {
            if(stations.length > 0){
                const insert_query = `
                TRUNCATE TABLE toll_stations
                INSERT INTO toll_stations (OpId, Operator, TollID,
                        Name, PM, Locality, Road, Lat, 
                        Long, Email, Price1, Price2, Price3) VALUES ?
                `;
                connection(insert_query, [stations], (err) => {
                    if(err) return res.status(401).json({status: 'failed', info: 'DB connection refused'});

                    connection.release();
                    return res.status(200).json({status: OK});
                });
            }
        });
    });
};

exports.reset_passes = async(req, res) => {
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

exports.add_passes = [
    upload.single('file'), 
    async(req, res) => {
    if(!req.file || req.file.mimetype !== 'text/csv'){
        return res.status(400).json({error: 'Invalid file format'});
    }

    pool.getConnection((err, connection) => {
        if(err) return res.status(500).json({ status: 'failed', info: 'Connection pool is saturated' });
        
        const passes = [];
        const stream = require('stream');
        const readable = new stream.Readable();
        readable._read = () => {}; //No-op
        readable.push(req.file.buffer);
        readable.push(null);

        readable    
            .pipe(csv())
            .on('data', (row) => {
                passes.push([row.timestamp, row.tollID, row.tagRef, row.tagHomeID, row.charge]);
            })
            .on('end', async () => {
                if (passes.length > 0) {
                    const query = `
                    --TRUNCATE TABLE passes
                    INSERT INTO passes (timestamp, tollID, tagRef, tagHomeID, charge) VALUES ?
                    `;
                    connection(query, [stations], (err) => {
                        if(err) return res.status(401).json({status: 'failed', info: 'DB connection refused'});
    
                        connection.release();
                        return res.status(200).json({status: OK});
                    });
                }
            });  
    });
}];