#!/usr/bin/env python3
"""Local, read-only evidence index. Never grants test or release approval.

Usage: python3 tools/summarize_release_artifacts.py MANIFEST ZIP_DIRECTORY [--details]
The manifest must be reviewed independently and tied to qualified originals.
Exit 0: indexed, human review still required; 1: findings; 2: unknowns.
"""
import hashlib
import json
from pathlib import Path, PurePosixPath
import sys
import time
import zipfile
import zlib

IDENTITY = ('head', 'tree', 'run', 'attempt')


def digest(data):
    return hashlib.sha256(data).hexdigest()


def pointer(value, path):
    if path == '':
        return value
    if not path.startswith('/'):
        raise ValueError('invalid JSON pointer')
    for part in path[1:].split('/'):
        part = part.replace('~1', '/').replace('~0', '~')
        value = value[int(part)] if isinstance(value, list) else value[part]
    return value


def strict_equal(actual, expected):
    return type(actual) is type(expected) and actual == expected


def summarize(manifest, root):
    started = time.monotonic()
    findings, unknowns, artifacts = [], [], []
    root = Path(root).resolve()

    def finding(artifact, member, path, reason):
        findings.append(dict(artifact=artifact, member=member, pointer=path, reason=reason))

    identity = manifest.get('identity', {})
    if (not all(identity.get(k) for k in IDENTITY)
            or any(type(identity.get(k)) is not int for k in ('run', 'attempt'))
            or any(type(identity.get(k)) is not str or len(identity[k]) != 40
                   or any(c not in '0123456789abcdef' for c in identity[k])
                   for k in ('head', 'tree'))):
        finding(None, None, '', 'invalid expected identity')
    entries = manifest.get('artifacts', [])
    if not isinstance(entries, list) or not entries:
        finding(None, None, '', 'empty/invalid artifact contract')
        entries = []
    seen = set()
    for artifact in entries:
        aid = artifact.get('id')
        if aid in seen or type(aid) is not int:
            finding(aid, None, '', 'duplicate/invalid artifact identity')
        seen.add(aid)
        record = dict(id=aid, reports=[], pngCount=0, integrity='UNVERIFIED')
        artifacts.append(record)
        if any(artifact.get(k) != identity.get(k) for k in IDENTITY):
            finding(aid, None, '', 'artifact identity mismatch')
        try:
            path = (root / artifact['path']).resolve()
            if not path.is_relative_to(root):
                raise ValueError('path outside ZIP directory')
            raw = path.read_bytes()
            record.update(bytes=len(raw), sha256=digest(raw))
            if len(raw) != artifact['bytes'] or digest(raw) != artifact['sha256']:
                finding(aid, None, '', 'ZIP digest/size mismatch')
                continue
            with zipfile.ZipFile(path) as archive:
                names = archive.namelist()
                if len(names) != len(set(names)) or any(
                        PurePosixPath(n).is_absolute() or '..' in PurePosixPath(n).parts
                        or '\\' in n for n in names):
                    raise ValueError('duplicate/unsafe ZIP member')
                # Stream every member to verify CRC, including images/Pages payload.
                for info in archive.infolist():
                    with archive.open(info) as stream:
                        while stream.read(1024 * 1024):
                            pass
                record['integrity'] = 'DIGEST_SIZE_CRC_VERIFIED'
                record['pngCount'] = sum(n.endswith('.png') for n in names)
                expected = artifact.get('reports')
                if not isinstance(expected, list):
                    finding(aid, None, '', 'missing expected report inventory')
                    continue
                expected_names = [r['path'] for r in expected]
                actual_names = [n for n in names if n.endswith('.json')]
                if len(expected_names) != len(set(expected_names)):
                    finding(aid, None, '', 'duplicate report contract')
                for missing in sorted(set(expected_names) - set(actual_names)):
                    finding(aid, missing, '', 'missing expected report')
                for extra in sorted(set(actual_names) - set(expected_names)):
                    finding(aid, extra, '', 'unexpected report; contract review required')
                for report in expected:
                    name = report['path']
                    if name not in actual_names:
                        continue
                    report_raw = archive.read(name)
                    info = dict(path=name, sha256=digest(report_raw), checkedPointers=0)
                    record['reports'].append(info)
                    if info['sha256'] != report.get('sha256'):
                        finding(aid, name, '', 'report digest mismatch')
                    try:
                        value = json.loads(report_raw)
                    except (ValueError, UnicodeError):
                        finding(aid, name, '', 'invalid JSON')
                        continue
                    assertions = report.get('assertions', [])
                    if not assertions:
                        unknowns.append(dict(artifact=aid, member=name,
                                             reason='no reviewed outcome adapter'))
                    for assertion in assertions:
                        p = assertion['pointer']
                        try:
                            actual = pointer(value, p)
                        except (KeyError, IndexError, TypeError, ValueError):
                            finding(aid, name, p, 'missing/invalid expected field')
                            continue
                        info['checkedPointers'] += 1
                        if (assertion.get('kind') == 'outcome' and type(actual) is str
                                and actual not in ('PASS', 'FAIL', 'FAILED', 'ERROR', 'FAILURE')):
                            unknowns.append(dict(artifact=aid, member=name, pointer=p,
                                                 reason='unknown outcome value'))
                            continue
                        if not strict_equal(actual, assertion['equals']):
                            finding(aid, name, p, 'outcome differs from explicit expectation')
        except (OSError, ValueError, KeyError, TypeError, RuntimeError, EOFError,
                zipfile.BadZipFile, zlib.error) as error:
            finding(aid, None, '', type(error).__name__ + ': ' + str(error))
    if not any(a['reports'] for a in artifacts):
        unknowns.append(dict(artifact=None, member=None, reason='no JSON reports indexed'))
    return dict(schema=1, identity=identity,
                disposition='FINDINGS' if findings else 'UNKNOWN' if unknowns else 'REVIEW_REQUIRED',
                releaseApproval=False, findings=findings, unknowns=unknowns,
                counts=dict(artifacts=len(artifacts), reports=sum(len(a['reports']) for a in artifacts),
                            png=sum(a['pngCount'] for a in artifacts),
                            assertions=sum(r['checkedPointers'] for a in artifacts for r in a['reports'])),
                artifacts=artifacts, seconds=round(time.monotonic() - started, 3),
                limits=['Only explicit reviewed JSON pointers are evaluated; other fields remain unassessed.',
                        'Hashes bind originals; they do not establish semantic correctness.',
                        'PNG files CRC-checked, not decoded or visually reviewed.',
                        'Human/financial/physical-device/CI/release gates remain required.'])


if __name__ == '__main__':
    try:
        result = summarize(json.loads(Path(sys.argv[1]).read_text()), sys.argv[2])
    except (OSError, ValueError, IndexError, TypeError) as error:
        print(json.dumps(dict(disposition='FINDINGS', releaseApproval=False,
                              error=type(error).__name__ + ': ' + str(error))))
        sys.exit(1)
    if '--details' not in sys.argv[3:]:
        result['artifacts'] = [dict(id=a['id'], integrity=a['integrity'],
                                    bytes=a.get('bytes'), sha256=a.get('sha256'),
                                    reports=len(a['reports']), png=a['pngCount'])
                               for a in result['artifacts']]
        result['reportIndex'] = 'Use the input manifest for paths/digests/assertions, or --details.'
    print(json.dumps(result, indent=2))
    sys.exit(1 if result['findings'] else 2 if result['unknowns'] else 0)
