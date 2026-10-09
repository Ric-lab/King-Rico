#!/usr/bin/env python3
"""Meshy image-to-image: uma imagem de referência + prompt -> imagens geradas.

Roda no GitHub Actions (workflow "Gerar imagem no Meshy"), com a chave no segredo MESHY_API_KEY.
Uma tarefa por execução, para controlar os créditos (CLAUDE.md: um objeto por vez).

Uso: MESHY_API_KEY=... python3 meshy_image.py <entrada.png> <pasta-saida> "<prompt>" [modelo] [aspect_ratio]
Grava em <pasta-saida>: result-N.png, task.json (resposta final) e log.json (saldo antes/depois, tempos).
"""
import base64, json, os, sys, time, urllib.error, urllib.request

API = os.environ.get('MESHY_API_BASE', 'https://api.meshy.ai/openapi/v1')  # base trocável só para teste local
KEY = os.environ.get('MESHY_API_KEY', '').strip()


def call(method, path, body=None):
    req = urllib.request.Request(API + path, method=method,
                                 data=json.dumps(body).encode() if body is not None else None,
                                 headers={'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, json.loads(r.read() or b'{}')
    except urllib.error.HTTPError as e:
        raw = e.read().decode(errors='replace')
        try:
            return e.code, json.loads(raw)
        except ValueError:
            return e.code, {'raw': raw}


def main():
    if not KEY:
        sys.exit('MESHY_API_KEY ausente: cadastre o segredo do repositório (Settings → Secrets and variables → Actions).')
    src, out, prompt = sys.argv[1], sys.argv[2], sys.argv[3]
    model = sys.argv[4] if len(sys.argv) > 4 and sys.argv[4] else 'gpt-image-2'
    aspect = sys.argv[5] if len(sys.argv) > 5 else ''
    os.makedirs(out, exist_ok=True)
    log = {'model': model, 'prompt': prompt, 'input': src}

    _, bal = call('GET', '/balance')
    log['balance_before'] = bal.get('balance', bal)
    print('saldo antes:', log['balance_before'])

    data_uri = 'data:image/png;base64,' + base64.b64encode(open(src, 'rb').read()).decode()
    body = {'ai_model': model, 'prompt': prompt, 'reference_image_urls': [data_uri]}
    if aspect:
        body['aspect_ratio'] = aspect
    code, res = call('POST', '/image-to-image', body)
    if code >= 400 and aspect:  # parâmetro opcional pode não existir: tenta de novo sem ele (não gera cobrança no erro)
        print('criação falhou com aspect_ratio, tentando sem:', code, res)
        body.pop('aspect_ratio')
        code, res = call('POST', '/image-to-image', body)
    log['create'] = {'status': code, 'response': res}
    print('criação:', code, res)
    if code >= 400:
        json.dump(log, open(os.path.join(out, 'log.json'), 'w'), indent=2)
        sys.exit(1)
    task_id = res.get('result') or res.get('id')

    t0, task = time.time(), {}
    while time.time() - t0 < 900:
        time.sleep(8)
        code, task = call('GET', f'/image-to-image/{task_id}')
        st = task.get('status')
        print(f'{int(time.time() - t0)}s', st, task.get('progress', ''))
        if st in ('SUCCEEDED', 'FAILED', 'CANCELED', 'EXPIRED'):
            break
    json.dump(task, open(os.path.join(out, 'task.json'), 'w'), indent=2)
    urls = task.get('image_urls') or []
    for i, u in enumerate(urls):
        with urllib.request.urlopen(u, timeout=120) as r:
            open(os.path.join(out, f'result-{i + 1}.png'), 'wb').write(r.read())
    log['task_status'] = task.get('status')
    log['images'] = len(urls)
    log['seconds'] = int(time.time() - t0)
    _, bal = call('GET', '/balance')
    log['balance_after'] = bal.get('balance', bal)
    print('saldo depois:', log['balance_after'], '| imagens:', len(urls))
    json.dump(log, open(os.path.join(out, 'log.json'), 'w'), indent=2)
    if task.get('status') != 'SUCCEEDED' or not urls:
        sys.exit('tarefa não concluiu: ' + str(task.get('status')) + ' ' + json.dumps(task.get('task_error', ''))[:300])


if __name__ == '__main__':
    main()
