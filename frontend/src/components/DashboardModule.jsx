import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getDashboardResumen } from "../services/api";

function DashboardIcon({ type }) {
  switch (type) {
    case "productos":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 2.3L6.2 8.5 12 11.8l5.8-3.3L12 5.3Zm-6 5v5l5 2.8v-5L6 10.3Zm7 7.8 5-2.8v-5l-5 2.8v5Z" />
        </svg>
      );
    case "documentos":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 3h7l5 5v13H7V3Zm2 2v14h8V9h-4V5H9Zm2 6h4v2h-4v-2Zm0 4h4v2h-4v-2Z" />
        </svg>
      );
    case "clientes":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4ZM8 13a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm8 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4ZM8 15c-.4 0-.9 0-1.4.1C4.3 15.5 0 16.7 0 19v2h6v-2c0-1.5.8-2.9 2.3-4Z" />
        </svg>
      );
    case "proveedores":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Zm9 .3L5 11.2v4.1l7 3.5 7-3.5v-4.1l-7-3.4ZM8 12h8v2H8v-2Z" />
        </svg>
      );
    case "entradas":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3 5 10h4v8h6v-8h4l-7-7Zm-7 17h14v2H5v-2Z" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 21 19 14h-4V6H9v8H5l7 7ZM5 2h14v2H5V2Z" />
        </svg>
      );
  }
}

const METRIC_STYLES = {
  productos: {
    accent: "#3a7bf6",
    soft: "#edf4ff",
    chart: "#3a7bf6",
    icon: "productos",
  },
  documentos: {
    accent: "#7a68f6",
    soft: "#f1efff",
    chart: "#7a68f6",
    icon: "documentos",
  },
  clientes: {
    accent: "#f19a3e",
    soft: "#fff4e7",
    chart: "#f19a3e",
    icon: "clientes",
  },
  proveedores: {
    accent: "#4d8ecf",
    soft: "#ebf5ff",
    chart: "#4d8ecf",
    icon: "proveedores",
  },
  entradas: {
    accent: "#28a86b",
    soft: "#eaf9f0",
    chart: "#28a86b",
    icon: "entradas",
  },
  salidas: {
    accent: "#db5b5b",
    soft: "#ffefef",
    chart: "#db5b5b",
    icon: "salidas",
  },
};

