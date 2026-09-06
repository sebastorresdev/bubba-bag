# Reglas de Estilos y Diseño Frontend (bubbabag-client)

## 1. Prohibición de TailwindCSS
- **NO USAR TailwindCSS**: Queda terminantemente prohibido el uso de TailwindCSS, utilidades de Tailwind (`flex`, `p-*`, `m-*`, `w-*`, etc.) y sus paquetes asociados (`@tailwindcss/postcss`, `tailwindcss`, `autoprefixer`).
- **Motivo de la decisión**: El usuario prefiere código limpio, legible y mantenible con clases semánticas propias y CSS puro, delegando el diseño y maquetación en Antigravity y utilizando componentes oficiales de **NG-ZORRO**.

## 2. Enfoque de Estilos (Vanilla CSS + NG-ZORRO)
1. **Componentes Oficiales de NG-ZORRO primero**:
   - Siempre que se requiera una tabla, tarjeta, formulario, botón, modal, avatar, badge o dropdown, se debe utilizar el componente nativo de NG-ZORRO (`nz-table`, `nz-card`, `nz-button`, `nz-modal`, etc.).
2. **Clases Semánticas Propias (Pure CSS)**:
   - Para la distribución, espaciado, alineación y estructura, crear clases descriptivas con CSS estándar (ej. `.page-header`, `.search-toolbar`, `.filter-group`, `.data-card`, etc.).
   - Ubicar estilos generales y de layout en archivos específicos dentro de `src/styles/` (ej. `src/styles/layout.css`, `src/styles/common.css`) o directamente en el archivo `.css` del componente.
3. **Respeto a los colores por defecto de NG-ZORRO**:
   - No sobreescribir ni forzar colores salvo que el usuario lo solicite explícitamente para mejorar un elemento específico (como el color corporativo del header `#021936`).
   - El tema claro y tema oscuro deben operar con las hojas de estilo nativas de NG-ZORRO.
