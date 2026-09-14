# Manual Operativo del Módulo: Servicio de Campo (Field Service)

Este manual documenta el funcionamiento integral del módulo de **Servicio de Campo** de BubbaBag ERP, diseñado para empresas de telecomunicaciones, instalaciones técnicas, mantenimiento y servicios de cuadrillas en terreno. Sirve como guía de capacitación y referencia para clientes y empresas que adquieren el sistema.

---

## 1. Perfiles y Roles Operativos

El sistema organiza las tareas diarias a través de 3 roles especializados de trabajo, además de los roles directivos de supervisión:

```
┌────────────────────────────────────────────────────────┐
│               SuperAdmin / Gerencia                    │
│   (Auditoría ejecutiva, métricas globales de campo)    │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│                 ServicioCampoAdmin                     │
│  (Supervisor / Jefatura de Operaciones & Tarifarios)   │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│               ServicioCampoBackoffice                  │
│       (Mesa de Ayuda, Despachador & Agendamiento)      │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│                ServicioCampoTecnico                    │
│        (Técnico en Calle / Operador de Cuadrilla)      │
└────────────────────────────────────────────────────────┘
```

### 1.1 `ServicioCampoAdmin` (Supervisor / Jefatura de Campo)
- **¿Quién es?** Jefe de Operaciones Técnicas o Coordinador General de Cuadrillas.
- **¿Qué puede ver y hacer?**
  - Acceso irrestricto a todas las órdenes de trabajo de todas las zonas y cuadrillas.
  - Creación, modificación y parametrización de **Tarifarios y Reglas de Precios** por cliente contratista o empresa matriz (ej. DIRECTV, Claro, Movistar).
  - Configuración de Catálogos Maestros: Tipos de Orden de Trabajo (Instalación, Avería, Mudanza, Retiro), Tipos de Tarea técnica y Orígenes de Orden (Siebel, SGA, Portales B2B).
  - Anulación, reasignación extraordinaria o cierre administrativo de órdenes.

### 1.2 `ServicioCampoBackoffice` (Mesa de Control / Despachador)
- **¿Quién es?** Coordinador en oficina o mesa de ayuda encargado de la logística y programación.
- **¿Qué puede ver y hacer?**
  - **Bandeja General de Órdenes:** Visualiza el 100% de las órdenes creadas, pendientes y en curso.
  - **Creación / Importación:** Registra órdenes manualmente o carga lotes masivos provenientes de sistemas externos del cliente contratante.
  - **Despacho y Asignación:** Asigna cuadrillas técnicas, fechas de agendamiento y turnos (mañana/tarde).
  - **Seguimiento en Vivo:** Monitorea el estado de cada orden (Borrador, Agendada, En Traslado, En Sitio, Ejecutada, Liquidada).
  - **Restricciones:** No tiene acceso a alterar los precios base del tarifario ni crear tipos de tarea estructurales.

### 1.3 `ServicioCampoTecnico` (Técnico Operativo / Cuadrillero)
- **¿Quién es?** Técnico o chofer-instalador que acude físicamente al domicilio o sede del cliente.
- **¿Qué puede ver y hacer?**
  - **Mi Agenda del Día:** Pantalla limpia y optimizada para dispositivos móviles o tablets que muestra **exclusivamente** las órdenes asignadas a su persona/cuadrilla para la fecha.
  - **Ruta y Georreferencia:** Dirección del cliente, teléfono de contacto y notas técnicas de acceso.
  - **Ciclo Operativo en Sitio:**
    1. Pulsar **"Iniciar Traslado"** (registra hora de salida).
    2. Pulsar **"En Sitio"** (registra llegada a la puerta del cliente).
    3. Completar el checklist de tareas técnicas realizadas (ej. Tendido de fibra, conectorización, configuración ONT, decodificadores instalados).
    4. Adjuntar evidencias fotográficas (fachada del predio, medidor de potencia óptica, equipos con número de serie visible).
    5. Capturar la **Firma Digital de Conformidad** del abonado en pantalla.
    6. Marcar la orden como **"Completada en Campo"**.
  - **Restricciones:** No puede ver órdenes de otros técnicos, no ve información de costos/tarifas ni puede cancelar órdenes sin autorización del Backoffice.

