var express = require('express');
var router = express.Router();
const connection = require("./../db-connection");
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Configuración de multer para subir archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

router.get('/', async function (req, res, next) {
  const query = `
    SELECT 
        p.productoID,
        p.descripcion,
        p.precio_unidad,
        m.marca,
        c.categoria,
        p.imagen
    FROM 
        productos p
    JOIN 
        marca m ON p.marcaID = m.marcaID
    JOIN 
        categorias c ON p.categoriaID = c.categoriaID;
  `;

  try {
    const [results] = await connection.query(query);
    res.json(results);
  } catch (error) {
    console.error('Error al obtener los productos:', error);
    res.status(500).json({ error: 'Error al obtener los productos' });
  }
});

router.get('/:id', async function (req, res, next) {
  const productoID = req.params.id;
  const query = `
    SELECT 
      p.productoID,
      p.descripcion,
      p.precio_unidad,
      m.marcaID,
      m.marca,
      c.categoriaID,
      c.categoria,
      p.imagen
    FROM 
        productos p
    JOIN 
        marca m ON p.marcaID = m.marcaID
    JOIN 
        categorias c ON p.categoriaID = c.categoriaID
    WHERE
        p.productoID = ?;
  `;

  try {
    const [results] = await connection.query(query, [productoID]);
    if (results.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.json(results[0]);
  } catch (error) {
    console.error('Error al obtener el producto:', error);
    res.status(500).json({ error: 'Error al obtener el producto' });
  }
});


router.put('/:id', upload.single('imagen'), async function (req, res, next) {
  const productoID = req.params.id;
  const { descripcion, precio_unidad, marcaID, categoriaID } = req.body;
  const imagen = req.file;

  console.log('Datos recibidos:', req.body);
  console.log('Archivo recibido:', req.file);

  if (!descripcion || !precio_unidad || !marcaID || !categoriaID) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  try {
    // Obtener la imagen existente del producto
    const [rows] = await connection.query('SELECT imagen FROM productos WHERE productoID = ?', [productoID]);
    let imagenPath = rows.length > 0 ? rows[0].imagen : null;

    // Si se cargó una nueva imagen
    if (imagen) {
      imagenPath = `/images/productos/${imagen.filename}`; // Ruta destino en la carpeta images

      // Mover la imagen del directorio temporal a la carpeta de imágenes pública
      const oldPath = imagen.path;
      const newPath = path.join(__dirname, '../public', imagenPath);
      fs.renameSync(oldPath, newPath);
    }

    // Actualizar el producto en la base de datos
    const query = `
        UPDATE productos
        SET descripcion = ?, precio_unidad = ?, marcaID = ?, categoriaID = ?, imagen = ?
        WHERE productoID = ?
    `;
    const values = [descripcion, precio_unidad, marcaID, categoriaID, imagenPath, productoID];
    await connection.query(query, values);

    res.json({ message: 'Producto actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar el producto:', error);
    return res.status(500).json({ error: 'Error al actualizar el producto' });
  }
});

router.post('/', upload.single('imagen'), async function (req, res, next) {
  const { descripcion, precio_unidad, marcaID, categoriaID } = req.body;
  const imagen = req.file;

  console.log('Datos recibidos:', req.body);
  console.log('Archivo recibido:', req.file);

  if (!descripcion || !precio_unidad || !marcaID || !categoriaID) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  try {
    const imagenPath = `/images/productos/${imagen.filename}`; // Ruta destino en la carpeta images

    // Mover la imagen del directorio temporal a la carpeta de imágenes pública
    const oldPath = imagen.path;
    const newPath = path.join(__dirname, '../public', imagenPath);
    fs.renameSync(oldPath, newPath);

    // Insertar el producto en la base de datos
    const query = `
        INSERT INTO productos (descripcion, precio_unidad, marcaID, categoriaID, imagen)
        VALUES (?, ?, ?, ?, ?)
    `;
    const values = [descripcion, precio_unidad, marcaID, categoriaID, imagenPath];
    await connection.query(query, values);

    res.status(200).json({ message: 'Producto agregado exitosamente' });
  } catch (error) {
    console.error('Error al agregar el producto:', error);
    return res.status(500).json({ error: 'Error al agregar el producto' });
  }
});

router.delete('/:id', async function (req, res, next) {
  const productoID = req.params.id;

  try {
    // Obtener la imagen del producto
    const [rows] = await connection.query('SELECT imagen FROM productos WHERE productoID = ?', [productoID]);
    const imagenPath = rows.length > 0 ? rows[0].imagen : null;

    // Eliminar el producto de la base de datos
    await connection.query('DELETE FROM productos WHERE productoID = ?', [productoID]);

    // Eliminar la imagen del producto
    if (imagenPath) {
      const imagePath = path.join(__dirname, '../public', imagenPath);
      fs.unlinkSync(imagePath);
    }

    res.json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar el producto:', error);
    return res.status(500).json({ error: 'Error al eliminar el producto' });
  }
});

module.exports = router;