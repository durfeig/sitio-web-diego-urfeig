# diegourfeig.com

Sitio personal de Diego Urfeig como speaker de IA, agentes y datos. Está pensado para organizadores de eventos y empresas que buscan una charla o un diagnóstico. La idea es que quien entre piense "esta persona sabe de lo que habla" y lo contacte.

Desde el 21/11/2026 el sitio en producción es el rediseño de la rama `claude/speaker-website-design-00e595` (PR #1). Hasta que ese PR se mergee, `main` tiene el sitio viejo.

## Qué tiene

- **Hero** con un video de 6 segundos de Diego en el escenario del eCommerce GO Córdoba 2026 (`assets/video/hero-ego.mp4`) y un titular con una frase que rota ("Los agentes ya pueden …").
- **Fondo 3D** (`js/scene.js`): una red de flujos con nodos de persona (ámbar) y de agente (cian) y casos que circulan.
- **Roles con flujos vivos**: se elige uno de seis roles y se compara «Hoy» con «Con un agente». Debajo hay una tabla en texto con lo mismo, para buscadores y lectores.
- **Dolores**: siete frases en primera persona. Al tocar una, la página baja a la charla que la resuelve. "No sabemos por dónde empezar" lleva al diagnóstico.
- **Charlas**: siete, cada una con descripción, "Te llevás", público y duración.
- **Episodios** de "IA en 1 minuto" (27, 36 y 38) reproducidos en el sitio.
- **Preguntas frecuentes** (diez), que también van en los datos estructurados.
- **Diagnóstico gratuito**: cinco preguntas que se responden de a una y llegan por mail.
- **Formulario de contacto.**

## Archivos

| Archivo | Para qué |
|---|---|
| `index.html` | Toda la página. Lleva GTM, datos estructurados (persona, sitio, servicios, FAQ) y el lugar marcado para el SmartCode de Probeta. |
| `css/styles.css`, `js/main.js`, `js/scene.js` | Estilos, interacción y medición, escena 3D. Se versionan con `?v=` en `index.html`. |
| `.htaccess` | Redirección a `www`, HTTPS, caché, compresión, 404 y `noindex` en el subdominio de prueba. |
| `robots.txt`, `sitemap.xml`, `llms.txt`, `llms-full.txt` | SEO y GEO (búsquedas en asistentes de IA). |
| `404.html` | Página de error. |

## De dónde lee y dónde escribe

- Los formularios (contacto y diagnóstico) se mandan por Formsubmit (AJAX) al mail personal de Diego. No hay backend propio.
- La medición va al `dataLayer` de Google Tag Manager `GTM-NV3FT6SL`, que carga GA4 `G-K6DN2Y5TMN`. Eventos: `cta_click`, `role_select`, `flow_mode`, `talk_open`, `talk_reserve`, `video_play`, `faq_open`, `diagnostic_start`, `diagnostic_step`, `generate_lead`, `section_view`, `pain_select`. Los botones principales tienen `data-track` fijo (por ejemplo `hero-charla`, `header-reservar`) para apuntarles tests.

## Dónde está publicado

- **Producción:** https://www.diegourfeig.com/ (Hostinger, hosting compartido, carpeta `public_html` del dominio). `diegourfeig.com` sin www redirige a www.
- **Prueba:** https://nuevo.diegourfeig.com/, servido desde `public_html/nuevo`. Por eso también responde en `www.diegourfeig.com/nuevo/`. Ninguna de las dos direcciones de prueba se indexa: lo resuelve el `.htaccess`, así que los mismos archivos sirven para prueba y producción.
- **Respaldo del sitio anterior:** tag de git `respaldo-sitio-en-vivo-2026-11-21` (17 archivos tal como estaban en vivo). Al 22/11 ese tag está solo en la Mac de Diego, no en GitHub.

## Cómo se publica un cambio

1. Trabajar en una rama y probar en local (`http://localhost:4173`).
2. Probar en móvil **con y sin "Reducir movimiento"** (ver CLAUDE.md).
3. Si cambió el CSS o el JS, subir el número de `?v=` en `index.html`: el CDN de Hostinger guarda esos archivos 7 días.
4. Subir al subdominio de prueba (`public_html/nuevo`) y revisar.
5. Con el OK de Diego, subir a producción. Se usa el conector de Hostinger de claude.ai (Diego lo activa en la sesión): se pide una URL de subida y se sube archivo por archivo, con `index.html` al final.
6. Pushear la rama para que GitHub quede igual que producción.

## Qué hacer si falla

- **Un archivo da 404 justo después de subirlo:** suele ser el CDN de Hostinger. Recargar a los pocos segundos.
- **El sitio no se mueve en el teléfono:** revisar el manejo de `prefers-reduced-motion` en `main.js` y `scene.js`. El video, los flujos de roles, la frase que rota y los puntos del fondo tienen que seguir andando.
- **El CSS o el JS nuevo no aparece:** falta subir el `?v=`.
- **Hay que volver al sitio anterior:** el tag `respaldo-sitio-en-vivo-2026-11-21` tiene los archivos como estaban en vivo.
- **No llegan los formularios:** revisar Formsubmit. El envío real no se probó todavía (ver NOTAS.md).

## Dueño

Diego Urfeig. Repo personal: `durfeig/sitio-web-diego-urfeig`. Para pushear se usa la cuenta `durfeig`, porque `foro-ukeai` y `Ukelele-Growth-Company` no tienen permiso de escritura.
