#!/usr/bin/env python3
"""Arma el blog de diegourfeig.com a partir de artículos en Markdown.

Uso:
    python3 scripts/blog/construir.py <carpeta_de_articulos> <carpeta_de_salida> [--borradores]

<carpeta_de_articulos> tiene un .md por artículo, con metadatos arriba:

    ---
    titulo: La IA ya hace casi todo lo que le pedís. Todavía no sabe qué pedir
    slug: la-ia-no-sabe-que-pedir
    descripcion: Una o dos oraciones para buscadores (hasta ~155 caracteres).
    fecha: 2026-11-24
    actualizado: 2026-11-24          (opcional; si falta, es la fecha)
    estado: publicado                (o borrador)
    tipo: episodio                   (o fondo)
    episodio: 36                     (solo episodios)
    reel: https://www.instagram.com/reel/XXXX/
    fecha_video: 2026-11-13          (cuándo salió el episodio; si falta, la fecha)
    video: /assets/video/ep36.mp4
    portada: /assets/video/ep36.jpg
    duracion: 1:10
    charla: 3                        (número de la charla relacionada, para el cierre)
    ---
    (Lo que va entre paréntesis al final de una línea, separado por dos o más espacios,
    es un comentario y se ignora. Un paréntesis pegado al texto, como en un título, se respeta.)

    Primer párrafo: la respuesta directa.
    ...
    ## Fuentes
    - [Nombre de la fuente](https://...)
    ## Preguntas frecuentes
    ### ¿Pregunta?
    Respuesta.

Deja en <carpeta_de_salida>:
    blog/index.html, blog/<slug>/index.html, blog/feed.xml,
    sitemap.xml, llms.txt y llms-full.txt (los del sitio, con la sección Blog al día).

Un artículo ya publicado se corrige dejando la versión nueva en
<carpeta_de_articulos>/_revisiones/ con el mismo nombre de archivo. Con --borradores se
arma la versión revisada (con un aviso); sin --borradores sigue la publicada. Cuando
Diego la aprueba, la revisión reemplaza al archivo original.

Los borradores solo se arman con --borradores, que es para el subdominio de prueba:
ahí entran también al sitemap, al feed y a llms, para revisar cómo quedaría todo. Sin
--borradores (producción) quedan afuera de todo. Lee sitemap.xml, llms.txt y llms-full.txt base
de la raíz del repositorio.
"""
import datetime as dt
import html
import json
import os
import re
import sys
from email.utils import format_datetime

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SITIO = 'https://www.diegourfeig.com'
AUTOR_ID = SITIO + '/#diego-urfeig'
VERSION = '20261124'
E = html.escape

CHARLAS = {
    '1': 'La transformación con IA es primero cultural',
    '2': 'De pilotos a resultados: por qué la IA no llega al negocio',
    '3': 'Qué pedirle a la IA: de dar tareas a dar objetivos',
    '4': 'Cómo rediseñar un puesto cuando una parte la hace un agente',
    '5': 'Liderar con IA: qué tiene que hacer un líder para que su equipo la adopte',
    '6': 'Confiar en la IA sin revisar todo: calidad, controles y seguridad',
    '7': 'Cómo empezar a transformar tu empresa en dos meses',
}
MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
         'septiembre', 'octubre', 'noviembre', 'diciembre']


