# 🌸 Melody Finanzas

App de gestión financiera personal diseñada para Melody.

## Funcionalidades
- 💵 Registro diario de ingresos (Tango Live, OF, etc.)
- 📋 Gestión de gastos con categorías, fechas y frecuencias
- 📅 Calendario visual con pagos pendientes y realizados
- 📊 Gráficas de barras por categoría + resumen visual
- 💱 Conversor USD → COP con tasa editable
- 🔥 Rachas de ingresos diarios y pagos realizados
- 🎉 Confetti al marcar pagos como completados
- 📱 PWA instalable en celular (funciona offline)

## Deploy en Vercel (Gratis) — Paso a paso

### Opción 1: Desde GitHub (Recomendada)
1. Crea una cuenta en [github.com](https://github.com) si no tienes
2. Crea un nuevo repositorio y sube esta carpeta completa
3. Ve a [vercel.com](https://vercel.com) y regístrate con tu cuenta de GitHub
4. Click en **"Add New Project"**
5. Selecciona tu repositorio de GitHub
6. Vercel detectará automáticamente que es Vite — solo haz click en **"Deploy"**
7. En ~1 minuto tendrás una URL tipo `melody-finanzas.vercel.app`

### Opción 2: Vercel CLI
```bash
npm install -g vercel
cd melody-app
npm install
vercel
```

## Instalar como App en el celular de Melody

### iPhone (Safari):
1. Abre la URL de Vercel en Safari
2. Toca el botón de compartir (cuadrado con flecha)
3. Selecciona **"Agregar a pantalla de inicio"**
4. ¡Listo! Aparece como app con ícono rosa

### Android (Chrome):
1. Abre la URL en Chrome
2. Toca el menú (tres puntos)
3. Selecciona **"Instalar app"** o **"Agregar a pantalla de inicio"**

## Desarrollo local
```bash
npm install
npm run dev
```

## Notas técnicas
- Los datos se guardan en `localStorage` del navegador
- No requiere servidor ni base de datos
- Funciona offline después de la primera visita
- PWA completa con Service Worker y manifest
