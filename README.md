# Short Bot

Generador automático de YouTube Shorts desde tu repositorio de GitHub.

## Qué hace

1. **Sync**: Baja vídeos y capturas de tu repo GitHub (cron cada 30min + manual)
2. **Genera**: Remotion crea Shorts 9:16 con frase gancho + tus medios
3. **Revisión**: Dashboard en localhost:3000 → Accept/Reject
4. **Upload**: Sube automáticamente a YouTube

## Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **DB**: SQLite (Drizzle ORM)
- **Video**: Remotion
- **APIs**: GitHub (Octokit), YouTube (googleapis)

## Setup

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# 3. Inicializar base de datos
npm run db:init

# 4. Arrancar
npm run dev
```

## Cómo usar

1. Abre http://localhost:3000
2. Entra con tu GitHub PAT como clave
3. Ve a **Configuración** → rellena GitHub + YouTube
4. Haz **Sync GitHub** para descargar medios
5. Ve a **Crear Short** → elige frase + medios → Generar
6. En **Revisar** → Accept para subir a YouTube

## Credenciales

### GitHub PAT
1. GitHub → Settings → Developer settings → Personal access tokens
2. Crear token con scope `repo`

### YouTube OAuth
1. Google Cloud Console → APIs & Services → Credentials
2. Crear OAuth 2.0 Client ID (Web application)
3. Redirect URI: `http://localhost:3000/api/youtube/callback`
4. Copiar Client ID + Secret en Configuración
5. Click "Conectar con YouTube"

## Comandos

```bash
npm run dev          # Desarrollo
npm run build        # Build producción
npm run db:init      # Init DB
npm run db:studio    # Drizzle Studio
```