# ------------------------------------------------------------------ lectura
def leer_articulo(ruta):
    with open(ruta, encoding='utf-8') as fh:
        texto = fh.read()
    m = re.match(r'---\n(.*?)\n---\n(.*)', texto, re.S)
    if not m:
        raise ValueError(f'{ruta}: falta el bloque de metadatos entre ---')
    meta = {}
    for linea in m.group(1).splitlines():
        if ':' in linea and not linea.startswith('#'):
            k, v = linea.split(':', 1)
            meta[k.strip()] = re.sub(r'\s{2,}\(.*\)$', '', v.strip())
    for clave in ('titulo', 'slug', 'descripcion', 'fecha', 'estado', 'tipo'):
        if not meta.get(clave):
            raise ValueError(f'{ruta}: falta «{clave}»')
    if not re.fullmatch(r'[a-z0-9-]+', meta['slug']):
        raise ValueError(f'{ruta}: el slug solo puede tener minúsculas, números y guiones')
    meta.setdefault('actualizado', meta['fecha'])
    cuerpo = m.group(2).strip()
    # separar secciones especiales
    partes = re.split(r'^## (Fuentes|Preguntas frecuentes)\s*$', cuerpo, flags=re.M)
    principal, fuentes, preguntas = partes[0].strip(), '', []
    for i in range(1, len(partes), 2):
        if partes[i] == 'Fuentes':
            fuentes = partes[i + 1].strip()
        else:
            for q in re.split(r'^### ', partes[i + 1].strip(), flags=re.M):
                q = q.strip()
                if q:
                    pregunta, _, respuesta = q.partition('\n')
                    preguntas.append((pregunta.strip(), respuesta.strip()))
    meta['principal'], meta['fuentes'], meta['preguntas'] = principal, fuentes, preguntas
    meta['archivo'] = os.path.basename(ruta)
    return meta


# ------------------------------------------------------------------ Markdown mínimo
def en_linea(t):
    t = E(t, quote=False)
    t = re.sub(r'\[([^\]]+)\]\((https?://[^)\s]+|/[^)\s]*)\)',
               lambda m: f'<a href="{m.group(2)}"' + (
                   ' target="_blank" rel="noopener"' if m.group(2).startswith('http') else '')
               + f'>{m.group(1)}</a>', t)
    t = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)
    t = re.sub(r'(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)', r'<em>\1</em>', t)
    return t


def markdown(texto):
    salida, bloque, tipo = [], [], None

    def cerrar():
        nonlocal bloque, tipo
        if not bloque:
            return
        if tipo == 'p':
            salida.append('<p>' + en_linea(' '.join(bloque)) + '</p>')
        elif tipo in ('ul', 'ol'):
            items = ''.join(f'<li>{en_linea(i)}</li>' for i in bloque)
            salida.append(f'<{tipo}>{items}</{tipo}>')
        elif tipo == 'quote':
            lineas = [l for l in bloque]
            autor = ''
            if lineas and lineas[-1].startswith('—'):
                autor = f'<cite>{en_linea(lineas.pop().lstrip("— ").strip())}</cite>'
            salida.append('<blockquote class="post-quote"><p>' + en_linea(' '.join(lineas))
                          + '</p>' + autor + '</blockquote>')
        bloque, tipo = [], None

    for linea in texto.splitlines():
        l = linea.rstrip()
        if not l.strip():
            cerrar()
            continue
        if l.startswith('### '):
            cerrar(); salida.append(f'<h3>{en_linea(l[4:])}</h3>'); continue
        if l.startswith('## '):
            cerrar(); salida.append(f'<h2>{en_linea(l[3:])}</h2>'); continue
        if l.startswith('> '):
            if tipo != 'quote':
                cerrar(); tipo = 'quote'
            bloque.append(l[2:]); continue
        m = re.match(r'^(\d+)\. (.*)', l)
        if l.startswith('- ') or m:
            t = 'ol' if m else 'ul'
            if tipo != t:
                cerrar(); tipo = t
            bloque.append(m.group(2) if m else l[2:]); continue
        if tipo != 'p':
            cerrar(); tipo = 'p'
        bloque.append(l.strip())
    cerrar()
    return '\n'.join(salida)


def texto_plano(md):
    t = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', md)
    t = re.sub(r'[*#>]', '', t)
    return re.sub(r'\s+', ' ', t).strip()


def fecha_larga(iso):
    d = dt.date.fromisoformat(iso)
    return f'{d.day} de {MESES[d.month - 1]} de {d.year}'


