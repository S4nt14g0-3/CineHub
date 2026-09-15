# CineHub

Proyecto de Programacion 5


Sistema de Gestion de Cine


Todos los archivos estan sujetos a cambios 


# Esquema de la base de datos

|Tabla|Columna|Tipo de Dato|Permite Nulo|
|-----|-------|------------|------------|
|asientos|id|integer|NO|
|asientos|sala_id|integer|NO|
|asientos|fila|character varying|NO|
|asientos|columna|integer|NO|
|asientos|tipo|character varying|YES|
|auditoria_accesos|id|integer|NO|
|auditoria_accesos|usuario_id|integer|NO|
|auditoria_accesos|fecha_ingreso|timestamp without time zone|YES|
|auditoria_accesos|ip_origen|character varying|YES|
|auditoria_accesos|exitoso|boolean|YES|
|cines|id|integer|NO|
|cines|nombre|character varying|NO|
|cines|direccion|character varying|NO|
|cines|ciudad|character varying|NO|
|clasificaciones|id|integer|NO|
|clasificaciones|codigo|character varying|NO|
|clasificaciones|descripcion|text|YES|
|compras|id|integer|NO|
|compras|usuario_id|integer|NO|
|compras|fecha_compra|timestamp without time zone|YES|
|compras|monto_total|numeric|NO|
|compras|estado|character varying|YES|
|detalle_compras_dulceria|id|integer|NO|
|detalle_compras_dulceria|compra_id|integer|NO|
|detalle_compras_dulceria|producto_id|integer|NO|
|detalle_compras_dulceria|cantidad|integer|NO|
|detalle_compras_dulceria|precio_unitario|numeric|NO|
|funciones|id|integer|NO|
|funciones|pelicula_id|integer|NO|
|funciones|sala_id|integer|NO|
|funciones|fecha_hora|timestamp without time zone|NO|
|funciones|precio_base|numeric|NO|
|generos|id|integer|NO|
|generos|nombre|character varying|NO|
|pelicula_generos|pelicula_id|integer|NO|
|pelicula_generos|genero_id|integer|NO|
|peliculas|id|integer|NO|
|peliculas|clasificacion_id|integer|NO|
|peliculas|titulo|character varying|NO|
|peliculas|duracion_minutos|integer|NO|
|peliculas|sinopsis|text|YES|
|peliculas|poster_url|character varying|YES|
|productos_dulceria|id|integer|NO|
|productos_dulceria|nombre|character varying|NO|
|productos_dulceria|precio|numeric|NO|
|productos_dulceria|stock|integer|NO|
|roles|id|integer|NO|
|roles|nombre|character varying|NO|
|roles|descripcion|text|YES|
|salas|id|integer|NO|
|salas|cine_id|integer|NO|
|salas|nombre|character varying|NO|
|salas|capacidad|integer|NO|
|salas|tipo_sala|character varying|YES|
|tickets|id|integer|NO|
|tickets|compra_id|integer|NO|
|tickets|funcion_id|integer|NO|
|tickets|asiento_id|integer|NO|
|tickets|precio|numeric|NO|
|tickets|codigo_qr|character varying|YES|
|tickets|validado|boolean|YES|
|usuarios|id|integer|NO|
|usuarios|rol_id|integer|NO|
|usuarios|nombre|character varying|NO|
|usuarios|email|character varying|NO|
|usuarios|password_hash|character varying|NO|
|usuarios|telefono|character varying|YES|
|usuarios|creado_en|timestamp without time zone|YES|
