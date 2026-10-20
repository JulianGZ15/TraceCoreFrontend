# TraceCore frontend

Angular 21 + Tailwind 4, componentes standalone por funcionalidad, SCSS externo y API real. Etapa 1: sesión, inicio, cuenta, empresa, patios, usuarios, roles, permisos, asignaciones y auditoría. Etapa 2: directorio y expediente de terceros, contactos, documentos, evidencias, condiciones comerciales, autorizaciones, AVL y cuotas.

La etapa 2 requiere el backend con `GET /api/v1/parties/quota-yards` y `creditLimitExact` en condiciones comerciales. La etapa 3 añade el catálogo técnico y equipos en `features/equipment`, con `EQUIPMENT_READ`, `EQUIPMENT_MANAGE`, `TECHNICAL_APPROVE` y `OWNERSHIP_MANAGE`. El frontend conserva importes, cantidades, temperaturas y contadores como texto decimal exacto y muestra incompatibilidad si falta el campo exacto; no usa el importe numérico como respaldo.

## Ejecutar

Desde esta carpeta:

```powershell
npm ci
npm start
```

Abrir `http://localhost:4200/login`. El backend debe estar configurado y ejecutándose en `http://127.0.0.1:8080`, con una cuenta existente; consultar [organización y acceso](../../docs/back/05-organizacion-acceso.md) para el bootstrap explícito. La aplicación no tiene credenciales predeterminadas ni registro público.

`proxy.conf.json` publica `/api/**` en el mismo origen durante desarrollo y conserva Host/Origin (`changeOrigin: false`). Para otro puerto, ajustar su target. En producción, `API_PATH` define la ruta de la API en el mismo origen; su valor predeterminado es `/api/v1`. El interceptor solo adjunta Bearer a solicitudes de ese origen y dentro de esa ruta.

### Desplegar en Dokploy con Docker

El `Dockerfile` instala dependencias con Node 22, compila Angular en una etapa de construcción y sirve `dist/TraceCore/browser` con Nginx. Nginx conserva el fallback de rutas al `index.html` para que funcionen las rutas directas de Angular. `API_PATH` se lee al iniciar el contenedor; no hace falta recompilar para cambiarlo. Ejemplo local: `.env.example`.

En Dokploy configura:

- **Build Type:** Dockerfile
- **Dockerfile Path:** `./Dockerfile`
- **Docker Context Path:** `.`
- **Dominio, puerto del contenedor:** `80`
- **Variables de entorno:** `API_PATH=/api/v1` y `API_UPSTREAM=http://tracecore-backend:8080`

Sustituye `API_UPSTREAM` por el origen HTTP(S) del backend, accesible desde el contenedor frontend (por ejemplo, su nombre de servicio en la red compartida de Dokploy). Nginx reenvía `API_PATH` al backend conservando el prefijo; el navegador siempre llama al frontend en el mismo origen, por lo que el interceptor puede adjuntar Bearer de forma segura. Si `API_UPSTREAM` no se define, las rutas de API responden `502` en vez de devolver el HTML de Angular.

No pongas secretos en `API_PATH`: esta ruta se expone al navegador. Debe comenzar con `/` y no incluir dominio, query ni fragmento. `API_UPSTREAM` solo admite el esquema y host/puerto, sin ruta adicional.

Los permisos proceden de `/auth/context` y se comprueban en el backend.

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

Requiere Java 21 y PostgreSQL local; `-PostgresBin` admite otra carpeta. El script empaqueta el backend, crea una base aislada y un administrador de prueba, elige puertos libres y ejecuta los flujos de las cinco etapas. Incluye expedientes, contactos principales, carga/descarga de evidencia, revisión documental, crédito exacto, elegibilidad AVL y cuotas. Cada ejecución usa un directorio exclusivo de evidencias. Detiene backend y clúster en `finally`, restaura las variables de entorno y conserva logs en `Backend/tracecore/target/frontend-smoke`; los artefactos de navegador quedan en `test-results-live`. No utiliza la base de trabajo.

El resultado de cada entrega se registra en [etapa 1](../../docs/front/02-etapa1-organizacion-acceso.md), [etapa 2](../../docs/front/03-etapa2-terceros-contactos-avl.md) y [etapa 3](../../docs/front/04-etapa3-catalogo-tecnico-equipos.md). El contrato ampliado está documentado en [catálogo técnico y equipos](../../docs/back/07-catalogo-tecnico-equipos.md).

## Calidad, mantenimiento y cumplimiento

[Etapa 5 y resultados de verificación](../../docs/front/06-etapa5-calidad-mantenimiento-cumplimiento.md). El módulo quality incluye directorio, estándares, requisitos, políticas, MTR, inspecciones, certificaciones, órdenes/tareas, retenciones, liberaciones y evidencias. Sus 36 componentes se generaron con Angular CLI y conservan plantilla, SCSS y spec independientes. Reutiliza las dependencias, tokens, SVG y controles existentes.

El ejecutor de API real mantiene PostgreSQL y archivos exclusivos por ejecución. Además de los flujos 1–5, reemplaza completamente el proceso backend con bootstrap desactivado y comprueba el recibo idempotente persistente, la representación actual y el rechazo de payload diferente. Restaura configuración y detiene procesos en finally. Evidencias y solicitudes JSON pendientes no comparten almacenamiento: los archivos no se persisten en navegador; pendientes JSON quedan asociados al actor en sessionStorage y se limpian al terminar sesión.