# ------------------------------------------------------------------ plantillas
def cabeza(titulo, descripcion, canonical, og_tipo, imagen, extra_ld, borrador):
    robots = 'noindex, nofollow' if borrador else 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    return f'''<!DOCTYPE html>
<html lang="es">

<head>
  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){{w[l]=w[l]||[];w[l].push({{'gtm.start':
  new Date().getTime(),event:'gtm.js'}});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  }})(window,document,'script','dataLayer','GTM-NV3FT6SL');</script>
  <!-- End Google Tag Manager -->
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script>document.documentElement.classList.add('js');</script>
  <title>{E(titulo)}</title>
  <meta name="description" content="{E(descripcion)}">
  <meta name="author" content="Diego Urfeig">
  <meta name="robots" content="{robots}">
  <meta name="theme-color" content="#06070B">
  <link rel="canonical" href="{canonical}">
  <link rel="alternate" type="application/rss+xml" title="Blog de Diego Urfeig" href="/blog/feed.xml">
  <link rel="alternate" type="text/plain" href="/llms.txt" title="Resumen del sitio para modelos de lenguaje">
  <meta property="og:type" content="{og_tipo}">
  <meta property="og:url" content="{canonical}">
  <meta property="og:title" content="{E(titulo)}">
  <meta property="og:description" content="{E(descripcion)}">
  <meta property="og:image" content="{imagen}">
  <meta property="og:locale" content="es_AR">
  <meta property="og:site_name" content="Diego Urfeig">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{E(titulo)}">
  <meta name="twitter:description" content="{E(descripcion)}">
  <meta name="twitter:image" content="{imagen}">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link
    href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,400..800&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap"
    rel="stylesheet">
  <link rel="stylesheet" href="/css/styles.css?v={VERSION}">
  <script type="application/ld+json">
{json.dumps(extra_ld, ensure_ascii=False, indent=2)}
  </script>
</head>

<body class="page-blog">
  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NV3FT6SL"
  height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
  <a class="skip-link" href="#main">Saltar al contenido</a>
'''


MENU = '''  <header class="header scrolled" id="header">
    <div class="container header-inner">
      <a href="/" class="logo" aria-label="Diego Urfeig, inicio">
        <span class="logo-mark" aria-hidden="true"><i></i><i></i></span>
        <span class="logo-text">Diego Urfeig</span>
      </a>

      <nav class="nav-menu" id="navMenu" aria-label="Navegación principal">
        <ul class="nav-list">
          <li><a href="/#dolores" class="nav-link">Dolores</a></li>
          <li><a href="/#charlas" class="nav-link">Charlas</a></li>
          <li><a href="/#servicios" class="nav-link">Formatos</a></li>
          <li><a href="/#contenido" class="nav-link">IA en 1 minuto</a></li>
          <li><a href="/blog/" class="nav-link{activo}">Blog</a></li>
          <li><a href="/#sobre-diego" class="nav-link">Sobre Diego</a></li>
        </ul>
        <a href="/#contacto" class="btn btn-primary nav-cta" data-track="menu-reservar"><span>Reservar una charla</span></a>
      </nav>

      <div class="header-actions">
        <a href="/#contacto" class="btn btn-primary btn-sm header-cta" data-track="header-reservar"><span>Reservar una charla</span></a>
        <button class="menu-btn" id="mobileMenuBtn" aria-label="Abrir menú" aria-expanded="false"
          aria-controls="navMenu">
          <span></span><span></span>
        </button>
      </div>
    </div>
    <div class="progress" aria-hidden="true"><i id="progressBar"></i></div>
  </header>
'''

