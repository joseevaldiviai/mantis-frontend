# Mantis Intelligence System — Frontend (CMMS)

Frontend en React + TypeScript + Vite para el backend CMMS multi-empresa
(Laravel 13). Conecta con los 137 endpoints documentados en el README del
backend.

---

## 1. Qué se hizo sobre el prototipo original

El prototipo (armado en Google AI Studio) ya traía una arquitectura muy
sólida: un modo **demo** (datos simulados en `localStorage`, sin backend) y
un modo **live** (contra la API real), intercambiables desde el ícono de
ajustes (⚙) sin recompilar. Sobre eso se hizo:

### Bugs de integración corregidos (modo live)
Se auditó `src/services/api.ts` método por método contra las rutas reales
del backend y se corrigieron discrepancias reales, entre ellas:

| Problema encontrado | Corrección |
|---|---|
| `getUsers`/`createUser`/`updateUser`/`deleteUser` pegaban a `/usuarios` | El backend expone `/users` (inglés) |
| `updateUser` usaba `PUT` | La ruta solo acepta `PATCH` (hubiera dado 405) |
| `addCollaborator` mandaba `{user_id}` | El backend espera `{user_ids: [...]}` (array) |
| Quitar colaborador mandaba el `id` del pivot | Hace falta el `user_id` real |
| `finalizeWorkOrder` mandaba `genera_tiempo_inactivo`/`costo_mano_obra`/`minutos_inactividad` dentro de `/finalizar` | Esos campos no existen en ese endpoint (se ignoraban en silencio); ahora `costo_mano_obra`/`genera_tiempo_inactivo` van por un `PATCH` aparte, y `minutos_inactividad` se descarta (es un valor calculado por el backend, nunca se envía) |
| Crear OT mandaba `operarios_ids` en el mismo POST | El backend no lo acepta ahí — ahora se crea la OT y después se agregan los colaboradores con una llamada aparte a `.../colaboradores` |
| Formulario de crear OT no pedía categoría ni tipo de solicitud | Son obligatorios en el backend — se agregaron los selectores |
| Especialidades de usuario: texto libre con IDs inventados (`idx+1`) | Ahora se traen las especialidades reales de `GET /especialidades` y se manda `especialidad_ids` (los IDs reales) |
| Plan de mantenimiento preventivo no mandaba `tipo_solicitud_id` (obligatorio) | Se agregó el selector y el campo al payload |
| `tipo_disparador` usaba el valor `'dias'` | El backend espera `'calendario'` |
| QR de la máquina se renderizaba con un servicio externo (quickchart.io) a partir del token en crudo | Ahora usa la imagen real generada y persistida por el backend (`GET /maquinas/{id}/qr`, autenticada) |
| Exportar CSV (historial de máquina / inventario) regeneraba el archivo en el cliente con datos locales | En modo live, descarga el CSV real del backend (`GET .../historial/exportar`, `GET /repuestos/exportar`) |
| `regenerateMachineQr` esperaba `{qr_token}` de vuelta | El backend responde `204` sin cuerpo — ahora se vuelve a pedir la máquina después de regenerar |
| Listados sin paginar (quedaban truncados a 20 registros, el default del backend) | Se agregó `?per_page=100` a todos los listados |

### Marca
- Paleta de colores reemplazada por el teal del logo de Mantis (`#165B62` y
  derivados) en todos los componentes — antes era una paleta menta/beige
  genérica del template original.
- Logo real integrado en el header y la pantalla de login (`public/logo-icon.png`,
  `public/logo-mantis.png`), favicon generado a partir del isotipo.

### Nuevo
- Pestaña **"Asistente IA"** (`src/components/RagView.tsx`): placeholder
  para el RAG que se va a desarrollar más adelante — no es una vista vacía,
  explica qué va a hacer y cómo se apoya en lo que el backend ya expone
  (rol `integracion` de solo lectura por empresa, documentos por máquina).
  Reemplazar ese componente es todo lo que va a hacer falta cuando se
  desarrolle esa parte.

### Limpieza para Vercel
- Se sacaron `@google/genai`, `express` y `dotenv` de `package.json` (no se
  usaban en el código — eran del template de AI Studio, pensado para
  desplegar en Cloud Run con un server Express).
- `vite.config.ts` simplificado (sin el hack de HMR específico de AI Studio).
- `vercel.json` agregado.
- `.env.example` reescrito (el original era para la API key de Gemini).

