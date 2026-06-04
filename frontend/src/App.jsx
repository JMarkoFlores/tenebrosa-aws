import { useEffect, useMemo, useState, memo } from "react";
import axios from "axios";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const Row = memo(({ idx, documento, tipomov, fecha, cantidad, stock }) => (
  <tr>
    <td>{idx}</td>
    <td>{documento}</td>
    <td>{tipomov}</td>
    <td>{fecha}</td>
    <td>{cantidad}</td>
    <td>{stock}</td>
  </tr>
));

function App() {
  const [productos, setProductos] = useState([]);
  const [fecha1, setFecha1] = useState("");
  const [fecha2, setFecha2] = useState("");
  const [producto, setProducto] = useState("");
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    let ignore = false;
    const t0 = performance.now();
    axios
      .get(`${API_URL}/api/productos`)
      .then((res) => {
        if (ignore) return;
        const t1 = performance.now();
        console.log(`[FE] Carga productos: ${(t1 - t0).toFixed(1)}ms`);
        setProductos(res.data);
        if (res.data.length > 0) {
          setProducto(res.data[0].Producto);
        }
      })
      .catch((err) => {
        if (ignore) return;
        setMensaje(
          "Error al cargar productos: " +
            (err.response?.data?.error || err.message),
        );
      });
    return () => {
      ignore = true;
    };
  }, []);

  const consultarKardex = async (e) => {
    e.preventDefault();
    const t0 = performance.now();
    setCargando(true);
    setMensaje("");

    try {
      const res = await axios.post(`${API_URL}/api/kardex`, {
        fecha1,
        fecha2,
        producto,
      });
      const t1 = performance.now();
      console.log(`[FE] Llamada API: ${(t1 - t0).toFixed(1)}ms`);

      // Pre-normalizar datos UNA sola vez para evitar || en cada render
      const normalizados = res.data.map((f) => ({
        documento: f.documento || f.Documento || "-",
        tipomov: f.tipomov || "-",
        fecha: f.fecha || f.Fecha || "-",
        cantidad: f.cantidad ?? f.Cantidad ?? 0,
        stock: f.stock ?? f.Stock ?? 0,
      }));

      setResultados(normalizados);
      if (normalizados.length === 0) {
        setMensaje(
          "No se encontraron registros para los filtros seleccionados.",
        );
      }
    } catch (err) {
      setMensaje(
        "Error en la consulta: " + (err.response?.data?.error || err.message),
      );
    } finally {
      setCargando(false);
      const t2 = performance.now();
      console.log(
        `[FE] Total percibido (click -> render): ${(t2 - t0).toFixed(1)}ms`,
      );
    }
  };

  const filas = useMemo(() => {
    const t0 = performance.now();
    const rows = resultados.map((f, idx) => (
      <Row
        key={idx}
        idx={idx + 1}
        documento={f.documento}
        tipomov={f.tipomov}
        fecha={f.fecha}
        cantidad={f.cantidad}
        stock={f.stock}
      />
    ));
    const t1 = performance.now();
    console.log(
      `[FE] Render tabla (${resultados.length} filas): ${(t1 - t0).toFixed(1)}ms`,
    );
    return rows;
  }, [resultados]);

  return (
    <div className="container">
      <h1 className="titulo">KARDEX DE INVENTARIO</h1>

      <form className="formulario" onSubmit={consultarKardex}>
        <div className="fila">
          <label>Fecha Inicio:</label>
          <input
            type="date"
            value={fecha1}
            onChange={(e) => setFecha1(e.target.value)}
            required
          />
        </div>

        <div className="fila">
          <label>Fecha Fin:</label>
          <input
            type="date"
            value={fecha2}
            onChange={(e) => setFecha2(e.target.value)}
            required
          />
        </div>

        <div className="fila">
          <label>Producto:</label>
          <select
            value={producto}
            onChange={(e) => setProducto(e.target.value)}
            required
          >
            {productos.map((p, idx) => (
              <option key={idx} value={p.Producto}>
                {p.Producto} - {p.Descripcion || "Sin descripción"}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn-consultar" disabled={cargando}>
          {cargando ? "Consultando..." : "Consultar"}
        </button>
      </form>

      {mensaje && <p className="mensaje">{mensaje}</p>}

      {resultados.length > 0 && (
        <table className="tabla">
          <thead>
            <tr>
              <th>Nro</th>
              <th>Documento</th>
              <th>Tipo Movimiento</th>
              <th>Fecha</th>
              <th>Cantidad</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>{filas}</tbody>
        </table>
      )}
    </div>
  );
}

export default App;