PIE = f'''  <footer class="footer">
    <div class="container footer-inner">
      <div class="footer-brand">
        <a href="/" class="logo" aria-label="Diego Urfeig, inicio">
          <span class="logo-mark" aria-hidden="true"><i></i><i></i></span>
          <span class="logo-text">Diego Urfeig</span>
        </a>
        <p>Speaker de inteligencia artificial, agentes y datos.</p>
      </div>
      <nav class="footer-links" aria-label="Secciones">
        <a href="/#dolores">¿Qué te pasa hoy?</a>
        <a href="/#charlas">Charlas</a>
        <a href="/#servicios">Formatos</a>
        <a href="/#contenido">IA en 1 minuto</a>
        <a href="/blog/">Blog</a>
        <a href="/#sobre-diego">Sobre Diego</a>
        <a href="/#diagnostico">Diagnóstico gratuito</a>
        <a href="/#contacto">Contacto</a>
      </nav>
      <nav class="footer-links" aria-label="Redes sociales">
        <a href="https://www.instagram.com/diegourfeig/" target="_blank" rel="noopener noreferrer">Instagram</a>
        <a href="https://www.linkedin.com/in/diegourfeig/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        <a href="https://www.tiktok.com/@durfeig" target="_blank" rel="noopener noreferrer">TikTok</a>
        <a href="/blog/feed.xml">RSS del blog</a>
      </nav>
      <p class="footer-copy">&copy; <span id="year">2026</span> Diego Urfeig. Todos los derechos reservados.</p>
    </div>
  </footer>

  <script src="/js/main.js?v={VERSION}" defer></script>
  <a href="https://wa.me/541133589585" class="whatsapp-fab" data-track="whatsapp-flotante" target="_blank" rel="noopener noreferrer" aria-label="Contactar por WhatsApp">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
  </a>
</body>

</html>
'''


