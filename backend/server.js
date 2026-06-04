require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const compression = require("compression");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(compression());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  min: 4,
  acquireTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("connect", () => {
  console.log("Conectado a PostgreSQL AWS RDS");
});

pool.on("error", (err) => {
  console.error("Error inesperado en cliente del pool:", err.message);
});

// Obtener lista de productos
app.get("/api/productos", async (req, res) => {
  console.time("DB_PRODUCTOS");
  try {
    const result = await pool.query(
      'SELECT DISTINCT d."Producto", p."Descripcion" FROM detadoc d INNER JOIN producto p ON d."Producto" = p."Producto" ORDER BY d."Producto"',
    );
    console.timeEnd("DB_PRODUCTOS");
    res.json(result.rows);
  } catch (err) {
    console.timeEnd("DB_PRODUCTOS");
    console.error("Error en /api/productos:", err.message);
    res
      .status(500)
      .json({ error: "Error al obtener productos", detalle: err.message });
  }
});

// Consultar kardex
app.post("/api/kardex", async (req, res) => {
  console.time("TOTAL_REQUEST");
  const { fecha1, fecha2, producto } = req.body;

  if (!fecha1 || !fecha2 || !producto) {
    console.timeEnd("TOTAL_REQUEST");
    return res
      .status(400)
      .json({ error: "Faltan parametros: fecha1, fecha2, producto" });
  }

  try {
    console.time("DB_KARDEX");
    const result = await pool.query(
      "SELECT * FROM kardex_consulta($1, $2, $3)",
      [fecha1, fecha2, producto],
    );
    console.timeEnd("DB_KARDEX");
    console.timeEnd("TOTAL_REQUEST");
    res.json(result.rows);
  } catch (err) {
    console.timeEnd("DB_KARDEX");
    console.timeEnd("TOTAL_REQUEST");
    console.error("Error en /api/kardex:", err.message);
    res
      .status(500)
      .json({ error: "Error al consultar kardex", detalle: err.message });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor backend corriendo en http://0.0.0.0:${PORT}`);
});
