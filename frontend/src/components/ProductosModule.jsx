import { useEffect, useMemo, useState } from "react";
import { getProductosModulo } from "../services/api";

function ProductosModule() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    const cargarProductos = async () => {
      setCargando(true);
      setError("");

      try {
        const data = await getProductosModulo();
        if (ignore) {
          return;
        }

        setProductos(data);
      } catch {
        if (ignore) {
          return;
        }

        setError("No se pudo cargar la lista de productos.");
      } finally {
        if (!ignore) {
          setCargando(false);
        }
      }
    };

    cargarProductos();

    return () => {
      ignore = true;
    };
  }, []);

  const productosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) {
      return productos;
    }

    return productos.filter((item) => {
      const codigo = String(item.producto ?? "").toLowerCase();
      const descripcion = String(item.descripcion ?? "").toLowerCase();
      return codigo.includes(termino) || descripcion.includes(termino);
    });
  }, [busqueda, productos]);

  const formatearMoneda = (valor) => {
    const numero = Number(valor ?? 0);
    return numero.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <section className="panel-card products-card">
      <div className="products-header">
        <div className="section-heading products-heading">Listado de Productos</div>

        <div className="products-search-box">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por codigo o descripcion"
          />
        </div>
      </div>

      {cargando ? (
        <div className="module-message">
          <p>Cargando productos...</p>
        </div>
      ) : error ? (
        <div className="module-message error-card">
          <p>{error}</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="tabla productos-tabla">
            <thead>
              <tr>
                <th>CODIGO</th>
                <th>DESCRIPCION</th>
                <th>PRECIO VENTA</th>
                <th>PRECIO COSTO</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.length > 0 ? (
                productosFiltrados.map((item, index) => (
                  <tr key={`${item.producto}-${index}`}>
                    <td>{item.producto}</td>
                    <td>{item.descripcion}</td>
                    <td>{formatearMoneda(item.precio_venta)}</td>
                    <td>{formatearMoneda(item.precio_costo)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="empty-cell">
                    No se encontraron productos para la busqueda ingresada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default ProductosModule;