def pagina_articulo(a, otros, borrador):
    url = f'{SITIO}/blog/{a["slug"]}/'
    imagen = SITIO + (a.get('portada') or '/assets/og-image.jpg')
    preguntas = a['preguntas']
    grafo = [{
        '@type': 'BlogPosting',
        '@id': url + '#articulo',
        'headline': a['titulo'],
        'description': a['descripcion'],
        'url': url,
        'mainEntityOfPage': url,
        'datePublished': a['fecha'],
        'dateModified': a['actualizado'],
        'inLanguage': 'es-AR',
        'image': imagen,
        'author': {'@type': 'Person', '@id': AUTOR_ID, 'name': 'Diego Urfeig', 'url': SITIO + '/'},
        'publisher': {'@type': 'Person', '@id': AUTOR_ID, 'name': 'Diego Urfeig'},
        'isPartOf': {'@type': 'Blog', '@id': SITIO + '/blog/#blog', 'name': 'Blog de Diego Urfeig'},
        'articleBody': texto_plano(a['principal']),
    }]
    if a.get('video'):
        grafo[0]['video'] = {'@id': url + '#video'}
        grafo.append({
            '@type': 'VideoObject',
            '@id': url + '#video',
            'name': f'IA en 1 minuto #{a.get("episodio", "")}: {a["titulo"]}',
            'description': a['descripcion'],
            'thumbnailUrl': imagen,
            'contentUrl': SITIO + a['video'],
            'uploadDate': a.get('fecha_video') or a['fecha'],
            'duration': duracion_iso(a.get('duracion', '')),
            'inLanguage': 'es-AR',
            'author': {'@id': AUTOR_ID},
        })
        if a.get('reel'):
            grafo[-1]['sameAs'] = a['reel']
    if preguntas:
        grafo.append({
            '@type': 'FAQPage',
            '@id': url + '#preguntas',
            'mainEntity': [{'@type': 'Question', 'name': q,
                            'acceptedAnswer': {'@type': 'Answer', 'text': texto_plano(r)}}
                           for q, r in preguntas],
        })
    grafo.append({
        '@type': 'BreadcrumbList',
        'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Inicio', 'item': SITIO + '/'},
            {'@type': 'ListItem', 'position': 2, 'name': 'Blog', 'item': SITIO + '/blog/'},
            {'@type': 'ListItem', 'position': 3, 'name': a['titulo'], 'item': url},
        ],
    })
    ld = {'@context': 'https://schema.org', '@graph': grafo}

    etiqueta = f'IA en 1 minuto · Episodio {int(a["episodio"]):02d}' if a['tipo'] == 'episodio' else 'Artículo de fondo'
    video = ''
    if a.get('video'):
        video = f'''
        <figure class="post-video">
          <div class="ep-frame">
            <video preload="none" playsinline controls poster="{E(a.get("portada", ""))}" src="{E(a["video"])}"></video>
          </div>
          <figcaption>Episodio {int(a["episodio"]):02d} de IA en 1 minuto · {E(a.get("duracion", ""))}{f' · <a href="{E(a["reel"])}" target="_blank" rel="noopener">Ver en Instagram</a>' if a.get("reel") else ''}</figcaption>
        </figure>'''
    fuentes = ''
    if a['fuentes']:
        fuentes = f'''
        <section class="post-sources" aria-labelledby="fuentes">
          <h2 id="fuentes">Fuentes</h2>
          {markdown(a["fuentes"])}
        </section>'''
    faq = ''
    if preguntas:
        items = ''.join(f'''
            <details class="faq-item"{' open' if i == 0 else ''}>
              <summary><h3>{E(q)}</h3><span class="faq-plus" aria-hidden="true"></span></summary>
              <p>{en_linea(r)}</p>
            </details>''' for i, (q, r) in enumerate(preguntas))
        faq = f'''
        <section class="post-faq" aria-labelledby="preguntas">
          <h2 id="preguntas">Preguntas frecuentes</h2>
          <div class="faq">{items}
          </div>
        </section>'''
    charla = CHARLAS.get(str(a.get('charla', '')), '')
    cierre = f'''
        <aside class="post-cta">
          <p class="post-cta-kicker">¿Querés llevar esto a tu equipo?</p>
          <p class="post-cta-title">{E(charla) if charla else 'Charlas y workshops sobre IA para empresas'}</p>
          <p>Es uno de los temas que trabajo en charlas y workshops con equipos de empresas de toda Latinoamérica.</p>
          <div class="post-cta-actions">
            <a href="/#charlas" class="btn btn-primary" data-track="blog-charlas"><span>Ver las charlas</span></a>
            <a href="/#diagnostico" class="btn btn-ghost" data-track="blog-diagnostico">Pedir el diagnóstico gratuito</a>
          </div>
        </aside>'''
    relacionados = ''
    if otros:
        tarjetas = ''.join(tarjeta(o) for o in otros[:3])
        relacionados = f'''
    <section class="section section--tight post-related" aria-labelledby="mas">
      <div class="container">
        <h2 id="mas" class="post-related-title">Seguí leyendo</h2>
        <div class="post-list">{tarjetas}
        </div>
      </div>
    </section>'''
    aviso = ''
    if a['estado'] == 'borrador':
        aviso = '\n        <p class="post-draft">Borrador para revisar: todavía no está publicado.</p>'
    elif a.get('revision'):
        aviso = '\n        <p class="post-draft">Versión revisada para aprobar: en el sitio sigue la anterior.</p>'
    return (cabeza(f'{a["titulo"]} | Diego Urfeig', a['descripcion'], url, 'article', imagen, ld, borrador)
            + MENU.format(activo=' active') + f'''
  <main id="main">
    <article class="post">
      <div class="container post-container">
        <nav class="post-crumbs" aria-label="Ruta"><a href="/">Inicio</a> <span aria-hidden="true">/</span> <a href="/blog/">Blog</a></nav>{aviso}
        <p class="post-kicker">{E(etiqueta)}</p>
        <h1 class="post-title">{E(a["titulo"])}</h1>
        <p class="post-meta">Por <a href="/#sobre-diego">Diego Urfeig</a> · <time datetime="{a["fecha"]}">{fecha_larga(a["fecha"])}</time>{f' · Actualizado el <time datetime="{a["actualizado"]}">{fecha_larga(a["actualizado"])}</time>' if a["actualizado"] != a["fecha"] else ''}</p>
        <div class="post-layout{' post-layout--video' if video else ''}">{video}
          <div class="post-body">
{markdown(a["principal"])}
          </div>
        </div>{fuentes}{faq}{cierre}
      </div>
    </article>{relacionados}
  </main>

''' + PIE)


def duracion_iso(m):
    if not re.fullmatch(r'\d+:\d\d', m or ''):
        return None
    mm, ss = m.split(':')
    return f'PT{int(mm)}M{int(ss)}S'


def tarjeta(a):
    etiqueta = f'Episodio {int(a["episodio"]):02d}' if a['tipo'] == 'episodio' else 'Artículo de fondo'
    return f'''
          <article class="post-card">
            <p class="post-card-meta">{E(etiqueta)} · <time datetime="{a["fecha"]}">{fecha_larga(a["fecha"])}</time></p>
            <h3><a href="/blog/{a["slug"]}/">{E(a["titulo"])}</a></h3>
            <p>{E(a["descripcion"])}</p>
          </article>'''