---

## 2. Matriz Comparativa de Visibilidad y Permisos

| Pantalla / Funcionalidad | ServicioCampoAdmin | ServicioCampoBackoffice | ServicioCampoTecnico |
|---|:---:|:---:|:---:|
| **Bandeja de Todas las Órdenes** | ✅ Lectura y Filtros | ✅ Lectura y Filtros | ❌ Oculto |
| **Mi Agenda / Mis Órdenes Asignadas** | ✅ Lectura | ✅ Lectura | ✅ **Vista Principal** |
| **Crear Nueva Orden de Trabajo** | ✅ Permitido | ✅ Permitido | ❌ Sin Acceso |
| **Asignar Técnico / Cuadrilla** | ✅ Permitido | ✅ Permitido | ❌ Sin Acceso |
| **Iniciar Traslado / En Sitio** | ✅ Permitido | ✅ Permitido | ✅ **Acción de Campo** |
| **Cargar Fotos / Evidencias / Firma** | ✅ Permitido | ✅ Permitido | ✅ **Acción de Campo** |
| **Cerrar / Cancelar Orden** | ✅ Permitido | ✅ Permitido | ❌ Sin Acceso |
| **Módulo de Tarifarios y Reglas** | ✅ Lectura / Escritura | ❌ Oculto | ❌ Oculto |
| **Módulo de Catálogos (Tipos, Orígenes)** | ✅ Lectura / Escritura | ❌ Oculto (Solo lectura en selects) | ❌ Oculto |
| **Acceso a Clientes (CRM)** | ✅ Lectura / Selección | ✅ Lectura / Selección | ❌ Solo datos de la visita |

---

## 3. Arquitectura de 3 Niveles: Orden, Visitas y Subtareas

El sistema desacopla el compromiso comercial, la agenda logística y las acciones técnicas en tres niveles claramente diferenciados:

```
┌────────────────────────────────────────────────────────┐
│               1. ORDEN DE TRABAJO                      │
│   (Expediente global comercial, técnico y financiero)  │
│   Estados: Pendiente → Programada → EnProgreso →       │
│            Completa → Finalizada → Liquidada           │
│            (Excepciones: Rechazada, Cancelada)         │
└──────────────────────────┬─────────────────────────────┘
                           │ 1 a N
┌──────────────────────────▼─────────────────────────────┐
│               2. VISITAS (Citas / Despacho)            │
│   (Cada intento logístico presencial en el tiempo)     │
│   Estados: Programada → EnCamino → EnCurso →           │
│            Completada | Cancelada | Vencida            │
└──────────────────────────┬─────────────────────────────┘
                           │ Agrupa
┌──────────────────────────▼─────────────────────────────┐
│               3. SUBTAREAS (Líneas de Trabajo)         │
│   (Acciones puntuales con tarifa congelada: IB01, etc.)│
│   Estados: Abierta → Completa | Cancelada | Rechazada  │
└────────────────────────────────────────────────────────┘
```

### 3.1 Ciclo de Vida de la Orden de Trabajo

1. **`Pendiente`**: Registrada o importada desde Siebel/Excel. Espera agendamiento.
2. **`Programada`**: El Backoffice coordinó con el cliente y programó una Visita con fecha y técnico.
3. **`EnProgreso`**: El técnico inició la atención en el domicilio (`EnCurso`).
4. **`Rechazada`**: La visita no se pudo concretar o fue interrumpida en sitio; queda en bandeja de mesa de control para contactar al abonado o evaluar su reprogramación.
5. **`Completa`**: El técnico terminó la labor física en campo; queda retenida a la espera del semáforo administrativo (regularización de stock en almacén o sincronización de evidencias).
6. **`Finalizada`**: Evidencias fotográficas validadas y descarga de materiales confirmada en inventario.
7. **`Liquidada`**: Facturada y aprobada por Finanzas para pago de tarifas y variables.
8. **`Cancelada`**: Anulación definitiva por desistimiento del cliente o inviabilidad contractual.

