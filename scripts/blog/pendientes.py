#!/usr/bin/env python3
"""Dice qué episodio de IA en 1 minuto toca convertir en artículo y prepara su video.

Uso:
    python3 scripts/blog/pendientes.py <reels.json> <carpeta_de_articulos> <carpeta_de_salida>

<reels.json> es la misma lista que usa scripts/episodios/actualizar.py (shortCode,
timestamp, videoPlayCount, caption con el comienzo del texto del reel).

Elige como mucho UN episodio: el reel de la serie más reciente que tenga carpeta en
Drive y todavía no tenga artículo (ni borrador). Si ya hay un borrador esperando el OK
de Diego, no elige ninguno: el blog avanza al ritmo en que Diego revisa.

Si el video del episodio no está en el sitio, lo deja listo en
<carpeta_de_salida>/assets/video/epNN.mp4 y .jpg (mismo formato que la sección
IA en 1 minuto). Imprime un JSON con lo que encontró.
"""
import datetime as dt
import json
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'episodios'))
from actualizar import DRIVE, buscar_episodio, duracion, episodios_en_drive, publicado  # noqa: E402


def articulos(carpeta):
    """Lee los metadatos de los .md (solo las claves que hacen falta acá)."""
    salida = []
    for nombre in sorted(os.listdir(carpeta)):
        if not nombre.endswith('.md') or nombre.startswith(('_', '.')):
            continue
        with open(os.path.join(carpeta, nombre), encoding='utf-8') as fh:
            m = re.match(r'---\n(.*?)\n---\n', fh.read(), re.S)
        meta = {}
        for linea in (m.group(1).splitlines() if m else []):
            if ':' in linea:
                k, v = linea.split(':', 1)
                meta[k.strip()] = re.sub(r'\s+\(.*\)$', '', v.strip())
        meta['archivo'] = nombre
        salida.append(meta)
    return salida


def main():
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    reels_path, carpeta, salida = sys.argv[1:]
    with open(reels_path, encoding='utf-8') as fh:
        reels = json.load(fh)
    existentes = articulos(carpeta)
    esperando = [a for a in existentes if a.get('estado') == 'borrador']
    con_articulo = {int(a['episodio']) for a in existentes if a.get('episodio', '').isdigit()}
    resultado = {
        'borradores_esperando': [{'archivo': a['archivo'], 'slug': a.get('slug'),
                                  'codigo': a.get('codigo') or a.get('episodio')} for a in esperando],
        'pendiente': None,
        'sin_carpeta_en_drive': [],
    }
    if not os.path.isdir(DRIVE):
        sys.exit(f'No encuentro la carpeta de episodios en Drive ({DRIVE}). ¿Está abierto Google Drive?')
    episodios = episodios_en_drive()
    candidatos = []
    for reel in reels:
        ep = buscar_episodio(reel, episodios)
        if not ep:
            resultado['sin_carpeta_en_drive'].append(reel.get('shortCode'))
            continue
        if ep['numero'] not in con_articulo:
            candidatos.append((reel, ep))
    candidatos.sort(key=lambda par: par[0].get('timestamp', ''), reverse=True)

    if candidatos and not esperando:
        reel, ep = candidatos[0]
        numero = ep['numero']
        editado = os.path.dirname(ep['video'])
        carpeta_ep = os.path.dirname(editado)
        base = f'assets/video/ep{numero:02d}'
        preparado = False
        if not (publicado(base + '.mp4') and publicado(base + '.jpg')):
            os.makedirs(os.path.join(salida, 'assets', 'video'), exist_ok=True)
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
            preparado = True
        transcripcion = os.path.join(carpeta_ep, 'trabajo', 'transcripcion.txt')
        resultado['pendiente'] = {
            'numero': numero,
            'titulo_carpeta': ep['titulo'],
            'reel': f"https://www.instagram.com/reel/{reel['shortCode']}/",
            'fecha_video': (reel.get('timestamp') or dt.date.today().isoformat())[:10],
            'reproducciones': reel.get('videoPlayCount'),
            'duracion': duracion(ep['video']),
            'video': '/' + base + '.mp4',
            'portada': '/' + base + '.jpg',
            'video_preparado_en_salida': preparado,
            'transcripcion': transcripcion if os.path.exists(transcripcion) else None,
            'textos': sorted(os.path.join(editado, f) for f in os.listdir(editado)
                             if re.fullmatch(rf'ep{numero:02d}_caption.*\.txt', f)),
            'otros_en_espera': len(candidatos) - 1,
        }
    else:
        resultado['otros_en_espera'] = len(candidatos)
    print(json.dumps(resultado, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
