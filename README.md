# diegourfeig.com

Sitio personal de Diego Urfeig como speaker de IA, agentes y datos. Está pensado para organizadores de eventos y empresas que buscan una charla o un diagnóstico. La idea es que quien entre piense "esta persona sabe de lo que habla" y lo contacte.

Desde el 21/11/2026 el sitio en producción es el rediseño de la rama `claude/speaker-website-design-00e595` (PR #1). Hasta que ese PR se mergee, `main` tiene el sitio viejo.

## Qué tiene

- **Hero** con un video de 6 segundos de Diego en el escenario del eCommerce GO Córdoba 2026 (`assets/video/hero-ego.mp4`) y un titular con una frase que rota ("Los agentes ya pueden …").
- **Fondo 3D** (`js/scene.js`): una red de flujos con nodos de persona (ámbar) y de agente (cian) y casos que circulan.
- **Roles con flujos vivos**: se elige uno de seis roles y se compara «Hoy» con «Con un agente». Debajo hay una tabla en texto con lo mismo, para buscadores y lectores.
- **Dolores**: siete frases en primera persona. Al tocar una, la página baja a la charla que la resuelve. "No sabemos por dónde empezar" lleva al diagnóstico.
- **Charlas**: siete, cada una con descripción, "Te llevás", público y duración.
- **Episodios** de "IA en 1 minuto": tres, reproducidos en el sitio. La lista se actualiza sola cada semana (ver "Rutinas"). Al 23/11 muestra el #37 (con la marca "Nuevo"), el #26 y el #04.
- **Blog** (`/blog/`), desde el 23/11/2026: artículos que salen de los episodios y de las charlas, para que ChatGPT, Claude, Gemini y Perplexity citen el sitio. Al 23/11 tiene 7 artículos. El código está en la rama `claude/keen-feynman-daa3da` (PR #3, apilado sobre el #1).
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
| `assets/episodios.json` | La lista de episodios que muestra la página. La escribe la rutina semanal. |
| `scripts/episodios/actualizar.py` | Elige los tres episodios (el último si tiene menos de 21 días, más los más vistos) y prepara videos y portadas. No sube nada. |
| `scripts/episodios/subir.py` | Sube a Hostinger lo que preparó `actualizar.py`, con `episodios.json` al final. |
| `scripts/blog/construir.py` | Arma el blog desde los `.md` de Drive: páginas, datos estructurados, sitemap, `llms.txt`, `llms-full.txt` y RSS. Con `--borradores` (prueba) incluye borradores y revisiones. |
| `scripts/blog/pendientes.py` | Dice qué episodio toca convertir en artículo y prepara su video. Elige como mucho uno y no elige ninguno si hay un borrador de episodio esperando el OK. |

## De dónde lee y dónde escribe

- Los formularios (contacto y diagnóstico) se mandan por Formsubmit (AJAX) al mail personal de Diego. No hay backend propio.
- La medición va al `dataLayer` de Google Tag Manager `GTM-NV3FT6SL`, que carga GA4 `G-K6DN2Y5TMN`. Eventos: `cta_click`, `role_select`, `flow_mode`, `talk_open`, `talk_reserve`, `video_play`, `faq_open`, `diagnostic_start`, `diagnostic_step`, `generate_lead`, `section_view`, `pain_select`. Los botones principales tienen `data-track` fijo (por ejemplo `hero-charla`, `header-reservar`) para apuntarles tests.

- **Artículos del blog:** viven en Drive, en `Mi unidad/Sitio diegourfeig.com/blog/`, un `.md` por artículo, con `estado: borrador` o `publicado`. Las correcciones de un artículo ya publicado van en `blog/_revisiones/`, con el mismo nombre de archivo, hasta que Diego las aprueba.
- **Guía de voz del blog:** `Mi unidad/Sitio diegourfeig.com/voz-diego.md` (desde el 24/11). Tono, ritmo, palabras de Diego, qué evitar y ejemplos de antes y después. Está afuera de `blog/` para que no se tome como artículo.
- **Material de los episodios:** las carpetas `epNN · …` de "IA en 1 minuto" en Drive. Si existen, el blog usa la ficha `editado/epNN_blog.md` y `editado/epNN_transcripcion_final.txt`, que deja la skill `editar-episodio` del repo `durfeig/ia-en-1-minuto`.
- **Reproducciones de Instagram:** las lee la rutina semanal con Apify (≈USD 0,12 por corrida).

## Rutinas (tareas programadas de la app de Claude, en la Mac de Diego)

- **`sitio-episodios-ia-en-1-minuto`, los lunes a las 9:** lee las reproducciones, corre `actualizar.py` y `subir.py`, y avisa por WhatsApp solo si la lista cambió o si algo falló. Si falla Instagram, Drive o Hostinger, no publica nada y el sitio queda con la lista anterior.
- **`sitio-blog-ia-en-1-minuto`, todos los días a las 10:30:**
  1. Lee WhatsApp. Si Diego respondió «OK blog NN», «OK blog <código>» o «OK blog todos», publica lo aprobado.
  2. Después redacta el borrador del próximo episodio, lo sube a `nuevo.` y le manda el link.
  3. No hay más de un borrador de episodio a la vez. Los artículos de fondo van aparte.
  4. Un OK cuenta solo si llegó después de la última edición del borrador.

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

- **Se borraron los artículos de `llms-full.txt` en producción:** el `llms-full.txt` del repo no tiene la sección `## Blog`, que se agrega al construir. Hay que reconstruirlo con `python3 scripts/blog/construir.py "<Drive>/Sitio diegourfeig.com/blog" <salida>` y subir `<salida>/llms-full.txt`.
- **La lista de episodios no cambió un lunes:** revisar el aviso de WhatsApp de la rutina. Si Instagram, Drive o Hostinger fallaron, el sitio queda a propósito con la lista anterior.
- **La rutina del blog no sube el borrador a la prueba:** la sube con el conector de Hostinger de claude.ai. Si ese conector no está en la sesión de la rutina, el borrador queda en Drive y Diego recibe un WhatsApp con el error. Activar el conector para las tareas programadas y volver a correr la rutina (pasó el 24/11 con el ep37).
- **Un borrador del blog no se publica:** el OK tiene que empezar con «OK blog» y llegar después de la última edición del `.md`.

- **Un archivo da 404 justo después de subirlo:** suele ser el CDN de Hostinger. Recargar a los pocos segundos.
- **El sitio no se mueve en el teléfono:** revisar el manejo de `prefers-reduced-motion` en `main.js` y `scene.js`. El video, los flujos de roles, la frase que rota y los puntos del fondo tienen que seguir andando.
- **El CSS o el JS nuevo no aparece:** falta subir el `?v=`.
- **Hay que volver al sitio anterior:** el tag `respaldo-sitio-en-vivo-2026-11-21` tiene los archivos como estaban en vivo.
- **No llegan los formularios:** revisar Formsubmit. El envío real no se probó todavía (ver NOTAS.md).

## Dueño

Diego Urfeig. Repo personal: `durfeig/sitio-web-diego-urfeig`. Para pushear se usa la cuenta `durfeig`, porque `foro-ukeai` y `Ukelele-Growth-Company` no tienen permiso de escritura.
