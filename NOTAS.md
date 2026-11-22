# Notas

## 2026-11-21

### Rediseño del sitio como speaker (sesiones fe6edec1 y c322f3e8, rama `claude/speaker-website-design-00e595`)

Pedido: el mejor sitio dinámico para posicionar a Diego como speaker de datos e IA, con video de fondo y animaciones justas, revisando el contenido.

**Qué se probó y se descartó**
- Primera versión editorial, con un loop del ep36 de "IA en 1 minuto" en el hero y una cuadrícula de 100 empresas: Diego la descartó porque miraba mucho a cámara y el diseño se veía "clásico".
- Segunda versión con giroscopio 3D y el panel de CAMARCO 2026 en el hero: le gustaron los flujos de roles, pero no el átomo de fondo.
- Tercera versión (la que quedó): red de flujos 3D de fondo y video del eGO Córdoba 2026 (archivo que CACE le pasó a Diego).

**Qué se decidió y por qué**
- Video del hero: seis segundos del eGO Córdoba, recortados para sacar logo y subtítulos. Diego quiere verse hablándole a un público.
- Credenciales: Director Ejecutivo de CACE y fundador de dos empresas. Hot Sale y CyberMonday quedan como mención breve.
- Séptima charla "Cómo empezar a transformar tu empresa en dos meses" y sección de diagnóstico gratuito (cinco preguntas, llegan por mail).
- SEO y GEO: título y descripción, H1 con nombre y categoría, datos estructurados, `sitemap.xml`, `robots.txt`, 404, `llms.txt` y `llms-full.txt`, FAQ visible y tabla de roles en texto.
- Publicación: primero en `nuevo.diegourfeig.com` (sin indexar) y, con el OK de Diego, en producción. Antes se guardó el sitio anterior en el tag `respaldo-sitio-en-vivo-2026-11-21`. `diegourfeig.com` sin www pasó a redirigir a www.
- Medición: eventos al `dataLayer` y `data-track` en los botones principales, para GA4 y para tests.
- Movimiento reducido: Diego vio el sitio quieto en el teléfono (Chrome y Safari). La causa probable es que tiene activado "Reducir movimiento" (no lo confirmó). Ahora el contenido sigue moviéndose y el video tiene botón de pausa. Diego confirmó que ya se mueve.
- Contenido: las preguntas frecuentes arrancan por el eje cultural. Se sumó la sección de dolores (siete, cada uno abre su charla). Después de que Diego pidiera dolores y charlas más generales, se reescribieron las siete charlas a partir de una investigación (McKinsey y BCG 2025-2026). Diego aprobó y se pasó a producción.
- Logos de marcas rehechos, más grandes. La cinta de frases ya no usa letras en contorno, que en móvil se veían vacías.
- Se abrió el PR #1 a `main` con los 11 commits del rediseño. No se mergeó.

**Pendiente**
- Probeta: no quedó instalada. Falta el SmartCode del sitio; en el `<head>` hay un comentario que marca dónde va. Ese día `probeta.ukelele.la` no resolvía.
- Tag Manager: crear los disparadores para que GA4 registre los eventos nuevos (no hay acceso desde Claude).
- Probar el envío real de los dos formularios y el sitio en un teléfono real.
- El nombre de la segunda empresa que fundó Diego (el sitio dice "fundé dos empresas" y nombra solo Incremental).
- Decidir si quedan los cinco clientes nombrados en las preguntas frecuentes.
- Subir el tag de respaldo a GitHub, si Diego quiere.
- Propuesta sin decidir: que la sección "IA en 1 minuto" muestre sola los episodios que mejor funcionaron y el último. Opciones: A) a pedido, B) rutina semanal que lee métricas de Instagram con Apify, toma los videos del Drive, los sube a Hostinger y avisa por WhatsApp (la recomendada), C) mostrar Instagram directamente.

### Prueba de "la oficina" 3D (sesión 82398606, rama `claude/ecstatic-antonelli-e78ee1`, sin pushear)

Fork de la sesión del rediseño para explorar otra dirección, con savvia.studio y degacsid.com como referencias.
- Concepto: una habitación 3D donde cada objeto es un dolor, con tres mensajes por estación (el dolor, cómo se ve resuelto con un agente, y Diego explicándolo).
- Se probó también `estudio.html`, seis escenas con scroll y objetos realistas. Diego eligió "Volver a la oficina".
- Quedó `oficina.html` con cuatro estaciones (venta, gestión administrativa, atención al cliente, producto) y los objetos realistas de `estudio.html`. Está commiteado en la rama, sin publicar ni pushear, y Diego todavía no lo validó.
- Pendiente: que Diego valide los textos de dolor de las estaciones que propuso Claude, confirme si "precio óptimo", "dónde invertir" y "tendencias" van en Producto, y grabe videos cortos, uno por dolor, para el tercer mensaje de cada estación.
- Dato de entorno: el conector `nano-banana` falló con 404 (apunta a `gemini-2.5-flash-image-preview`, que ya no existe).
