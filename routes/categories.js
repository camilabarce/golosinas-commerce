var express = require('express');
var router = express.Router();

const connection = require("./../db-connection");

router.get('/', async function (req, res, next) {
    try {
        const [rows] = await connection.query('SELECT * FROM categorias');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
});

module.exports = router;