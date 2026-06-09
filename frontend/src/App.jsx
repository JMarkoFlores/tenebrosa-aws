import { memo, useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const Row = memo(({ row }) => (
  <tr className={row.documento === "SALDO INICIAL" ? "fila-saldo-inicial" : ""}>
    <td>{row.nro}</td>
    <td>{row.documento}</td>
    <td>{row.tipomov}</td>
    <td>{row.fecha}</td>
    <td>{row.cantidad}</td>
    <td>{row.stock}</td>
  </tr>
));

function App() {
  const [productos, setProductos] = useState([]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
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
          setProducto(res.data[0].codigo);
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

    if (fechaInicio > fechaFin) {
      setMensaje("La fecha inicial no puede ser mayor que la fecha final.");
      setResultados([]);
      setCargando(false);
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/api/kardex`, {
        params: {
          fechaInicio,
          fechaFin,
          producto,
        },
      });
      const t1 = performance.now();
      console.log(`[FE] Llamada API: ${(t1 - t0).toFixed(1)}ms`);

      const normalizados = res.data.map((f) => ({
        nro: f.nro ?? "-",
        documento: f.documento || "-",
        tipomov: f.tipomov || "-",
        fecha: f.fecha || "-",
        cantidad: f.cantidad ?? 0,
        stock: f.stock ?? 0,
      }));

      setResultados(normalizados);
      if (normalizados.length === 0) {
        setMensaje(
          "No se encontraron registros para los filtros seleccionados.",
        );
      }
    } catch (err) {
      setResultados([]);
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
      <Row key={`${f.nro}-${idx}`} row={f} />
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
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            required
          />
        </div>

        <div className="fila">
          <label>Fecha Fin:</label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
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
            {productos.map((p) => (
              <option key={p.codigo} value={p.codigo}>
                {p.codigo} - {p.descripcion || "Sin descripción"}
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
              <th>Tipo movimiento</th>
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
