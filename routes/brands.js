var express = require('express');
var router = express.Router();

const connection = require("./../db-connection");

router.get('/', async function (req, res, next) {
    const query = `
    SELECT 
          *
    FROM 
        marca
    `;

    try {
        const [results] = await connection.query(query);
        res.json(results);
    } catch (error) {
        console.error('Error al obtener las marcas:', error);
        res.status(500).json({ error: 'Error al obtener las marcas' });
    }
});

module.exports = router;