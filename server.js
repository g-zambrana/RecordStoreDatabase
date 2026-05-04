// =========================================================
// RECORD STORE INVENTORY MANAGER
// Express Server + MySQL Connection
// =========================================================

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

// =========================================================
// TEST DATABASE CONNECTION
// =========================================================

app.get('/api/test', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT "Database connected successfully" AS message'
    );

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================================================
// RETRIEVE PRODUCTS
// =========================================================

app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.product_id,
        p.album_id,
        p.supplier_id,
        a.album_title,
        p.format,
        p.price,
        p.condition_type,
        p.stock_quantity
      FROM products p
      JOIN albums a ON p.album_id = a.album_id
      ORDER BY p.product_id;
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================================================
// ADD PRODUCT
// =========================================================

app.post('/api/products', async (req, res) => {
  try {
    const {
      album_id,
      supplier_id,
      format,
      price,
      condition_type,
      stock_quantity
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO products 
        (album_id, supplier_id, format, price, condition_type, stock_quantity)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        album_id,
        supplier_id || null,
        format,
        price,
        condition_type,
        stock_quantity
      ]
    );

    res.json({
      message: 'Product added successfully',
      product_id: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================================================
// UPDATE PRODUCT STOCK
// =========================================================

app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { stock_quantity } = req.body;

    await db.query(
      `UPDATE products 
       SET stock_quantity = ? 
       WHERE product_id = ?`,
      [stock_quantity, id]
    );

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================================================
// DELETE PRODUCT
// =========================================================

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [saleItems] = await db.query(
      `SELECT * FROM sale_items WHERE product_id = ?`,
      [id]
    );

    if (saleItems.length > 0) {
      return res.status(400).json({
        error: 'This product cannot be deleted because it is connected to a sale record.'
      });
    }

    await db.query(
      `DELETE FROM products 
       WHERE product_id = ?`,
      [id]
    );

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================================================
// ADD ALBUM
// =========================================================

app.post('/api/albums', async (req, res) => {
  try {
    const { album_title, release_year, genre_id } = req.body;

    const [result] = await db.query(
      `INSERT INTO albums 
        (album_title, release_year, genre_id)
       VALUES (?, ?, ?)`,
      [album_title, release_year, genre_id]
    );

    res.json({
      message: 'Album added successfully',
      album_id: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================================================
// START SERVER
// =========================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});