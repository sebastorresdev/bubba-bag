# ==============================================================================
# Dockerfile para Frontend React + Vite + TypeScript (SKVIA Client)
# ==============================================================================

# Etapa 1: Compilación de la aplicación Vite
FROM node:22-alpine AS build
WORKDIR /app

# Copiar manifiestos de dependencias
COPY package.json package-lock.json* ./

# Instalar dependencias exactas
RUN npm ci

# Copiar código fuente
COPY . .

# Compilar para producción (genera carpeta /app/dist)
RUN npm run build

# ==============================================================================
# Etapa 2: Servidor Nginx de producción
# ==============================================================================
FROM nginx:alpine AS final

# Reemplazar configuración por defecto con la nuestra
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar el build compilado
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
