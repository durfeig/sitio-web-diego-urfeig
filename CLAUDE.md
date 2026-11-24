# Reglas para trabajar en este sitio

## Antes de rehacer algo grande
- Mostrar una prueba acotada o referencias antes de rehacer el sitio entero. Dos rediseños completos (uno editorial, uno con giroscopio 3D) no eran lo que Diego buscaba; reaccionó mejor a referencias y a pruebas chicas.
- Antes de poner mensajes sacados de un sitio de referencia, consultarlos con Diego.
- Si un cambio suma una pieza que corre sola (rutina, sincronización), presentar la propuesta con opciones antes de armarla.

## Contenido
- El eje del discurso es que la transformación con IA es primero cultural: las personas de adentro cambian el mindset y proponen sus propios proyectos. Los casos concretos (devoluciones, pauta, datos) van como ejemplos, no como títulos.
- Los dolores y las charlas tienen que ser generales y le tienen que hablar a cualquier empresa, no a un área puntual.
- Mantener: los flujos de roles (persona arriba, agente abajo, casos que circulan), la frase "agentes que ejecutan, personas que deciden", la banda de las 100 empresas y la lista de charlas.
- No poner foco en Hot Sale ni CyberMonday. Destacar que fue Director Ejecutivo de CACE (hoy dirige su Comisión de Data) y que fundó dos empresas.
- No usar el átomo ni el giroscopio 3D, y evitar el look editorial sobrio. Diego prefiere color y movimiento.
- No escribir como hecho lo que Diego no confirmó (por ejemplo, el nombre de la segunda empresa).

## Video
- El video del hero tiene que mostrar a Diego hablándole a un público, no mirando a cámara.
- No bajar videos de terceros con scrapers: usar el reproductor oficial o el archivo que el dueño le pase a Diego.
- Al recortar, dejar afuera logos del evento y subtítulos quemados.

## Movimiento
- Probar siempre en móvil con y sin "Reducir movimiento" (Playwright: `browser_emulate_media` con `reducedMotion: reduce`).
- Con movimiento reducido siguen andando el video, los flujos de roles, la frase que rota y los puntos del fondo. Solo se apagan los deslizamientos, las cintas, la flotación y el fondo que se desplaza con el scroll.
- Mantener el botón de pausa del video.

## Publicación
- Primero al subdominio de prueba (`nuevo.diegourfeig.com`), después a producción con el OK de Diego.
- Si cambia el CSS o el JS, subir el `?v=` en `index.html`.
- Subir `index.html` al final.
- No usar el deploy por archivo comprimido de Hostinger sobre `diegourfeig.com`: pisa todo el contenido.
- No tocar `main` directo: los cambios van por rama y PR.
- Para pushear o abrir PRs, usar la cuenta `durfeig` pasando su token solo a ese comando. No cambiar la cuenta activa de `gh`.

## Blog
- El blog es para que los asistentes de IA citen el sitio, no para publicar volumen. Nada de artículos diarios generados de cero: Google penaliza el contenido masivo sin valor propio.
- Cada artículo se arma con material de Diego: el dato con su fuente enlazada, una cita textual suya copiada exacta de sus captions o del video, preguntas frecuentes y, si es de un episodio, el video. Nunca inventar ni redondear datos o citas.
- Usar fuentes del último año y escribir el año en el texto. Si no hay nada más nuevo, dejar el dato con su año. Sacar los pronósticos cuyo plazo ya venció.
- No tocar las frases textuales de Diego al actualizar datos, salvo que dependan de un número viejo.
- Lo que está en "Para confirmar" en la ficha de un episodio no entra al artículo, ni reescrito.
- Nada interno de Ukelele en el blog: arquitecturas de agentes de clientes, notas internas, planes ni herramientas internas.
- Todo va primero a `nuevo.diegourfeig.com` y pasa a producción solo con el OK de Diego.
- No subir a producción el `llms-full.txt` del repo tal cual: no tiene la sección Blog. Reconstruirlo con `construir.py`, o tomar el que está en vivo y cambiar solo lo necesario.
- Antes de subir, comprobar que lo que está en producción coincide con el punto de partida de la rama, para no pisar lo que subió otra sesión.

## Medición
- Cada interacción nueva tiene que mandar su evento al `dataLayer` y, si es un botón principal, llevar un `data-track` fijo.
