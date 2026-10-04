"""Build the D3 matrix and perfume details from the project's source JSON files."""
import argparse
import base64
import json
import mimetypes
import xml.etree.ElementTree as ET
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--project', type=Path, default=Path(__file__).resolve().parents[1])
parser.add_argument('--template', type=Path)
parser.add_argument('--output', type=Path)
parser.add_argument('--inline', type=Path)
args = parser.parse_args()
project = args.project
template = args.template or project / 'prototype/brand-matrix.template.html'
output = args.output or project / 'prototype'
perfumes = json.loads((project / 'data/perfumes.json').read_text())
vocabulary = json.loads((project / 'data/note-vocabulary.json').read_text())
sources = json.loads((project / 'data/sources.json').read_text())
assert len(sources) == len({s['id'] for s in sources}) == 62
source_data = []
for source in sources:
    related = [p for p in perfumes if source['id'] in p['recommendation_source_ids'] + p['official_source_ids']]
    source_data.append({**source, 'perfumes': [{key: p[key] for key in ['brand', 'name', 'name_zh', 'concentration']} for p in related]})
notes = {n['id']: n for n in vocabulary['notes']}
image_dir = template.parent / 'assets/perfumes'
image_sources = json.loads((image_dir / 'manifest.json').read_text())
image_by_perfume = {}
for source in image_sources:
    assert source['perfume_id'] not in image_by_perfume
    image_bytes = (image_dir / source['file']).read_bytes()
    mime_type = mimetypes.guess_type(source['file'])[0]
    assert mime_type in {'image/png', 'image/webp'}, source['file']
    image_by_perfume[source['perfume_id']] = {
        **source, 'src': f'data:{mime_type};base64,' + base64.b64encode(image_bytes).decode('ascii')}
assert set(image_by_perfume) == {p['id'] for p in perfumes}, 'Every perfume needs a verified bottle image.'
perfume_data = []
for perfume in perfumes:
    details = {key: perfume[key] for key in ['id', 'brand', 'name', 'name_zh', 'concentration',
               'note_pyramid_status', 'fragrance_family', 'primary_note_ids', 'note_source_ids']}
    details['notes'] = [{**note, 'category_id': notes[note['note_id']]['category_id']} for note in perfume['notes']]
    if perfume['id'] in image_by_perfume:
        details['image'] = image_by_perfume[perfume['id']]
    perfume_data.append(details)
categories = vocabulary['categories']
category_ids = {c['id'] for c in categories}
assert len(perfumes) == 50 and len({p['id'] for p in perfumes}) == 50
assert len(categories) == len(category_ids) == 14
icon_dir = template.parent / 'assets/category-icons'
category_icons = json.loads((icon_dir / 'manifest.json').read_text())
assert len(category_icons) == 14 and {icon['category_id'] for icon in category_icons} == category_ids
for icon in category_icons:
    svg = ET.fromstring((icon_dir / icon['file']).read_text())
    assert svg.attrib['viewBox'] == '0 0 512 512'
    icon['paths'] = [path.attrib['d'] for path in svg.findall('{http://www.w3.org/2000/svg}path')]
    assert icon['paths'], icon['file']
brands = []
for brand in dict.fromkeys(p['brand'] for p in perfumes):
    samples = [p for p in perfumes if p['brand'] == brand]
    assert len(samples) == 5
    counts = dict.fromkeys([c['id'] for c in categories], 0)
    members = {c['id']: [] for c in categories}
    for perfume in samples:
        # Count each perfume at most once per category, across stages and synonyms.
        perfume_categories = {notes[n]['category_id'] for n in perfume['primary_note_ids']}
        assert perfume_categories <= category_ids
        for category in perfume_categories:
            counts[category] += 1
            members[category].append(perfume['id'])
    assert all(0 <= n <= 5 for n in counts.values())
    brands.append({'brand': brand, 'counts': counts, 'members': members})
assert len(brands) == 10
data = {'scope': 'primary_note_ids', 'perBrand': 5, 'perfumeCount': 50,
        'snapshotDate': '2026-10-03', 'categories': categories, 'brands': brands}
fragment = template.read_text()
stylesheet_tag = '<link rel="stylesheet" href="./style.css">'
script_tag = '<script src="./chart.js"></script>'
assert fragment.count(stylesheet_tag) == fragment.count(script_tag) == 1
stylesheet = (template.parent / 'style.css').read_text()
chart_script = (template.parent / 'chart.js').read_text()
assert fragment.count('__MATRIX_DATA__') == 1
assert fragment.count('__SOURCE_DATA__') == 1
assert fragment.count('__PERFUME_DATA__') == 1
assert fragment.count('__BOTTLE_IMAGE__') == 1
assert fragment.count('__ICON_DATA__') == 1
# Embed the decorative asset so the page and inline preview remain portable.
bottle = (template.parent / 'assets/perfume-bottle-glass-cap-pale.png').read_bytes()
fragment = fragment.replace('__BOTTLE_IMAGE__', 'data:image/png;base64,' + base64.b64encode(bottle).decode('ascii'))
fragment = fragment.replace('__MATRIX_DATA__', json.dumps(data, ensure_ascii=False).replace('<', '\\u003c'))
fragment = fragment.replace('__SOURCE_DATA__', json.dumps(source_data, ensure_ascii=False).replace('<', '\\u003c'))
fragment = fragment.replace('__PERFUME_DATA__', json.dumps(perfume_data, ensure_ascii=False).replace('<', '\\u003c'))
fragment = fragment.replace('__ICON_DATA__', json.dumps(category_icons, ensure_ascii=False).replace('<', '\\u003c'))
output.mkdir(parents=True, exist_ok=True)
# Copy the editable assets too when building into a different output directory.
for filename, content in [('style.css', stylesheet), ('chart.js', chart_script)]:
    if (output / filename).resolve() != (template.parent / filename).resolve():
        (output / filename).write_text(content)
(output / 'brand-matrix.html').write_text(fragment)
(output / 'brand-matrix-data.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
document = ('<!doctype html>\n<html lang="zh-Hant">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
            '<title>香氣圖譜 — 品牌的香氣輪廓</title>\n'
            '</head>\n<body>\n'
            + fragment + '\n</body>\n</html>\n')
(output / 'index.html').write_text(document)
if args.inline:
    # Optional inline preview still embeds the same CSS and chart logic.
    inline = fragment.replace(stylesheet_tag, '<style>\n' + stylesheet + '</style>')
    inline = inline.replace(script_tag, '<script>\n' + chart_script + '</script>')
    args.inline.write_text(inline)
print(json.dumps({'brands': len(brands), 'categories': len(categories), 'cells': len(brands) * len(categories),
                  'perfumes': len(perfumes), 'images': len(image_sources), 'icons': len(category_icons), 'scope': data['scope'],
                  'totals': {c['id']: sum(b['counts'][c['id']] for b in brands) for c in categories}}, ensure_ascii=False))