def pagina_indice(articulos):
    url = SITIO + '/blog/'
    ld = {'@context': 'https://schema.org', '@graph': [{
        '@type': 'Blog',
        '@id': SITIO + '/blog/#blog',
        'name': 'Blog de Diego Urfeig',
        'description': 'Artículos sobre inteligencia artificial, agentes y datos en las empresas, con el dato y la fuente.',
        'url': url,
        'inLanguage': 'es-AR',
        'author': {'@type': 'Person', '@id': AUTOR_ID, 'name': 'Diego Urfeig'},
        'blogPost': [{'@type': 'BlogPosting', 'headline': a['titulo'], 'url': f'{SITIO}/blog/{a["slug"]}/',
                      'datePublished': a['fecha']} for a in articulos if a['estado'] == 'publicado'],
    }]}
    tarjetas = ''.join(tarjeta(a) for a in articulos) or '\n          <p>Pronto, los primeros artículos.</p>'
    return (cabeza('Blog de Diego Urfeig | IA, agentes y datos en las empresas',
                   'Artículos de Diego Urfeig sobre cómo las empresas adoptan la inteligencia artificial: agentes, datos, cultura y liderazgo, con el dato y la fuente.',
                   url, 'website', SITIO + '/assets/og-image.jpg', ld, False)
            + MENU.format(activo=' active') + f'''
  <main id="main">
    <section class="section blog-hero">
      <div class="container">
        <header class="sec-head">
          <div class="sec-rule"><span>Blog</span><i></i><span>IA en las empresas</span></div>
          <h1 class="blog-title">Lo que aprendo sobre IA, <em>con el dato y la fuente.</em></h1>
          <p>Cada episodio de IA en 1 minuto, desarrollado con más contexto, y artículos de fondo sobre
            los temas de mis charlas: cultura, agentes, liderazgo y cómo pasar de pilotos a resultados.</p>
        </header>
        <div class="post-list">{tarjetas}
        </div>
      </div>
    </section>
  </main>

''' + PIE)


# ------------------------------------------------------------------ feed, sitemap, llms
def feed(articulos):
    items = ''
    for a in articulos[:20]:
        fecha = dt.datetime.fromisoformat(a['fecha'] + 'T12:00:00+00:00')
        items += f'''
    <item>
      <title>{E(a["titulo"])}</title>
      <link>{SITIO}/blog/{a["slug"]}/</link>
      <guid isPermaLink="true">{SITIO}/blog/{a["slug"]}/</guid>
      <pubDate>{format_datetime(fecha)}</pubDate>
      <description>{E(a["descripcion"])}</description>
    </item>'''
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Blog de Diego Urfeig</title>
    <link>{SITIO}/blog/</link>
    <atom:link href="{SITIO}/blog/feed.xml" rel="self" type="application/rss+xml"/>
    <description>Inteligencia artificial, agentes y datos en las empresas, con el dato y la fuente.</description>
    <language>es-AR</language>{items}
  </channel>
</rss>
'''


def sitemap(articulos, hoy):
    urls = [(SITIO + '/', hoy), (SITIO + '/blog/', articulos[0]['actualizado'] if articulos else hoy)]
    urls += [(f'{SITIO}/blog/{a["slug"]}/', a['actualizado']) for a in articulos]
    cuerpo = ''.join(f'''
  <url>
    <loc>{u}</loc>
    <lastmod>{m}</lastmod>{"""
    <image:image><image:loc>https://www.diegourfeig.com/assets/img/diego-urfeig.jpg</image:loc></image:image>
    <image:image><image:loc>https://www.diegourfeig.com/assets/og-image.jpg</image:loc></image:image>""" if u == SITIO + '/' else ''}
  </url>''' for u, m in urls)
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">{cuerpo}
</urlset>
'''


