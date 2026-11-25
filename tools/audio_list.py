"""Generate audio/audio-list.csv: one row per Arabic item that needs a recording.
Filename rule: <lesson-id>-d01 (dialogue line), -v01 (vocab), -p01 (phrase), -x01 (practice model).
Run: python3 tools/audio_list.py"""
import json, csv, glob, os
idx = json.load(open('data/index.json'))
rows = []
for meta in idx['levels']:
    d = json.load(open(f"data/{meta['file']}.json"))
    for m in d['modules']:
        for l in m['lessons']:
            def add(k, i, ar, tr, mn, kind):
                if ar: rows.append([f"{l['id']}-{k}{i:02d}.mp3", meta['kicker'], m['title'], l['title'], kind, ar, tr or '', mn or ''])
            for i, x in enumerate((l.get('dialogue') or {}).get('lines', []), 1):
                add('d', i, x.get('najdi'), x.get('najdi_bn'), x.get('meaning'), 'কথোপকথন · ' + x.get('speaker', ''))
            for i, v in enumerate(l.get('vocab', []), 1):
                add('v', i, v.get('najdi') or v.get('fusha'), v.get('najdi_bn') or v.get('fusha_bn'), v.get('meaning'), 'শব্দ')
            for i, p in enumerate(l.get('phrases', []), 1):
                add('p', i, p.get('najdi') or p.get('fusha'), p.get('najdi_bn'), p.get('meaning'), 'বাক্যাংশ')
            for i, t in enumerate(l.get('practice', []), 1):
                add('x', i, t.get('model'), '', t.get('task'), 'অনুশীলন মডেল')
os.makedirs('audio', exist_ok=True)
with open('audio/audio-list.csv', 'w', newline='', encoding='utf-8-sig') as f:
    w = csv.writer(f); w.writerow(['ফাইলের নাম', 'লেভেল', 'মডিউল', 'পাঠ', 'ধরন', 'আরবি (যা পড়বেন)', 'বাংলা উচ্চারণ', 'অর্থ']); w.writerows(rows)
print(len(rows), 'items')
