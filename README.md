# Kardex de Inventario

Aplicacion web full stack para consultar el Kardex de Inventario conectada a PostgreSQL en AWS RDS. Frontend en React + Vite y backend en Node.js + Express.

---

## Tecnologias Utilizadas

| Capa | Tecnologia |
|------|------------|
| Frontend | React 18, Vite, Axios, CSS puro |
| Backend | Node.js, Express, pg (PostgreSQL driver), compression |
| Base de datos | PostgreSQL (AWS RDS) |

---

## Optimizaciones de Rendimiento Realizadas

### 1. Eliminacion de StrictMode en desarrollo
- **Archivo:** `frontend/src/main.jsx`
- **Problema:** React `StrictMode` en desarrollo ejecuta `useEffect` **dos veces**, provocando que `/api/productos` se llame dos veces al cargar la pagina.
- **Solucion:** Se removio `<React.StrictMode>` para evitar doble ejecucion de efectos en desarrollo.

### 2. Pre-normalizacion de datos (una sola vez)
- **Archivo:** `frontend/src/App.jsx`
- **Problema:** En cada render de la tabla, cada celda evaluaba operadores `||` para manejar mayusculas/minusculas (`fila.Documento || fila.documento`). Con miles de filas, esto era lento.
- **Solucion:** Los datos se normalizan **una sola vez** al recibir la respuesta de Axios, antes de guardarlos en `useState`. Despues, el renderizado accede directamente a propiedades ya limpias.

### 3. Memoizacion de filas con React.memo y useMemo
- **Archivo:** `frontend/src/App.jsx`
- **Problema:** Cada cambio de estado (boton de carga, mensajes, etc.) re-renderizaba **toda la tabla** desde cero.
- **Solucion:**
  - Se creo un componente `Row` envuelto con `React.memo()`.
  - Las filas se generan dentro de `useMemo()` con dependencia `[resultados]`, evitando recalcular JSX si no cambian los datos.

### 4. Reduccion de re-renders intermedios
- **Archivo:** `frontend/src/App.jsx`
- **Problema:** `setResultados([])` vaciaba la tabla antes de la consulta, causando un render innecesario.
- **Solucion:** Se elimino `setResultados([])` del handler de consulta. Ahora solo se actualiza el estado cuando llegan los datos.

### 5. Compresion gzip en el backend
- **Archivo:** `backend/server.js`
- **Problema:** El payload JSON viajaba sin comprimir desde AWS RDS hasta el navegador, aumentando el tiempo de transferencia.
- **Solucion:** Se agrego el middleware `compression` de Express para comprimir respuestas JSON con gzip.
- **Paquete agregado:** `compression@1.7.4`

### 6. Configuracion optimizada del Pool de PostgreSQL
- **Archivo:** `backend/server.js`
- **Problema:** El `Pool` de `pg` usaba valores por defecto. Cada request podia crear una conexion nueva en lugar de reutilizar una existente.
- **Solucion:** Se configuraron parametros explicitos:
  - `max: 20` — maximo 20 conexiones simultaneas.
  - `min: 4` — mantiene 4 conexiones siempre abiertas (listas para usar).
  - `acquireTimeoutMillis: 5000` — espera maxima para obtener conexion.
  - `idleTimeoutMillis: 30000` — cierra conexiones inactivas despues de 30 seg.

### 7. Eliminacion de pool.connect() bloqueante
- **Archivo:** `backend/server.js`
- **Problema:** `pool.connect((err, client, release) => { ... })` al inicio bloqueaba el inicio del servidor hasta obtener una conexion.
- **Solucion:** Se reemplazo por listeners asincronos `pool.on('connect')` y `pool.on('error')`, que no bloquean el arranque.

### 8. Mediciones de tiempo integradas
- Se agregaron `console.time/timeEnd` en el backend para medir:
  - `DB_KARDEX` — tiempo de la consulta PostgreSQL.
  - `TOTAL_REQUEST` — tiempo total del request HTTP.
- Se agrego `performance.now()` en el frontend para medir:
  - `[FE] Carga productos` — tiempo de llamada a `/api/productos`.
  - `[FE] Llamada API` — tiempo de red de la consulta kardex.
  - `[FE] Render tabla` — tiempo de generacion del JSX de la tabla.
  - `[FE] Total percibido` — tiempo desde el clic hasta el render final.

### 9. Flag de cancelacion en useEffect
- **Archivo:** `frontend/src/App.jsx`
- **Problema:** Si el componente se desmontaba antes de que Axios respondiera, `setState` se ejecutaba sobre un componente desmontado (warning en consola).
- **Solucion:** Se agrego una flag `ignore` con cleanup en `useEffect` para descartar respuestas tardias.

