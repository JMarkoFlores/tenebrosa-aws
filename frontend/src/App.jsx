import { memo, useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";
import DashboardModule from "./components/DashboardModule";
import ProductosModule from "./components/ProductosModule";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// const MODULES = [
//   "Dashboard",
//   "Productos",
//   "Documentos",
//   "Kardex",
//   "Reportes",
//   "Mantenimiento",
//   "Configuracion",
// ];

const MODULES = ["Dashboard", "Productos", "Kardex"];

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

function SidebarIcon({ type }) {
  switch (type) {
    case "Dashboard":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 4h7v7H4V4Zm9 0h7v5h-7V4ZM4 13h5v7H4v-7Zm7 0h9v7h-9v-7Z" />
        </svg>
      );
    case "Productos":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 2.3L6.2 8.5 12 11.8l5.8-3.3L12 5.3Zm-6 5v5l5 2.8v-5L6 10.3Zm7 7.8 5-2.8v-5l-5 2.8v5Z" />
        </svg>
      );
    case "Documentos":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 3h7l5 5v13H7V3Zm2 2v14h8V9h-4V5H9Z" />
        </svg>
      );
    case "Kardex":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 4h12v16H6V4Zm2 2v12h8V6H8Zm2 2h4v2h-4V8Zm0 4h4v2h-4v-2Z" />
        </svg>
      );
    case "Reportes":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 19h14v2H3V5h2v14Zm3-2-1.4-1.4 3.8-3.8 2.5 2.5 4.5-5L19 10.7 13 18l-2.6-2.6L8 17Z" />
        </svg>
      );
    case "Mantenimiento":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m21 7.5-4.2 4.2-2.5-2.5L18.5 5A5 5 0 0 0 11 11.3l-6.7 6.7a1.8 1.8 0 1 0 2.6 2.6l6.7-6.7A5 5 0 0 0 21 7.5Z" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2 9.8 4.2l-3.1-.7-.8 3-2.9 1.3 1.3 2.9-1.3 2.9 2.9 1.3.8 3 3.1-.7L12 22l2.2-2.2 3.1.7.8-3 2.9-1.3-1.3-2.9 1.3-2.9-2.9-1.3-.8-3-3.1.7L12 2Zm0 6a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" />
        </svg>
      );
  }
}

function App() {
  const [activeModule, setActiveModule] = useState("Kardex");
  const [productos, setProductos] = useState([]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [producto, setProducto] = useState("");
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [yaConsultado, setYaConsultado] = useState(false);

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

  const productoSeleccionado = useMemo(
    () => productos.find((item) => item.codigo === producto),
    [producto, productos],
  );

  const consultarKardex = async (e) => {
    e.preventDefault();
    const t0 = performance.now();

    setCargando(true);
    setMensaje("");
    setYaConsultado(true);

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
        cantidad: Number(f.cantidad ?? 0),
        stock: Number(f.stock ?? 0),
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

  const resumen = useMemo(() => {
    let stockInicial = 0;
    let totalEntradas = 0;
    let totalSalidas = 0;

    resultados.forEach((row, index) => {
      const movimiento = String(row.tipomov).toLowerCase();
      const documento = String(row.documento).toLowerCase();
      const cantidad = Number(row.cantidad) || 0;

      if (index === 0 || documento.includes("saldo inicial")) {
        if (documento.includes("saldo inicial")) {
          stockInicial = Number(row.stock) || 0;
        }
      }

      if (movimiento.includes("entrada") || movimiento.includes("ingreso")) {
        totalEntradas += cantidad;
      }

      if (movimiento.includes("salida") || movimiento.includes("egreso")) {
        totalSalidas += cantidad;
      }
    });

    return {
      stockInicial,
      totalEntradas,
      totalSalidas,
      stockFinal:
        resultados.length > 0
          ? Number(resultados[resultados.length - 1].stock) || 0
          : 0,
    };
  }, [resultados]);

  const renderKardexModule = () => (
    <>
      <section className="panel-card form-card">
        <div className="section-heading">Consulta de Kardex</div>

        <form className="kardex-form" onSubmit={consultarKardex}>
          <div className="field-group">
            <label htmlFor="fechaInicio">Fecha inicio</label>
            <input
              id="fechaInicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="fechaFin">Fecha fin</label>
            <input
              id="fechaFin"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="producto">Producto</label>
            <select
              id="producto"
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
      </section>

      <section className="panel-card table-card">
        <div className="section-heading product-heading">
          Kardex de Producto: {productoSeleccionado?.codigo || "-"}
        </div>

        <div className="table-wrapper">
          <table className="tabla">
            <thead>
              <tr>
                <th>NRO.</th>
                <th>DOCUMENTO</th>
                <th>TIPO DE MOVIMIENTO</th>
                <th>FECHA</th>
                <th>CANTIDAD</th>
                <th>STOCK</th>
              </tr>
            </thead>
            <tbody>
              {resultados.length > 0 ? (
                filas
              ) : (
                <tr>
                  <td colSpan="6" className="empty-cell">
                    {mensaje ||
                      (yaConsultado
                        ? "No se encontraron registros para los filtros seleccionados."
                        : "Ingresa fecha inicio, fecha fin y producto para consultar el kardex.")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <span className="stat-label">Stock inicial</span>
          <strong className="stat-value">{resumen.stockInicial}</strong>
        </article>

        <article className="stat-card">
          <span className="stat-label">Total entradas</span>
          <strong className="stat-value">{resumen.totalEntradas}</strong>
        </article>

        <article className="stat-card">
          <span className="stat-label">Total salidas</span>
          <strong className="stat-value">{resumen.totalSalidas}</strong>
        </article>

        <article className="stat-card">
          <span className="stat-label">Stock final</span>
          <strong className="stat-value">{resumen.stockFinal}</strong>
        </article>
      </section>
    </>
  );

  const renderPlaceholderModule = () => (
    <section className="panel-card placeholder-card">
      <div className="section-heading">{activeModule}</div>
      <p>Este modulo quedara en blanco por ahora.</p>
    </section>
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <h1>TENEBROSA</h1>
          <p>Tenebrosa System</p>
        </div>

        <nav className="sidebar-nav" aria-label="Modulos">
          {MODULES.map((moduleName) => (
            <button
              key={moduleName}
              type="button"
              className={`nav-item ${activeModule === moduleName ? "is-active" : ""}`}
              onClick={() => setActiveModule(moduleName)}
            >
              <span className="nav-icon">
                <SidebarIcon type={moduleName} />
              </span>
              <span>{moduleName}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">Panel administrativo</span>
            <h2>
              {activeModule === "Kardex"
                ? "Kardex / Movimientos"
                : activeModule}
            </h2>
          </div>

          <div className="topbar-actions">
            <div className="search-box">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Zm8.9 11.5 1.4 1.4-3 3-1.4-1.4 3-3Z" />
              </svg>
              <input type="text" placeholder="Buscar" readOnly />
            </div>

            <button
              type="button"
              className="icon-button"
              aria-label="Notificaciones"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 22a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 22Zm6-6V11a6 6 0 1 0-12 0v5L4 18v1h16v-1l-2-2Z" />
              </svg>
            </button>

            <div className="profile-pill">
              <span className="avatar">TJ</span>
              <span>Admin</span>
            </div>
          </div>
        </header>

        <div className="content-area">
          {activeModule === "Dashboard" ? (
            <DashboardModule />
          ) : activeModule === "Productos" ? (
            <ProductosModule />
          ) : activeModule === "Kardex" ? (
            renderKardexModule()
          ) : (
            renderPlaceholderModule()
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