function DashboardModule() {
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    const cargarResumen = async () => {
      setCargando(true);
      setError("");

      try {
        const data = await getDashboardResumen();
        if (ignore) {
          return;
        }

        setResumen(data);
      } catch {
        if (ignore) {
          return;
        }

        setError("No se pudo cargar la informacion del dashboard.");
      } finally {
        if (!ignore) {
          setCargando(false);
        }
      }
    };

    cargarResumen();

    return () => {
      ignore = true;
    };
  }, []);

  const metrics = useMemo(() => {
    const numberValue = (value) => Number(value ?? 0);

    return [
      {
        key: "productos",
        label: "Total productos",
        value: numberValue(resumen?.total_productos),
        tone: "productos",
      },
      {
        key: "documentos",
        label: "Total documentos",
        value: numberValue(resumen?.total_documentos),
        tone: "documentos",
      },
      {
        key: "clientes",
        label: "Total clientes",
        value: numberValue(resumen?.total_clientes),
        tone: "clientes",
      },
      {
        key: "proveedores",
        label: "Total proveedores",
        value: numberValue(resumen?.total_proveedores),
        tone: "proveedores",
      },
      {
        key: "entradas",
        label: "Total entradas",
        value: numberValue(resumen?.total_entradas),
        tone: "entradas",
      },
      {
        key: "salidas",
        label: "Total salidas",
        value: numberValue(resumen?.total_salidas),
        tone: "salidas",
      },
    ];
  }, [resumen]);

  const generalChartData = useMemo(
    () =>
      metrics
        .filter((item) => ["productos", "documentos", "clientes", "proveedores"].includes(item.key))
        .map((item) => ({
          name: item.label.replace("Total ", ""),
          value: item.value,
          fill: METRIC_STYLES[item.tone].chart,
        })),
    [metrics],
  );

  const movementChartData = useMemo(
    () => [
      {
        name: "Entradas",
        value: metrics.find((item) => item.key === "entradas")?.value ?? 0,
        fill: METRIC_STYLES.entradas.chart,
      },
      {
        name: "Salidas",
        value: metrics.find((item) => item.key === "salidas")?.value ?? 0,
        fill: METRIC_STYLES.salidas.chart,
      },
    ],
    [metrics],
  );

  const highlightMetrics = useMemo(() => {
    const productos = metrics.find((item) => item.key === "productos")?.value ?? 0;
    const documentos = metrics.find((item) => item.key === "documentos")?.value ?? 0;
    const clientes = metrics.find((item) => item.key === "clientes")?.value ?? 0;
    const proveedores = metrics.find((item) => item.key === "proveedores")?.value ?? 0;

    return [
      {
        label: "Entidades registradas",
        value: clientes + proveedores,
        helper: "Clientes y proveedores activos en base de datos",
      },
      {
        label: "Catalogo actual",
        value: productos,
        helper: "Productos disponibles segun la funcion almacenada",
      },
      {
        label: "Documentos procesados",
        value: documentos,
        helper: "Consolidado general devuelto por PostgreSQL AWS",
      },
    ];
  }, [metrics]);

  const formatMetric = (value) => {
    const number = Number(value ?? 0);
    const hasDecimals = !Number.isInteger(number);

    return number.toLocaleString("es-PE", {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2,
    });
  };

  if (cargando) {
    return (
      <section className="panel-card status-card">
        <p>Cargando dashboard...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel-card status-card error-card">
        <p>{error}</p>
      </section>
    );
  }

  return (
    <div className="dashboard-layout">
      <section className="dashboard-hero panel-card">
        <div className="dashboard-hero-copy">
          <span className="dashboard-eyebrow">Vision general</span>
          <h3>Dashboard operativo de TENEBROSA</h3>
          <p>
            Vista consolidada del sistema con indicadores obtenidos directamente
            desde PostgreSQL AWS mediante funciones almacenadas.
          </p>
        </div>

        <div className="dashboard-hero-badge">
          <span>Fuente</span>
          <strong>fn_dashboard_resumen()</strong>
        </div>
      </section>

      <section className="dashboard-grid dashboard-grid-enhanced">
        {metrics.map((card) => {
          const tone = METRIC_STYLES[card.tone];

          return (
            <article
              key={card.key}
              className="stat-card dashboard-stat-card dashboard-metric-card"
              style={{
                background: `linear-gradient(180deg, ${tone.soft} 0%, #ffffff 72%)`,
                borderTop: `4px solid ${tone.accent}`,
              }}
            >
              <div className="dashboard-card-top">
                <div
                  className="dashboard-card-icon"
                  style={{ backgroundColor: tone.soft, color: tone.accent }}
                >
                  <DashboardIcon type={tone.icon} />
                </div>
                <span
                  className="dashboard-card-dot"
                  style={{ backgroundColor: tone.accent }}
                />
              </div>

              <div className="dashboard-card-content">
                <span className="stat-label">{card.label}</span>
                <strong className="stat-value">{formatMetric(card.value)}</strong>
              </div>
            </article>
          );
        })}
      </section>

      <section className="dashboard-summary panel-card">
        <div className="dashboard-section-header">
          <div>
            <span className="dashboard-eyebrow">Resumen del sistema</span>
            <h3>Resumen del sistema</h3>
          </div>
          <span className="dashboard-chip">PostgreSQL AWS</span>
        </div>

        <p className="dashboard-summary-text">
          Los indicadores y comparativos de este panel se consultan desde la base
          de datos PostgreSQL en AWS mediante funciones almacenadas, manteniendo
          la misma conexion real ya existente del sistema.
        </p>

        <div className="dashboard-highlight-grid">
          {highlightMetrics.map((item) => (
            <article key={item.label} className="dashboard-highlight-card">
              <span className="dashboard-highlight-value">
                {formatMetric(item.value)}
              </span>
              <strong>{item.label}</strong>
              <p>{item.helper}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-charts-grid">
        <article className="panel-card dashboard-chart-card">
          <div className="dashboard-section-header">
            <div>
              <span className="dashboard-eyebrow">Comparativo</span>
              <h3>Resumen general</h3>
            </div>
          </div>

          <div className="dashboard-chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={generalChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7edf5" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => formatMetric(value)} />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {generalChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel-card dashboard-chart-card">
          <div className="dashboard-section-header">
            <div>
              <span className="dashboard-eyebrow">Balance</span>
              <h3>Entradas vs Salidas</h3>
            </div>
          </div>

          <div className="dashboard-chart-box dashboard-chart-box-donut">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip formatter={(value) => formatMetric(value)} />
                <Legend verticalAlign="bottom" height={24} />
                <Pie
                  data={movementChartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={4}
                >
                  {movementChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel-card dashboard-chart-card dashboard-chart-card-wide">
          <div className="dashboard-section-header">
            <div>
              <span className="dashboard-eyebrow">Vista simple</span>
              <h3>Movimiento general</h3>
            </div>
          </div>

          <p className="dashboard-chart-note">
            Visualizacion general usando los valores reales actuales del resumen.
            No se muestran periodos mensuales porque ese detalle aun no viene del
            endpoint.
          </p>

          <div className="dashboard-chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={movementChartData}>
                <defs>
                  <linearGradient id="dashboardMovement" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3a7bf6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3a7bf6" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7edf5" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => formatMetric(value)} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3a7bf6"
                  fill="url(#dashboardMovement)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
    </div>
  );
}

export default DashboardModule;