def con_seccion_blog(texto, seccion):
    """Reemplaza (o agrega antes de «## Contacto» / al final) la sección ## Blog."""
    texto = re.sub(r'\n## Blog\n.*?(?=\n## |\Z)', '', texto, flags=re.S).rstrip() + '\n'
    if not seccion:
        return texto
    for ancla in ('\n## Contacto', '\n## Más detalle', '\n## Cómo citar'):
        if ancla in texto:
            i = texto.index(ancla)
            return texto[:i] + '\n' + seccion.rstrip() + '\n' + texto[i:]
    return texto + '\n' + seccion


def llms(articulos):
    if not articulos:
        return '', ''
    corto = '## Blog\n\nArtículos sobre IA, agentes y datos en las empresas, con el dato y la fuente. Índice: https://www.diegourfeig.com/blog/\n\n' + ''.join(
        f'- [{a["titulo"]}]({SITIO}/blog/{a["slug"]}/): {a["descripcion"]}\n' for a in articulos)
    largo = '## Blog\n\nArtículos de Diego Urfeig. Cada uno cita sus fuentes en la página.\n\n' + ''.join(
        f'### {a["titulo"]}\n\n{SITIO}/blog/{a["slug"]}/ · {fecha_larga(a["fecha"])}\n\n{texto_plano(a["principal"].split(chr(10) + chr(10))[0])}\n\n'
        for a in articulos)
    return corto, largo


# ------------------------------------------------------------------ main
def escribir(ruta, contenido):
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    with open(ruta, 'w', encoding='utf-8') as fh:
        fh.write(contenido)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    borradores = '--borradores' in sys.argv
    if len(args) != 2:
        sys.exit(__doc__)
    origen, salida = args
    todos = []
    revisiones = os.path.join(origen, '_revisiones')
    for nombre in sorted(os.listdir(origen)):
        if nombre.endswith('.md') and not nombre.startswith(('_', '.')):
            revision = os.path.join(revisiones, nombre)
            if borradores and os.path.exists(revision):
                # en prueba se ve la versión revisada; en el titular sigue la publicada
                articulo = leer_articulo(revision)
                articulo['revision'] = True
            else:
                articulo = leer_articulo(os.path.join(origen, nombre))
            todos.append(articulo)
    slugs = [a['slug'] for a in todos]
    if len(slugs) != len(set(slugs)):
        sys.exit('Hay dos artículos con el mismo slug.')
    for a in todos:
        if a['estado'] not in ('publicado', 'borrador'):
            sys.exit(f'{a["archivo"]}: «estado» tiene que ser publicado o borrador')
    # más nuevos primero; con la misma fecha, los de fondo y después el episodio más reciente
    visibles = sorted([a for a in todos if borradores or a['estado'] == 'publicado'],
                      key=lambda a: (a['fecha'], a.get('fecha_video') or '9999'), reverse=True)
    # en prueba, los borradores también van al feed, al sitemap y a llms
    publicados = visibles if borradores else [a for a in visibles if a['estado'] == 'publicado']
    hoy = dt.date.today().isoformat()

    for a in visibles:
        otros = [o for o in publicados if o['slug'] != a['slug']]
        escribir(os.path.join(salida, 'blog', a['slug'], 'index.html'),
                 pagina_articulo(a, otros, a['estado'] == 'borrador'))
    escribir(os.path.join(salida, 'blog', 'index.html'), pagina_indice(visibles))
    escribir(os.path.join(salida, 'blog', 'feed.xml'), feed(publicados))
    escribir(os.path.join(salida, 'sitemap.xml'), sitemap(publicados, hoy))
    corto, largo = llms(publicados)
    for nombre, seccion in (('llms.txt', corto), ('llms-full.txt', largo)):
        with open(os.path.join(RAIZ, nombre), encoding='utf-8') as fh:
            escribir(os.path.join(salida, nombre), con_seccion_blog(fh.read(), seccion))
    print(json.dumps({
        'publicados': [a['slug'] for a in todos if a['estado'] == 'publicado'],
        'borradores': [a['slug'] for a in todos if a['estado'] == 'borrador'],
        'armados': [a['slug'] for a in visibles],
    }, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
