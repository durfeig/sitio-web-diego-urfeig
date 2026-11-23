#!/usr/bin/env python3
"""Elige qué episodios de «IA en 1 minuto» muestra el sitio y prepara los archivos.

Uso:
    python3 scripts/episodios/actualizar.py <reels.json> <carpeta_de_salida>

<reels.json> es una lista de reels de Instagram de @diegourfeig (la arma la rutina
semanal con el scraper de Apify) con estos campos por reel:
    shortCode, timestamp, videoPlayCount, likesCount, commentsCount, caption
«caption» alcanza con los primeros ~80 caracteres: se usa para encontrar el episodio
en Drive. Solo cuentan los reels de la serie (los que llevan #IAen1minuto o cuyo
texto coincide con un episodio de Drive).

Qué elige: el episodio más reciente si salió hace menos de 21 días (con la marca
«Nuevo») y completa hasta tres con los de más reproducciones.

Qué deja en <carpeta_de_salida>, listo para subir al sitio:
    assets/episodios.json          la lista que lee la página
    assets/video/epNN.mp4 / .jpg   solo los episodios que todavía no están publicados
    resumen.json                   qué cambió, para el aviso por WhatsApp

No sube nada: eso lo hace subir.py. Si algo sale mal, termina con error y no deja
episodios.json, así el sitio sigue con la lista anterior.
"""
import datetime as dt
import difflib
import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata
import urllib.request

SITIO = 'https://www.diegourfeig.com'
DRIVE = os.path.expanduser(
    '~/Library/CloudStorage/GoogleDrive-elmaildediego@gmail.com/Mi unidad/IA en 1 minuto')
CANTIDAD = 3
DIAS_NUEVO = 21


def normalizar(texto):
    texto = unicodedata.normalize('NFKD', texto or '').encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9 ]+', '', texto.lower()).strip()


def episodios_en_drive():
    """Lee las carpetas epNN de Drive que tienen video final, portada y texto."""
    episodios = []
    for nombre in sorted(os.listdir(DRIVE)):
        m = re.match(r'ep(\d+)\s*·\s*(.+)', nombre)
        if not m:
            continue
        numero, titulo = int(m.group(1)), m.group(2).strip()
        editado = os.path.join(DRIVE, nombre, 'editado')
        if not os.path.isdir(editado):
            continue
        archivos = os.listdir(editado)
        finales = sorted(
            (f for f in archivos if re.fullmatch(rf'ep{numero:02d}_final(_v\d+)?\.mp4', f)),
            key=lambda f: int((re.search(r'_v(\d+)', f) or [0, '1'])[1]))
        texto = os.path.join(editado, f'ep{numero:02d}_caption.txt')
        portada = os.path.join(editado, f'ep{numero:02d}_portada.jpg')
        if not finales or not os.path.exists(texto) or not os.path.exists(portada):
            continue
        with open(texto, encoding='utf-8') as fh:
            caption = fh.read().strip()
        episodios.append({
            'numero': numero,
            'titulo': titulo,
            'caption': caption,
            'video': os.path.join(editado, finales[-1]),  # la última versión
            'portada': portada,
        })
    return episodios


def buscar_episodio(reel, episodios):
    """Encuentra el episodio de Drive que corresponde al reel comparando el comienzo del texto."""
    inicio = normalizar(reel.get('caption', ''))[:70]
    if len(inicio) < 15:
        return None
    mejor, puntaje = None, 0.0
    for ep in episodios:
        r = difflib.SequenceMatcher(None, inicio, normalizar(ep['caption'])[:70]).ratio()
        if r > puntaje:
            mejor, puntaje = ep, r
    return mejor if puntaje >= 0.85 else None


def primera_frase(texto, largo=120):
    texto = re.sub(r'#\S+', '', texto).strip()
    frase = re.split(r'(?<=[.!?…])\s', texto, maxsplit=1)[0].strip()
    frase = re.sub(r'[\U0001F300-\U0001FAFF☀-➿]', '', frase).strip()
    if len(frase) > largo:
        frase = frase[:largo].rsplit(' ', 1)[0].rstrip(',;:') + '…'
    return frase


def duracion(video):
    salida = subprocess.run(
        ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video],
        capture_output=True, text=True, check=True).stdout.strip()
    s = round(float(salida))
    return f'{s // 60}:{s % 60:02d}'


def publicado(ruta):
    """True si el archivo ya está en el sitio."""
    try:
        req = urllib.request.Request(f'{SITIO}/{ruta}', method='HEAD')
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status == 200
    except Exception:
        return False


