# Notas

## 2026-11-23

### IA en 1 minuto se actualiza sola cada semana (sesión c322f3e8, rama `claude/speaker-website-design-00e595`)

- Diego eligió la opción B: una rutina semanal. Corre los lunes a las 9, elige el último episodio si tiene menos de 21 días y completa hasta tres con los más vistos en Instagram.
- Primera corrida con datos reales: el sitio pasó de mostrar el 27, el 36 y el 38 a mostrar el **#37 (Nuevo), el #26 (8,3 mil reproducciones) y el #04 (4 mil)**. Está en producción (`3d39760`).
- Solo entran los reels de la serie (#IAen1minuto) que tienen carpeta en Drive. El reel más visto de Diego, el del CAPTCHA con 2,6 millones, no es de la serie y no aparece.

### Blog para que los asistentes de IA citen el sitio (sesión 02058f15, rama `claude/keen-feynman-daa3da`, PR #3)

**Qué se decidió y por qué**
- Sí al blog, pero alimentado con el material de Diego y no con volumen. Se apoyó en el estudio GEO (KDD 2024): las citas textuales suben la visibilidad en respuestas de IA, y meter palabras clave la baja. También en que la frescura pesa.
- No a la publicación diaria, por la política de Google contra el contenido masivo sin valor propio. El ritmo es el de los episodios: 2 o 3 por semana.
- La publicación es automática, pero con un toque de Diego: cada borrador va al subdominio de prueba y pasa a producción con su OK por WhatsApp.
- Se priorizaron los artículos de fondo, uno por charla, por sobre subir todos los episodios. Subir todo de golpe se descartó: eran unos 20 artículos para revisar y una tanda grande escrita con IA es lo que Google mira con lupa.

**Qué se hizo**
- `construir.py` y `pendientes.py`, el link «Blog» en el menú y el pie, y los estilos del blog, incluidas las tablas como tarjetas en el celular.
- 7 artículos en producción:
  - de fondo: «La transformación con IA es primero cultural», «Pilotos de IA a resultados» (charla 2), «Confiar en la IA sin revisar todo» (charla 6) y «Cómo evaluar agentes de IA»;
  - de episodios: #36, #26 y #04.
- El de evaluación sale del artifact «Loops de Automejora», sin la parte interna de Ukelele. Como el artifact no cita fuentes, se buscaron fuentes nuevas para cada concepto.
- **Revisión de fuentes desactualizadas:** Diego vio citas viejas. En los tres artículos de fondo se pasó a McKinsey State of AI 2026, BCG 2026 y Microsoft 2026. Se sacó el pronóstico de Gartner 2024, porque su plazo ya venció. El MIT 2025, Gartner 2025 y Kotter quedaron, con el año escrito en el texto. Los episodios ya tenían fuentes de septiembre a noviembre de 2026.
- La rutina del blog lee la ficha `editado/epNN_blog.md` que ahora deja la edición de cada episodio (ver `durfeig/ia-en-1-minuto`, PR #4). El ep38 es el primero que tiene ficha.
- Se sumó la regla de que un OK cuenta solo si llegó después de la última edición del borrador, porque un «Ok blog todos» viejo podía publicar borradores nuevos.

**Pendiente**
- Los artículos de fondo de las charlas 3, 4, 5 y 7. La 3 se dejó para después del artículo del ep38, que trata lo mismo.
- La primera corrida completa de la rutina del blog: el modo automático bloqueó la prueba. Va a ser la del 24/11 a las 10:30, con el ep38. Hay que leer ese borrador con cuidado.
- Mergear el #1 y el #3.

### Portada con datos de McKinsey 2026 (sesión c322f3e8, commit `abdb887` en `claude/keen-feynman-daa3da`)

- «Por qué importa», la charla 2 y la pregunta frecuente sobre resultados pasaron de McKinsey 2025 y el 95% del MIT a McKinsey 2026: de cada 100 empresas, casi 90 usan IA, 37 ven un aporte a sus resultados y 6 capturan valor de verdad. La pregunta frecuente suma BCG 2026 (7,5%).
- En pantalla dice «~90», porque el informe dice «casi 9 de cada 10» y no se pudo abrir para confirmar el número exacto.
- Primero se subió a `nuevo.` y después a producción con el OK de Diego. Para `llms-full.txt` se tomó el archivo en vivo, que tiene la sección Blog, y se cambiaron solo las líneas de datos.

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
