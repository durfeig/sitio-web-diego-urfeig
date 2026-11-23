#!/usr/bin/env python3
"""Sube a Hostinger lo que preparó actualizar.py.

Uso:
    python3 scripts/episodios/subir.py <carpeta_de_salida> <credenciales.json> [prefijo]

<credenciales.json> es la respuesta de la operación hosting_files_generate-upload-url
del conector de Hostinger: {"url": ..., "auth_key": ..., "rest_auth_key": ...}.
Vencen solas a las pocas horas; igual conviene borrar el archivo al terminar.

[prefijo] es la carpeta dentro de public_html: vacío para el sitio titular,
«nuevo/» para el subdominio de prueba.

Sube primero los videos y portadas, y al final assets/episodios.json, para que la
página nunca apunte a un video que todavía no está.
"""
import json
import os
import sys
import urllib.parse
import urllib.request


def subir(cred, local, destino):
    tamano = os.path.getsize(local)
    url = cred['url'].rstrip('/') + '/' + urllib.parse.quote(destino) + '?override=true'
    base = {'X-Auth': cred['auth_key'], 'X-Auth-Rest': cred['rest_auth_key'],
            'Tus-Resumable': '1.0.0'}
    crear = urllib.request.Request(url, method='POST', headers={
        **base, 'Upload-Length': str(tamano), 'Upload-Offset': '0'})
    with urllib.request.urlopen(crear, timeout=60) as r:
        if r.status not in (200, 201):
            raise RuntimeError(f'{destino}: no se pudo crear la subida ({r.status})')
    with open(local, 'rb') as fh:
        datos = fh.read()
    enviar = urllib.request.Request(url, data=datos, method='PATCH', headers={
        **base, 'Content-Type': 'application/offset+octet-stream', 'Upload-Offset': '0'})
    with urllib.request.urlopen(enviar, timeout=300) as r:
        if r.status not in (200, 204):
            raise RuntimeError(f'{destino}: falló la subida ({r.status})')
    print(f'subido {destino} ({tamano} bytes)')


def main():
    if len(sys.argv) not in (3, 4):
        sys.exit(__doc__)
    carpeta, cred_path = sys.argv[1], sys.argv[2]
    prefijo = sys.argv[3] if len(sys.argv) == 4 else ''
    with open(cred_path, encoding='utf-8') as fh:
        cred = json.load(fh)
    lista = os.path.join(carpeta, 'assets', 'episodios.json')
    if not os.path.exists(lista):
        sys.exit('No hay assets/episodios.json: actualizar.py no terminó bien, no subo nada.')
    videos = os.path.join(carpeta, 'assets', 'video')
    for nombre in sorted(os.listdir(videos)) if os.path.isdir(videos) else []:
        subir(cred, os.path.join(videos, nombre), f'{prefijo}assets/video/{nombre}')
    subir(cred, lista, f'{prefijo}assets/episodios.json')


if __name__ == '__main__':
    main()