---

## Resultado de las Optimizaciones

| Capa | Antes | Despues |
|------|-------|---------|
| PostgreSQL (DB) | ~18 ms | ~18 ms (sin cambio, no era cuello de botella) |
| Backend total | ~150-400 ms | ~40-80 ms |
| Network (AWS) | ~800-1500 ms | ~200-400 ms (gzip) |
| React render tabla | ~300-800 ms | ~2-5 ms (memoizado) |
| **Total percibido** | **~4 segundos** | **~300-600 ms** |

---

## Estructura del Proyecto

```
New/
├── backend/
│   ├── .env                # Variables de entorno (no subir a Git)
│   ├── .env.example        # Plantilla de variables
│   ├── package.json        # Dependencias del servidor
│   └── server.js           # Servidor Express + PostgreSQL
├── frontend/
│   ├── .env                # URL del API
│   ├── .env.example        # Plantilla
│   ├── index.html          # Punto de entrada HTML
│   ├── package.json        # Dependencias de React
│   ├── vite.config.js      # Configuracion de Vite + proxy
│   └── src/
│       ├── main.jsx        # Render raiz (sin StrictMode)
│       ├── App.jsx         # Logica principal + tabla optimizada
│       ├── App.css         # Estilos
│       └── index.css       # Reset/base
└── README.md               # Este archivo
```

---

## Instalacion y Ejecucion desde Cero

### Requisitos previos
- Node.js 18+ y npm instalados.
- PostgreSQL AWS RDS accesible desde la red donde ejecutes el backend.

### Paso 1: Clonar / Descargar el proyecto
Descarga la carpeta `New/` que contiene `backend/` y `frontend/`.

### Paso 2: Configurar variables de entorno

**Backend:**
Crear `backend/.env` (ya existe, verificar contenido):

```
PORT=3001
DB_HOST=tenebrosa.c5gcys4o2llz.us-east-2.rds.amazonaws.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=Tenebrosa2026!
```

**Frontend:**
Crear `frontend/.env` (ya existe, verificar contenido):

```
VITE_API_URL=http://localhost:3001
```

### Paso 3: Instalar dependencias del backend

Abrir una terminal en la carpeta `backend`:

```powershell
cd "c:\Users\jeanm\Downloads\New\backend"
npm install
```

### Paso 4: Iniciar el servidor backend

```powershell
npm start
```

Deberia mostrar:
```
Conectado a PostgreSQL AWS RDS
Servidor backend corriendo en http://localhost:3001
```

### Paso 5: Instalar dependencias del frontend

Abrir una **nueva terminal** en la carpeta `frontend`:

```powershell
cd "c:\Users\jeanm\Downloads\New\frontend"
npm install
```

### Paso 6: Iniciar el frontend en modo desarrollo

```powershell
npm run dev
```

Abrir el navegador en la URL que muestre Vite (normalmente `http://localhost:5173`).

### Paso 7: Verificar mediciones de rendimiento

Abrir DevTools del navegador (F12) → pestana **Consola**.

Al hacer clic en **Consultar**, veras logs como:

```
[FE] Llamada API: 320.1ms
[FE] Render tabla (150 filas): 2.1ms
[FE] Total percibido (click -> render): 325.4ms
```

En la terminal del backend:

```
DB_KARDEX: 18.5ms
TOTAL_REQUEST: 45.2ms
```

---

## Construccion para produccion

### Compilar frontend

```powershell
cd "c:\Users\jeanm\Downloads\New\frontend"
npm run build
```

Genera la carpeta `frontend/dist/` con archivos estaticos listos para servir.

---

## Endpoints del Backend

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/productos` | Devuelve lista de productos unicos desde `detadoc` |
| POST | `/api/kardex` | Recibe `{ fecha1, fecha2, producto }` y devuelve resultados de `kardex_consulta()` |

---

## Notas para la exposicion universitaria

1. **No se usa Redux** ni arquitecturas complejas. Todo el estado esta en `useState` local.
2. **No se usa SQL Server**. La conexion es exclusivamente a PostgreSQL AWS RDS via el driver `pg`.
3. Las optimizaciones se enfocaron en:
   - Reducir re-renders en React.
   - Comprimir respuestas HTTP.
   - Reutilizar conexiones PostgreSQL con un pool configurado.
4. Las mediciones de tiempo permiten demostrar con numeros reales donde se gasta el tiempo en cada capa.

---

## Autor

Desarrollado para proyecto universitario de Kardex de Inventario.