def reproducciones_en_texto(n):
    if n >= 1_000_000:
        return f'{n / 1_000_000:.1f}'.replace('.', ',').replace(',0', '') + ' millones de reproducciones'
    if n >= 1000:
        return f'{n / 1000:.1f}'.replace('.', ',').replace(',0', '') + ' mil reproducciones'
    return ''


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    reels_path, salida = sys.argv[1], sys.argv[2]
    with open(reels_path, encoding='utf-8') as fh:
        reels = json.load(fh)
    if not isinstance(reels, list) or not reels:
        sys.exit('reels.json está vacío o no es una lista')

    episodios = episodios_en_drive()
    if not episodios:
        sys.exit(f'No encontré episodios en Drive ({DRIVE}). ¿Está abierto Google Drive?')

    candidatos = {}
    sin_episodio = []
    for reel in reels:
        ep = buscar_episodio(reel, episodios)
        es_serie = 'iaen1minuto' in normalizar(reel.get('caption', '')).replace(' ', '')
        if not ep:
            if es_serie:
                sin_episodio.append(reel.get('shortCode'))
            continue
        vistas = int(reel.get('videoPlayCount') or 0)
        previo = candidatos.get(ep['numero'])
        if previo and previo['vistas'] >= vistas:
            continue  # si el mismo episodio se publicó dos veces, vale el de más reproducciones
        candidatos[ep['numero']] = {
            **ep,
            'vistas': vistas,
            'me_gusta': int(reel.get('likesCount') or 0),
            'comentarios': int(reel.get('commentsCount') or 0),
            'fecha': dt.datetime.fromisoformat(reel['timestamp'].replace('Z', '+00:00')),
            'url': f"https://www.instagram.com/reel/{reel['shortCode']}/",
        }
    if not candidatos:
        sys.exit('Ningún reel coincide con un episodio de Drive: no cambio nada.')

    ahora = dt.datetime.now(dt.timezone.utc)
    por_fecha = sorted(candidatos.values(), key=lambda e: e['fecha'], reverse=True)
    por_vistas = sorted(candidatos.values(), key=lambda e: e['vistas'], reverse=True)
    elegidos = []
    if (ahora - por_fecha[0]['fecha']).days <= DIAS_NUEVO:
        elegidos.append(dict(por_fecha[0], nuevo=True))
    for ep in por_vistas:
        if len(elegidos) >= CANTIDAD:
            break
        if ep['numero'] not in [e['numero'] for e in elegidos]:
            elegidos.append(dict(ep, nuevo=False))

    os.makedirs(os.path.join(salida, 'assets', 'video'), exist_ok=True)
    lista, preparados = [], []
    for ep in elegidos:
        base = f"assets/video/ep{ep['numero']:02d}"
        if not (publicado(base + '.mp4') and publicado(base + '.jpg')):
            subprocess.run(
                ['ffmpeg', '-v', 'error', '-y', '-i', ep['video'], '-vf', 'scale=540:960,fps=30',
                 '-c:v', 'libx264', '-preset', 'slow', '-crf', '29', '-profile:v', 'high',
                 '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '72k', '-ac', '1',
                 '-movflags', '+faststart', os.path.join(salida, base + '.mp4')],
                check=True, stdin=subprocess.DEVNULL)
            subprocess.run(
                ['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '78', '-Z', '960',
                 ep['portada'], '--out', os.path.join(salida, base + '.jpg')],
                check=True, capture_output=True)
            preparados.append(ep['numero'])
        lista.append({
            'numero': ep['numero'],
            'titulo': ep['titulo'],
            'descripcion': primera_frase(ep['caption']),
            'duracion': duracion(ep['video']),
            'video': base + '.mp4',
            'portada': base + '.jpg',
            'url': ep['url'],
            'reproducciones': ep['vistas'],
            'reproducciones_texto': reproducciones_en_texto(ep['vistas']),
            'nuevo': ep['nuevo'],
            'publicado': ep['fecha'].date().isoformat(),
        })

    datos = {'actualizado': ahora.date().isoformat(), 'episodios': lista}
    with open(os.path.join(salida, 'assets', 'episodios.json'), 'w', encoding='utf-8') as fh:
        json.dump(datos, fh, ensure_ascii=False, indent=2)

    try:
        with urllib.request.urlopen(f'{SITIO}/assets/episodios.json', timeout=20) as r:
            antes = [e['numero'] for e in json.load(r)['episodios']]
    except Exception:
        antes = [27, 36, 38]  # la lista fija que tenía el sitio antes de la rutina
    resumen = {
        'antes': antes,
        'ahora': [e['numero'] for e in lista],
        'cambio': antes != [e['numero'] for e in lista],
        'videos_nuevos': preparados,
        'reels_de_la_serie_sin_episodio_en_drive': sin_episodio,
        'ranking': [{'numero': e['numero'], 'titulo': e['titulo'], 'reproducciones': e['vistas']}
                    for e in por_vistas],
    }
    with open(os.path.join(salida, 'resumen.json'), 'w', encoding='utf-8') as fh:
        json.dump(resumen, fh, ensure_ascii=False, indent=2)
    print(json.dumps(resumen, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    if not shutil.which('ffmpeg'):
        sys.exit('Falta ffmpeg (brew install ffmpeg)')
    main()
