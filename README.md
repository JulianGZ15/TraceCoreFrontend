# TraceCore frontend

Angular 21 + Tailwind 4, componentes standalone por funcionalidad, SCSS externo y API real. Etapa 1: sesión, inicio, cuenta, empresa, patios, usuarios, roles, permisos, asignaciones y auditoría.

## Ejecutar

Desde esta carpeta:

```powershell
npm ci
npm start
```

Abrir `http://localhost:4200/login`. El backend debe estar configurado y ejecutándose en `http://127.0.0.1:8080`, con una cuenta existente; consultar [organización y acceso](../../docs/back/05-organizacion-acceso.md) para el bootstrap explícito. La aplicación no tiene credenciales predeterminadas ni registro público.

`proxy.conf.json` publica `/api/**` en el mismo origen y conserva Host/Origin (`changeOrigin: false`). Para otro puerto, ajustar su target. Producción requiere servir la API bajo `/api/v1`, conservar el origen público y redirigir las rutas de Angular al `index.html`.

`API_BASE` permite configurar otra base HTTP mediante un provider; el interceptor verifica origen y límite de ruta antes de adjuntar Bearer. Los permisos proceden de `/auth/context` y se comprueban en el backend.

## Componentes modulares

```powershell
npx ng g c features/organization/nueva-pantalla --style=scss --type=component
```

El workspace genera carpeta propia, `.component.ts`, `.component.spec.ts`, `.component.html` y `.component.scss`: una declaración por archivo, HTML/SCSS externos, rutas diferidas y componentes compartidos en `shared/ui`. Los archivos de reexportación no declaran componentes. `src/styles.css` conserva tokens y patrones compartidos; cada pantalla mantiene su layout en su SCSS.

Seguir [design.md](../../docs/front/design.md) y la [skill local](../../.agents/skills/tracecore-design/SKILL.md). El SVG se sirve desde `public/assets/brand`; para sincronizarlo con su fuente canónica:

```powershell
npm run sync:brand
```

Fuentes e iconos se sirven localmente. Las licencias están en `public/assets/licenses` y `public/assets/icons/LICENSE`.

## Verificar

```powershell
npm run build
npm run test:unit
npx playwright install chromium
npm run test:e2e
```

Vitest verifica sesión, guards, Bearer, errores, vigencias, contraseñas y componentes. Playwright usa fixtures solo en `e2e`; la aplicación consume la API real. Captura login, inicio, listado, diálogo y formulario a 390, 768, 1280 y 1440 px en `test-results`; el informe queda en `playwright-report`.

Para comprobar el navegador contra Spring Boot y PostgreSQL reales:

```powershell
.\tools\test-live-api.ps1
```

Requiere Java 21 y PostgreSQL local; `-PostgresBin` admite otra carpeta. El script empaqueta el backend, crea una base aislada y un administrador de prueba, elige puertos libres y ejecuta altas, permisos, alcance de patio, revocación y cambio de contraseña. Detiene backend y clúster en `finally`, restaura las variables de entorno y conserva logs en `Backend/tracecore/target/frontend-smoke`. No utiliza la base de trabajo.

El resultado y las limitaciones de esta entrega se registran en [la especificación de etapa 1](../../docs/front/02-etapa1-organizacion-acceso.md).
