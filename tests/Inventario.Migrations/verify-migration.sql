DO $$ BEGIN
 IF (SELECT count(*) FROM inventario."UbicacionesInventario")<>2 THEN RAISE EXCEPTION 'Principal duplicada o ausente'; END IF;
 IF (SELECT sum("CantidadDisponible") FROM inventario."StocksAlmacen" WHERE "ProductoId"='20000000-0000-0000-0000-000000000001')<>2 THEN RAISE EXCEPTION 'La migración cambió el saldo de series'; END IF;
 IF (SELECT count(*) FROM inventario."StocksAlmacen" WHERE "Condicion"=2 AND "CantidadDisponible"=1)<>1 THEN RAISE EXCEPTION 'Condición defectuosa perdida'; END IF;
 IF (SELECT "CantidadDisponible" FROM inventario."StocksAlmacen" WHERE "ProductoId"='20000000-0000-0000-0000-000000000002')<>12.34567 THEN RAISE EXCEPTION 'Precisión de stock perdida'; END IF;
 IF (SELECT count(*) FROM inventario."ItemsSeriados" WHERE "TransferenciaEnTransitoId"='50000000-0000-0000-0000-000000000001' AND "UbicacionActualId" IS NULL)<>1 THEN RAISE EXCEPTION 'Tránsito no identificado'; END IF;
 IF (SELECT "UbicacionDestinoId" FROM inventario."Transferencias" WHERE "Id"='50000000-0000-0000-0000-000000000001') IS NULL THEN RAISE EXCEPTION 'Transferencia abierta sin ubicación'; END IF;
 IF (SELECT "UbicacionDestinoId" FROM inventario."Transferencias" WHERE "Id"='50000000-0000-0000-0000-000000000002') IS NOT NULL THEN RAISE EXCEPTION 'Se inventó ubicación histórica'; END IF;
 IF (SELECT "UbicacionOrigenId" FROM inventario."MovimientosInventario" LIMIT 1) IS NOT NULL THEN RAISE EXCEPTION 'Se inventó ubicación del movimiento histórico'; END IF;
 IF NOT (SELECT "Recibida" FROM inventario."TransferenciaDetalleSeries" WHERE "Id"='70000000-0000-0000-0000-000000000002') THEN RAISE EXCEPTION 'Entrega inmediata no conciliada'; END IF;
 IF (SELECT count(*) FROM inventario."VersionesInventario")<>1 THEN RAISE EXCEPTION 'La migración no es idempotente'; END IF;
END $$;