---

## 2. Correr en local

```bash
npm install
cp .env.example .env
# Editar .env si tu backend no corre en http://localhost:8080/api
npm run dev
```

Abre `http://localhost:3000` (o el puerto que indique la consola). Por
defecto arranca en **modo demo** — para conectarlo al backend real, click
en el ícono ⚙ (esquina superior derecha), pasar a modo "Live", poner la URL
de tu backend (ej. `http://localhost:8080/api`) y loguearte con un usuario
real (`admin@example.com` / lo que hayas configurado en el seeder).

## 3. Build de producción (verificado)

```bash
npm run build   # corre "tsc --noEmit && vite build" — falla si hay errores de tipos
```

Ya se corrió en este entorno antes de entregar el proyecto: compila limpio,
sin errores de TypeScript, genera `dist/` (~110 KB gzipped de JS).

## 4. Desplegar en Vercel

### Opción A — Import desde Git (recomendada)
1. Subí este proyecto a un repo (GitHub/GitLab/Bitbucket).
2. En Vercel: **Add New → Project → Import** ese repo.
3. Vercel detecta Vite automáticamente (`vercel.json` ya lo deja explícito).
4. En **Environment Variables**, agregar:
   - `VITE_API_BASE_URL` = la URL pública de tu backend (ej.
     `https://api.tuempresa.com/api`)
   - `VITE_DEFAULT_MODE` = `live` (opcional — si no la ponés, arranca en
     demo y el usuario elige modo "Live" a mano desde el ⚙)
5. **Deploy**.

### Opción B — Vercel CLI
```bash
npm i -g vercel
vercel          # primer deploy (te pregunta configuración)
vercel --prod   # deploys siguientes a producción
```

### Importante: CORS en el backend
Tu backend Laravel necesita permitir el dominio de Vercel en
`FRONTEND_URLS` (`.env` del backend) y en `SANCTUM_STATEFUL_DOMAINS` si
corresponde — ver la sección de CORS en el README del backend. Sin esto,
el navegador va a bloquear las peticiones aunque el backend esté
funcionando bien.

### Nota sobre la URL configurable en runtime
El selector de modo/URL (ícono ⚙) guarda la configuración en
`localStorage` del navegador — así que **cada usuario** puede apuntar su
sesión a un backend distinto sin necesidad de un build separado por
cliente/entorno. `VITE_API_BASE_URL` solo define el valor por *default* la
primera vez que alguien abre la app en un navegador nuevo.

---

## 5. Estructura

```
src/
├── App.tsx                  Enrutamiento por pestañas (estado local, sin react-router)
├── types.ts                 Tipos TS — reflejan las Resources del backend
├── services/
│   ├── api.ts                Cliente HTTP (modo demo/live) — TODA la integración vive acá
│   └── mockData.ts           Datos de ejemplo para el modo demo
└── components/
    ├── Header.tsx             Nav + logo + selector de empresa/notificaciones
    ├── LoginScreen.tsx
    ├── ApiConfigModal.tsx     Selector demo/live + URL del backend + token
    ├── DashboardView.tsx      KPIs (GET /dashboard/resumen)
    ├── WorkOrdersView.tsx / WorkOrderDetailModal.tsx
    ├── MachinesView.tsx / MachineDetailModal.tsx   (incluye QR real + contadores + KPIs por equipo)
    ├── InventoryView.tsx      Repuestos
    ├── PreventivePlansView.tsx  Mantenimiento preventivo
    ├── PurchasesVendorsView.tsx Proveedores + órdenes de compra
    ├── CatalogsView.tsx        Catálogos (tipos de solicitud, categorías, estados de OT)
    ├── UsersCompaniesView.tsx  Usuarios + empresas (multi-tenant)
    ├── NotificationsModal.tsx
    ├── PublicQrReportModal.tsx Simulación del reporte público (sin login) vía QR
    └── RagView.tsx             Placeholder del asistente RAG (ver sección 1)
```

## 6. Qué NO se tocó (funciona igual que en el prototipo original)
- El modo demo completo (`mockData.ts` + ramas `mode === 'demo'` en
  `api.ts`) — es una simulación local, no habla con ningún backend, y no
  tenía bugs de integración por definición.
- El diseño general de cada pantalla (layout, glassmorphism, disposición de
  formularios) — solo se recolorearon los componentes, no se rediseñaron.
