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
      "SELECT * FROM public.fn_listar_productos()",
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

// Resumen del dashboard
app.get("/api/dashboard/resumen", async (req, res) => {
  console.time("DB_DASHBOARD_RESUMEN");
  try {
    const result = await pool.query(
      "SELECT * FROM public.fn_dashboard_resumen()",
    );
    console.timeEnd("DB_DASHBOARD_RESUMEN");
    res.json(result.rows[0] || {});
  } catch (err) {
    console.timeEnd("DB_DASHBOARD_RESUMEN");
    console.error("Error en /api/dashboard/resumen:", err.message);
    res.status(500).json({
      error: "Error al obtener el resumen del dashboard",
      detalle: err.message,
    });
  }
});

// Lista de productos para el modulo Productos
app.get("/api/productos/modulo", async (req, res) => {
  console.time("DB_PRODUCTOS_MODULO");
  try {
    const result = await pool.query(
      "SELECT * FROM public.fn_listar_productos_modulo()",
    );
    console.timeEnd("DB_PRODUCTOS_MODULO");
    res.json(result.rows);
  } catch (err) {
    console.timeEnd("DB_PRODUCTOS_MODULO");
    console.error("Error en /api/productos/modulo:", err.message);
    res.status(500).json({
      error: "Error al obtener la lista de productos del modulo",
      detalle: err.message,
    });
  }
});

// Consultar kardex
app.get("/api/kardex", async (req, res) => {
  console.time("TOTAL_REQUEST");
  const { fechaInicio, fechaFin, producto } = req.query;

  if (!fechaInicio || !fechaFin || !producto) {
    console.timeEnd("TOTAL_REQUEST");
    return res
      .status(400)
      .json({ error: "Faltan parametros: fechaInicio, fechaFin, producto" });
  }

  if (fechaInicio > fechaFin) {
    console.timeEnd("TOTAL_REQUEST");
    return res
      .status(400)
      .json({
        error: "La fecha inicial no puede ser mayor que la fecha final",
      });
  }

  try {
    console.time("DB_KARDEX");
    const result = await pool.query(
      "SELECT * FROM public.fn_kardex_consulta($1::DATE, $2::DATE, $3::CHAR(4))",
      [fechaInicio, fechaFin, producto],
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
