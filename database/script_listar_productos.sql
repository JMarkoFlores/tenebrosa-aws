DROP FUNCTION IF EXISTS fn_listar_productos();

CREATE OR REPLACE FUNCTION fn_listar_productos()
RETURNS TABLE (
    codigo VARCHAR,
    descripcion VARCHAR
)
LANGUAGE sql
AS $$
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
$$;

--Prueba:
SELECT *
FROM fn_listar_productos();