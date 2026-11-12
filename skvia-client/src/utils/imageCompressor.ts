/**
 * Utilidad de compresión y redimensionamiento de imágenes en cliente (Browser Canvas).
 * Reduce fotos de smartphones (4MB - 12MB) a ~150KB - 300KB antes de enviarlas al servidor.
 * Ahorra 95% de datos móviles del técnico y 95% de espacio en disco en el VPS Hetzner.
 */

export interface OpcionesCompresion {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export async function comprimirImagen(
  file: File,
  opciones: OpcionesCompresion = {}
): Promise<string> {
  const { maxWidth = 1600, maxHeight = 1600, quality = 0.82 } = opciones;

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Escalar dimensiones proporcionalmente
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Comprimir en JPEG a calidad optimizada
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
}

export async function comprimirImagenAFile(
  file: File,
  opciones: OpcionesCompresion = {}
): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  const dataUrl = await comprimirImagen(file, opciones);
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const nuevoNombre = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
  return new File([blob], nuevoNombre, { type: 'image/jpeg' });
}
