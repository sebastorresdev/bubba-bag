# Command Bar (Barra de Comandos) — Reglas de Estilo

## Botones sin color de fondo

Los botones del `CommandBarComponent` **NUNCA** deben usar `primary: true` ni tener color de fondo.
Todos los botones deben ser de tipo `text` (plano, transparente) para mantener uniformidad visual
siguiendo el patrón de **Dynamics 365 / Fluent UI**.

La jerarquía de acciones se comunica por **posición** (la acción más importante va primero),
no por color de fondo.

### ❌ Incorrecto
```typescript
{
  key: 'nuevo',
  label: 'Nuevo',
  icon: 'plus',
  primary: true,  // ← NO usar primary en command bar
  execute: () => this.crear(),
}
```

### ✅ Correcto
```typescript
{
  key: 'nuevo',
  label: 'Nuevo',
  icon: 'plus',
  execute: () => this.crear(),
}
```

## Colores de íconos sí están permitidos

Lo que **sí** está permitido es que los **íconos** individuales tomen un color
para dar contexto visual (por ejemplo, verde para acciones positivas, rojo para peligro),
pero el botón en sí permanece transparente/text.

## Dónde sí usar `nzType="primary"`

Los botones `primary` de ng-zorro son apropiados en:
- **Modales**: Botón de acción principal del footer (ej: "Guardar", "Confirmar")
- **Formularios**: Botón de envío principal
- **Drawers**: Botón de acción principal

Pero **nunca** dentro del `CommandBarComponent`.
