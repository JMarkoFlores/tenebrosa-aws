1. script_kardex_consulta.sql: Consulta de kardex de un producto, poniendo la fecha inicio y final:

DROP FUNCTION IF EXISTS public.kardex_consulta(DATE, DATE, CHAR(4));

CREATE OR REPLACE FUNCTION public.kardex_consulta(
p_fecha1 DATE,
p_fecha2 DATE,
p_producto CHAR(4)
)
RETURNS TABLE (
nro BIGINT,
documento TEXT,
tipomov TEXT,
fecha DATE,
cantidad NUMERIC,
stock NUMERIC
)
LANGUAGE sql
AS $$

    WITH saldo_inicial AS (
        SELECT
            COALESCE(SUM(dd."Cantidad" * td."Signo"), 0) AS stock_inicial
        FROM documento d
        INNER JOIN detadoc dd
            ON d."Documento" = dd."Documento"
           AND d."TipoDoc" = dd."TipoDoc"
        INNER JOIN tipodoc td
            ON td."TipoDoc" = d."TipoDoc"
        WHERE TRIM(dd."Producto"::VARCHAR) = TRIM(p_producto::VARCHAR)
          AND d."Fecha" < p_fecha1
    ),

    movimientos AS (
        SELECT
            d."Documento" || '-' || d."TipoDoc" AS documento,
            CASE
                WHEN td."Signo" = 1 THEN 'Ingreso'
                ELSE 'Salida'
            END AS tipomov,
            d."Fecha" AS fecha,
            dd."Cantidad" AS cantidad,
            dd."Cantidad" * td."Signo" AS movimiento_stock
        FROM documento d
        INNER JOIN detadoc dd
            ON d."Documento" = dd."Documento"
           AND d."TipoDoc" = dd."TipoDoc"
        INNER JOIN tipodoc td
            ON td."TipoDoc" = d."TipoDoc"
        WHERE TRIM(dd."Producto"::VARCHAR) = TRIM(p_producto::VARCHAR)
          AND d."Fecha" BETWEEN p_fecha1 AND p_fecha2
    ),

    kardex AS (
        SELECT
            1::BIGINT AS orden,
            'SALDO INICIAL'::TEXT AS documento,
            'Saldo anterior'::TEXT AS tipomov,
            p_fecha1::DATE AS fecha,
            0::NUMERIC AS cantidad,
            si.stock_inicial AS stock
        FROM saldo_inicial si

        UNION ALL

        SELECT
            ROW_NUMBER() OVER (ORDER BY m.fecha, m.documento) + 1 AS orden,
            m.documento,
            m.tipomov,
            m.fecha,
            m.cantidad,
            si.stock_inicial + SUM(m.movimiento_stock) OVER (
                ORDER BY m.fecha, m.documento
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ) AS stock
        FROM movimientos m
        CROSS JOIN saldo_inicial si
    )

    SELECT
        orden AS nro,
        documento,
        tipomov,
        fecha,
        cantidad,
        stock
    FROM kardex
    ORDER BY orden;

$$
;

--Probando ese script
SELECT *
FROM public.kardex_consulta(
    '2006-06-08',
    '2006-07-08',
    'PR02'
);

2) script_listar_productos.sql:
DROP FUNCTION IF EXISTS fn_listar_productos();

CREATE OR REPLACE FUNCTION fn_listar_productos()
RETURNS TABLE (
    codigo VARCHAR,
    descripcion VARCHAR
)
LANGUAGE sql
AS
$$

    SELECT
        p."Producto"::VARCHAR AS codigo,
        p."Descripcion"::VARCHAR AS descripcion
    FROM producto p
    WHERE EXISTS (
        SELECT 1
        FROM detadoc d
        WHERE TRIM(d."Producto"::VARCHAR) =
              TRIM(p."Producto"::VARCHAR)
    )
    ORDER BY p."Producto";

$$
;

--Prueba:
SELECT *
FROM fn_listar_productos();

3) script_listar_productos_modulo.sql:
CREATE OR REPLACE FUNCTION fn_listar_productos_modulo()
RETURNS TABLE (
    producto VARCHAR,
    --marca VARCHAR,
    descripcion VARCHAR,
    precio_venta NUMERIC,
    precio_costo NUMERIC
)
LANGUAGE sql
AS
$$

    SELECT
        p."Producto",
        --p."Marca",
        p."Descripcion",
        p."PrecVenta",
        p."PrecCosto"
    FROM producto p
    ORDER BY p."Producto";

$$
;

---PRUEBA
SELECT * FROM fn_listar_productos_modulo();

4)


$$