### 3.2 Semáforo Administrativo (`Completa` → `Finalizada`)

Una orden en estado `Completa` solo se promueve a `Finalizada` cuando se cumplen simultáneamente:
- **Tareas Técnicas:** Tareas resueltas (`Completa` o `Rechazada`).
- **Materiales:** `DescargaMaterialesConfirmada == true` (Almacén descargó el stock o el trabajo no consumió materiales).
- **Evidencias:** `EvidenciasConfirmadas == true` (Fotos de fachada, equipo instalado y firma digital recibidas).

### 3.3 Soporte Desconectado (Offline-First en App Móvil)
- Si el técnico se encuentra en zonas sin cobertura 4G, la app guarda localmente en el dispositivo las tareas, firma y fotos comprimidas.
- Permite cerrar la visita de inmediato sin bloquear al técnico.
- Un servicio en segundo plano (`WorkManager`) sincroniza automáticamente con el servidor apenas se recupera la señal o mediante conexión Wi-Fi, respetando la hora real de cierre en campo.

### 3.4 Evidencias Fotográficas y Firma Dinámicas
- **Configuración por Tipo de Orden:** Cada `TipoOrdenTrabajo` define si `ExigeFirmaCliente` y `ExigeEvidenciasFotograficas`.
- **Colección 1 a N:** Las fotos ya no están fijas en el código. Cada visita registra su propia lista de evidencias (`OrdenTrabajoVisitaEvidencia`), donde cada una tiene su nombre (ej. *"Foto Antena"*, *"Foto Conector"*, *"Medición Potencia"*), URL, coordenadas GPS y si es de carácter obligatorio para dar por confirmada la visita.

### 3.5 Catálogo Maestro de Motivos de Incidencia (`MotivoIncidencia`)
Para garantizar la precisión de auditorías y reportes ejecutivos, se eliminan los textos libres para justificar cancelaciones o rechazos, reemplazándolos por un catálogo parametrizable por el usuario:
- **Ámbito Visita:** Motivos para no concretar o cancelar una visita presencial (ej. *"Cliente ausente"*, *"Lluvia torrencial"*).
- **Ámbito Orden de Trabajo:** Motivos para cancelar la orden comercial completa (ej. *"Cliente desiste del contrato"*, *"Inviabilidad técnica definitiva"*).
- **Ámbito Tarea:** Motivos para rechazar una subtarea específica en el domicilio (ej. *"Cliente rechaza punto adicional por costo"*).

---

## 4. Integración con el Módulo CRM (Gestión de Clientes)

Para mantener la máxima flexibilidad y escalabilidad:
- **Catálogo Central de Clientes:** Toda la información fiscal, RUC/DNI, razón social y contactos reside en el módulo **CRM**.
- **Consumo Desacoplado:** Al crear una orden de trabajo, el Backoffice selecciona el cliente solicitante o cliente final directamente desde el catálogo de CRM.
- **Crecimiento Modular:** Si la empresa adquiere módulos adicionales en el futuro (ej. Facturación Electrónica o Ventas), todos compartirán la misma base unificada de clientes sin duplicación de registros.

---

## 5. Preguntas Frecuentes y Buenas Prácticas para el Cliente

### ¿Qué pasa si un técnico cambia de cuadrilla a mitad del día?
El **Backoffice** puede ingresar a la orden en estado "Agendada" y reasignar la orden al nuevo técnico o vehículo. Al instante, la orden desaparecerá de la lista del técnico saliente y se sincronizará en la del técnico entrante.

### ¿Se pueden liquidar órdenes sin firma del cliente?
El sistema solicita obligatoriamente la firma digital del cliente o, en su defecto, una fotografía de descargo/acta física con motivo justificado para habilitar el botón de cierre.

### ¿Quién configura los precios de los servicios?
Únicamente el usuario con rol **`ServicioCampoAdmin`**. Cada contrato o empresa principal cuenta con un tarifario con vigencia histórica (fecha desde - hasta), garantizando que las órdenes pasadas no sufran alteraciones si los precios cambian en el futuro.
