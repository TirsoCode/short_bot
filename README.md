# Short Bot

Generador automático de YouTube Shorts con tus propios videos y fotos.

## Qué hace

1. **Importa**: El bot escanea automáticamente las carpetas `videos/` y `fotos/` (cron cada 30 min + botón "Importar") y copia los medios a tu biblioteca.
2. **Genera**: Remotion crea Shorts 9:16 con frase gancho + tus medios.
3. **Revisión**: Dashboard en localhost:3000 → "Aceptar y Subir" o "Rechazar".
4. **Upload**: Sube automáticamente a YouTube al aceptar.

## Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **DB**: SQLite (sql.js)
- **Video**: Remotion
- **APIs**: YouTube (googleapis)

## Setup

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Genera una contraseña secreta para LOGIN_PASSWORD (nunca uses una por defecto)

# 3. Inicializar base de datos
npm run db:init

# 4. Arrancar
npm run dev
```

## Cómo usar

1. Abre http://localhost:3000
2. Entra con la contraseña de `LOGIN_PASSWORD` (defínela en tu `.env.local` o como secret/GitHub secret)
3. Mete tus videos y fotos en `videos/` y `fotos/` (formatos: mp4, mov, webm, jpg, png, gif, webp)
4. Ve a **Dashboard** → pulsa **Importar** (o espera al cron automático)
5. Ve a **Crear Short** → elige frase gancho + medios → Generar
6. En **Revisar** → Aceptar y Subir para subirlo a YouTube

## YouTube OAuth

Para que el bot suba a YouTube:

1. Google Cloud Console → APIs & Services → Credentials
2. Crear OAuth 2.0 Client ID (Web application)
3. Redirect URI: `http://localhost:3000/api/youtube/callback`
4. Copiar Client ID + Secret en **Configuración** del dashboard
5. Click "Conectar con YouTube"

## Comandos

```bash
npm run dev          # Desarrollo
npm run build        # Build producción
npm run db:init      # Init DB
npm run db:studio    # Drizzle Studio
```

## Opcional: importar desde GitHub

Si además quieres importar medios desde un repositorio GitHub, ve a **Configuración** y rellena los campos de GitHub (owner, repo, token PAT, etc.).
