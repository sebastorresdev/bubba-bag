-- Migración transaccional. Las columnas antiguas se conservan para auditoría,
-- pero el modelo nuevo no las utiliza como ubicación actual.
SELECT pg_advisory_xact_lock(20261003, 1);
CREATE TABLE IF NOT EXISTS inventario."VersionesInventario" ("Version" text PRIMARY KEY,"Fecha" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS inventario."UbicacionesInventario" (
 "Id" uuid PRIMARY KEY,"AlmacenId" uuid NOT NULL REFERENCES inventario."Almacenes"("Id") ON DELETE RESTRICT,
 "Codigo" varchar(50) NOT NULL,"Nombre" varchar(150) NOT NULL,"EsPrincipal" boolean NOT NULL,"Activa" boolean NOT NULL DEFAULT true);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Ubicaciones_Almacen_Codigo" ON inventario."UbicacionesInventario"("AlmacenId","Codigo");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Ubicaciones_Principal" ON inventario."UbicacionesInventario"("AlmacenId") WHERE "EsPrincipal";
INSERT INTO inventario."UbicacionesInventario"("Id","AlmacenId","Codigo","Nombre","EsPrincipal")
 SELECT md5(a."Id"::text||':principal')::uuid,a."Id",'PRINCIPAL','Principal',true FROM inventario."Almacenes" a
 WHERE NOT EXISTS(SELECT 1 FROM inventario."UbicacionesInventario" u WHERE u."AlmacenId"=a."Id" AND u."EsPrincipal");

DO $migracion$
BEGIN
 IF EXISTS(SELECT 1 FROM inventario."VersionesInventario" WHERE "Version"='20261003-ubicaciones-v1') THEN RETURN; END IF;
 IF EXISTS(SELECT 1 FROM inventario."Almacenes" WHERE "Tipo"=2 AND "Activo" AND "RecursoId" IS NOT NULL GROUP BY "RecursoId" HAVING count(*)>1) THEN
  RAISE EXCEPTION 'Hay varias custodias activas para un mismo recurso. Conciliar antes de migrar.';
 END IF;
 UPDATE inventario."TransferenciaDetalleSeries" s SET "Recibida"=true FROM inventario."TransferenciaDetalles" d JOIN inventario."Transferencias" t ON t."Id"=d."TransferenciaId" WHERE d."Id"=s."TransferenciaDetalleId" AND t."Modalidad"=1 AND t."Estado"=4;
 IF EXISTS(SELECT 1 FROM inventario."TransferenciaDetalles" d JOIN inventario."TransferenciaDetalleSeries" s ON s."TransferenciaDetalleId"=d."Id" GROUP BY d."Id",d."CantidadEnviada",d."CantidadRecibida" HAVING count(*)<>d."CantidadEnviada" OR count(*) FILTER(WHERE s."Recibida")<>d."CantidadRecibida") THEN
  RAISE EXCEPTION 'Las series enviadas o recibidas no coinciden con las cantidades. Revisar recepciones parciales antiguas.';
 END IF;
 ALTER TABLE inventario."StocksAlmacen" ADD COLUMN IF NOT EXISTS "UbicacionId" uuid REFERENCES inventario."UbicacionesInventario"("Id") ON DELETE RESTRICT;
 ALTER TABLE inventario."StocksAlmacen" ADD COLUMN IF NOT EXISTS "Condicion" integer NOT NULL DEFAULT 1;
 UPDATE inventario."StocksAlmacen" s SET "UbicacionId"=u."Id" FROM inventario."UbicacionesInventario" u WHERE u."AlmacenId"=s."AlmacenId" AND u."EsPrincipal" AND s."UbicacionId" IS NULL;
 IF EXISTS(SELECT 1 FROM inventario."StocksAlmacen" WHERE "UbicacionId" IS NULL) THEN RAISE EXCEPTION 'Hay saldos sin almacén válido.'; END IF;
 ALTER TABLE inventario."StocksAlmacen" ALTER COLUMN "UbicacionId" SET NOT NULL;
 ALTER TABLE inventario."StocksAlmacen" ALTER COLUMN "AlmacenId" DROP NOT NULL;
 CREATE UNIQUE INDEX "IX_Stocks_Ubicacion_Producto_Condicion" ON inventario."StocksAlmacen"("UbicacionId","ProductoId","Condicion");

 ALTER TABLE inventario."ItemsSeriados" ADD COLUMN IF NOT EXISTS "UbicacionActualId" uuid REFERENCES inventario."UbicacionesInventario"("Id") ON DELETE RESTRICT;
 ALTER TABLE inventario."ItemsSeriados" ADD COLUMN IF NOT EXISTS "TransferenciaEnTransitoId" uuid REFERENCES inventario."Transferencias"("Id") ON DELETE RESTRICT;
 ALTER TABLE inventario."ItemsSeriados" ADD COLUMN IF NOT EXISTS "Condicion" integer NOT NULL DEFAULT 1;
 UPDATE inventario."ItemsSeriados" SET "Condicion"=2 WHERE "Estado" IN(4,5);
 UPDATE inventario."ItemsSeriados" i SET "UbicacionActualId"=u."Id" FROM inventario."UbicacionesInventario" u WHERE u."AlmacenId"=i."AlmacenActualId" AND u."EsPrincipal" AND i."Estado" IN(1,2,4,5);
 UPDATE inventario."ItemsSeriados" i SET "TransferenciaEnTransitoId"=d."TransferenciaId" FROM inventario."TransferenciaDetalleSeries" s JOIN inventario."TransferenciaDetalles" d ON d."Id"=s."TransferenciaDetalleId" JOIN inventario."Transferencias" t ON t."Id"=d."TransferenciaId" WHERE s."ItemSeriadoId"=i."Id" AND NOT s."Recibida" AND t."Estado" IN(2,3) AND i."Estado"=8;
 IF EXISTS(SELECT 1 FROM inventario."ItemsSeriados" WHERE "Estado"=8 AND "TransferenciaEnTransitoId" IS NULL) THEN RAISE EXCEPTION 'Una serie en tránsito no tiene transferencia pendiente identificable.'; END IF;
 IF EXISTS(SELECT 1 FROM inventario."ItemsSeriados" WHERE "Estado" IN(1,2,4,5) AND "UbicacionActualId" IS NULL) THEN RAISE EXCEPTION 'Una serie en custodia no tiene almacén válido.'; END IF;
 IF EXISTS(SELECT 1 FROM inventario."ItemsSeriados" i WHERE i."UbicacionActualId" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM inventario."StocksAlmacen" s WHERE s."UbicacionId"=i."UbicacionActualId" AND s."ProductoId"=i."ProductoId")) THEN RAISE EXCEPTION 'Hay series en custodia sin saldo registrado. Conciliar antes de migrar.'; END IF;
 IF EXISTS(SELECT s."ItemSeriadoId" FROM inventario."TransferenciaDetalleSeries" s JOIN inventario."TransferenciaDetalles" d ON d."Id"=s."TransferenciaDetalleId" JOIN inventario."Transferencias" t ON t."Id"=d."TransferenciaId" WHERE t."Estado" IN(2,3) AND NOT s."Recibida" GROUP BY s."ItemSeriadoId" HAVING count(*)>1) THEN RAISE EXCEPTION 'Una serie figura pendiente en varios tránsitos.'; END IF;
 IF EXISTS(SELECT 1 FROM inventario."TransferenciaDetalleSeries" s JOIN inventario."TransferenciaDetalles" d ON d."Id"=s."TransferenciaDetalleId" JOIN inventario."Transferencias" t ON t."Id"=d."TransferenciaId" JOIN inventario."ItemsSeriados" i ON i."Id"=s."ItemSeriadoId" WHERE t."Estado" IN(2,3) AND NOT s."Recibida" AND i."Estado"<>8) THEN RAISE EXCEPTION 'Una serie pendiente de recepción tiene custodia contradictoria.'; END IF;
 -- Antes de repartir por condición comprobar que no se crean ni desaparecen equipos.
 IF EXISTS(SELECT 1 FROM inventario."StocksAlmacen" s JOIN inventario."Productos" p ON p."Id"=s."ProductoId" WHERE p."EsSerializado" AND (s."CantidadReservada"<>0 OR s."CantidadDisponible"<>(SELECT count(*) FROM inventario."ItemsSeriados" i WHERE i."ProductoId"=s."ProductoId" AND i."UbicacionActualId"=s."UbicacionId"))) THEN RAISE EXCEPTION 'El saldo seriado no coincide con las unidades o contiene reservas. Conciliar antes de migrar.'; END IF;
 UPDATE inventario."StocksAlmacen" s SET "CantidadDisponible"=(SELECT count(*) FROM inventario."ItemsSeriados" i WHERE i."ProductoId"=s."ProductoId" AND i."UbicacionActualId"=s."UbicacionId" AND i."Condicion"=1) FROM inventario."Productos" p WHERE p."Id"=s."ProductoId" AND p."EsSerializado";
 INSERT INTO inventario."StocksAlmacen"("Id","UbicacionId","ProductoId","Condicion","CantidadDisponible","CantidadReservada","UpdatedAt") SELECT md5(i."UbicacionActualId"::text||i."ProductoId"::text||i."Condicion"::text)::uuid,i."UbicacionActualId",i."ProductoId",i."Condicion",count(*),0,CURRENT_TIMESTAMP FROM inventario."ItemsSeriados" i WHERE i."UbicacionActualId" IS NOT NULL GROUP BY i."UbicacionActualId",i."ProductoId",i."Condicion" ON CONFLICT("UbicacionId","ProductoId","Condicion") DO NOTHING;

 ALTER TABLE inventario."Transferencias" ADD COLUMN IF NOT EXISTS "UbicacionOrigenId" uuid REFERENCES inventario."UbicacionesInventario"("Id") ON DELETE RESTRICT;
 ALTER TABLE inventario."Transferencias" ADD COLUMN IF NOT EXISTS "UbicacionDestinoId" uuid REFERENCES inventario."UbicacionesInventario"("Id") ON DELETE RESTRICT;
 -- Solo los documentos abiertos necesitan una ubicación para continuar. No inventar detalle físico de documentos cerrados.
 UPDATE inventario."Transferencias" t SET "UbicacionOrigenId"=o."Id","UbicacionDestinoId"=d."Id" FROM inventario."UbicacionesInventario" o,inventario."UbicacionesInventario" d WHERE o."AlmacenId"=t."AlmacenOrigenId" AND o."EsPrincipal" AND d."AlmacenId"=t."AlmacenDestinoId" AND d."EsPrincipal" AND t."Estado" IN(1,2,3);
 ALTER TABLE inventario."Transferencias" ADD COLUMN IF NOT EXISTS "OperacionId" uuid;
 ALTER TABLE inventario."Transferencias" ADD COLUMN IF NOT EXISTS "FechaReal" timestamptz;
 ALTER TABLE inventario."Transferencias" ADD COLUMN IF NOT EXISTS "CreadoPorId" uuid;
 ALTER TABLE inventario."Transferencias" ADD COLUMN IF NOT EXISTS "CreadoPorNombre" text;
 UPDATE inventario."Transferencias" SET "OperacionId"="Id","FechaReal"=COALESCE("FechaDespacho","FechaRegistro"),"CreadoPorId"="DespachadoPorId","CreadoPorNombre"="DespachadoPorNombre";
 ALTER TABLE inventario."Transferencias" ALTER COLUMN "OperacionId" SET NOT NULL;
 CREATE UNIQUE INDEX "IX_Transferencias_Operacion" ON inventario."Transferencias"("OperacionId");
 ALTER TABLE inventario."TransferenciaDetalles" ALTER COLUMN "CantidadEnviada" TYPE numeric(18,5), ALTER COLUMN "CantidadRecibida" TYPE numeric(18,5), ALTER COLUMN "CantidadResuelta" TYPE numeric(18,5);
 ALTER TABLE inventario."RecepcionTransferenciaDetalles" ALTER COLUMN "CantidadAceptada" TYPE numeric(18,5);
 ALTER TABLE inventario."ResolucionDiferenciaTransferencias" ALTER COLUMN "CantidadAfectada" TYPE numeric(18,5);
 ALTER TABLE inventario."MovimientosInventario" ALTER COLUMN "Cantidad" TYPE numeric(18,5);
 ALTER TABLE inventario."TransferenciaDetalles" ADD COLUMN IF NOT EXISTS "Condicion" integer NOT NULL DEFAULT 1;
 ALTER TABLE inventario."TransferenciaDetalles" ADD COLUMN IF NOT EXISTS "UnidadMedidaId" uuid;
 ALTER TABLE inventario."TransferenciaDetalles" ADD COLUMN IF NOT EXISTS "UnidadMedidaNombre" varchar(100);
 -- Unidad histórica desconocida: conservar null, no derivarla del catálogo actual.
 ALTER TABLE inventario."TransferenciaDetalleSeries" ADD COLUMN IF NOT EXISTS "RecepcionDetalleId" uuid REFERENCES inventario."RecepcionTransferenciaDetalles"("Id") ON DELETE RESTRICT;
 ALTER TABLE inventario."TransferenciaDetalleSeries" ADD COLUMN IF NOT EXISTS "ResolucionId" uuid REFERENCES inventario."ResolucionDiferenciaTransferencias"("Id") ON DELETE RESTRICT;
 ALTER TABLE inventario."RecepcionesTransferencia" ADD COLUMN IF NOT EXISTS "OperacionId" uuid;
 ALTER TABLE inventario."RecepcionesTransferencia" ADD COLUMN IF NOT EXISTS "FechaReal" timestamptz;
 UPDATE inventario."RecepcionesTransferencia" SET "OperacionId"="Id","FechaReal"="FechaRecepcion";
 ALTER TABLE inventario."RecepcionesTransferencia" ALTER COLUMN "OperacionId" SET NOT NULL;
 CREATE UNIQUE INDEX "IX_Recepciones_Operacion" ON inventario."RecepcionesTransferencia"("OperacionId");
 ALTER TABLE inventario."ResolucionDiferenciaTransferencias" ADD COLUMN IF NOT EXISTS "OperacionId" uuid;
 UPDATE inventario."ResolucionDiferenciaTransferencias" SET "OperacionId"="Id";
 ALTER TABLE inventario."ResolucionDiferenciaTransferencias" ALTER COLUMN "OperacionId" SET NOT NULL;
 CREATE UNIQUE INDEX "IX_Resoluciones_Operacion" ON inventario."ResolucionDiferenciaTransferencias"("OperacionId");
 ALTER TABLE inventario."MovimientosInventario" ADD COLUMN IF NOT EXISTS "UbicacionOrigenId" uuid;
 ALTER TABLE inventario."MovimientosInventario" ADD COLUMN IF NOT EXISTS "UbicacionDestinoId" uuid;
 ALTER TABLE inventario."MovimientosInventario" ADD COLUMN IF NOT EXISTS "TransferenciaId" uuid;
 ALTER TABLE inventario."MovimientosInventario" ADD COLUMN IF NOT EXISTS "EventoId" uuid;
 ALTER TABLE inventario."MovimientosInventario" ADD COLUMN IF NOT EXISTS "FechaRegistro" timestamptz;
 ALTER TABLE inventario."MovimientosInventario" ADD COLUMN IF NOT EXISTS "Condicion" integer NOT NULL DEFAULT 1;
 UPDATE inventario."MovimientosInventario" SET "FechaRegistro"="FechaMovimiento";
 CREATE UNIQUE INDEX "IX_TransferenciaSeries_Unidad" ON inventario."TransferenciaDetalleSeries"("TransferenciaDetalleId","ItemSeriadoId");
 CREATE UNIQUE INDEX "IX_Almacenes_CustodiaActiva" ON inventario."Almacenes"("RecursoId") WHERE "Tipo"=2 AND "Activo" AND "RecursoId" IS NOT NULL;
 INSERT INTO inventario."VersionesInventario"("Version") VALUES('20261003-ubicaciones-v1');
END $migracion$;
