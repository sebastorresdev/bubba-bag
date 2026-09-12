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

## 3. Flujo de Vida de una Orden de Trabajo (End-to-End)

El ciclo de vida de una orden sigue un flujo de estados estricto y auditable:

```
  [Borrador] 
      │
      ▼ (Backoffice asigna cuadrilla y fecha)
  [Agendada]
      │
      ▼ (Técnico inicia recorrido en la app)
  [En Traslado]
      │
      ▼ (Técnico llega al predio del cliente)
  [En Sitio]
      │
      ▼ (Técnico ejecuta tareas, sube fotos y firma)
  [Ejecutada / Pendiente Validación]
      │
      ▼ (Backoffice valida calidad y pruebas)
  [Liquidada / Completada]
```

### Casos de Excepción
- **Reprogramada / No Contactado:** Si el cliente no se encuentra en el domicilio, el técnico registra la novedad y la orden regresa al Backoffice para reagendamiento de cita.
- **Cancelada:** Si el cliente desiste del servicio o la solicitud es errónea, únicamente el Backoffice o el Administrador pueden registrar el motivo formal de cancelación.

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
