#!/usr/bin/env python3
"""Utilities for syncing GitHub Issues with the Kanban project."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import urllib.parse
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import yaml


CACHE_PATH = Path('.codex/cache/projects.v2.json')
MAP_PATH = Path('backlog/.ingest-map.json')
INBOX_DIR = Path('backlog/inbox')
PROCESSED_DIR = Path('backlog/processed')


class SyncError(RuntimeError):
    """Raised when a sync step fails."""


def run(cmd: list[str], *, input_text: str | None = None) -> subprocess.CompletedProcess[str]:
    """Run a subprocess command and return the completed process."""

    result = subprocess.run(
        cmd,
        input=input_text,
        text=True,
        capture_output=True,
        check=False,
    )
    return result


def run_checked(cmd: list[str], *, input_text: str | None = None) -> str:
    """Run a command and raise SyncError on failure; return stdout."""

    result = run(cmd, input_text=input_text)
    if result.returncode != 0:
        message = (result.stderr or result.stdout or '').strip()
        raise SyncError(f"{' '.join(cmd)} failed: {message}")
    return result.stdout


def gh_api_user_login() -> str:
    """Return the current authenticated GitHub login."""

    output = run_checked(['gh', 'api', 'user', '--jq', '.login'])
    return output.strip()


def load_project_cache() -> tuple[dict, str]:
    """Load project cache metadata and return (data, owner_login)."""

    if not CACHE_PATH.exists():
        raise SyncError("Project cache (.codex/cache/projects.v2.json) not found")

    data = json.loads(CACHE_PATH.read_text(encoding='utf-8'))
    owner_login = data.get('owner_login') or gh_api_user_login()
    return data, owner_login


def ensure_label(repo_slug: str, label: str) -> None:
    """Ensure a label exists on the repository."""

    encoded = urllib.parse.quote(label, safe='')
    view = run(['gh', 'api', f'/repos/{repo_slug}/labels/{encoded}'])
    if view.returncode == 0:
        return
    create = run(['gh', 'label', 'create', label, '--repo', repo_slug])
    if create.returncode != 0:
        message = (create.stderr or create.stdout or '').strip()
        raise SyncError(f"failed to create label '{label}': {message}")


def normalize_repo(repo_value: str, owner_login: str) -> str:
    repo = str(repo_value)
    if repo.startswith('@me/'):
        suffix = repo.split('/', 1)[1]
        return f"{owner_login}/{suffix}"
    return repo


def replace_child_section(body: str, new_section: str) -> str:
    header = '## 子Issue'
    lines = body.splitlines()
    section_lines = new_section.splitlines()

    idx = None
    for i, line in enumerate(lines):
        if line.strip() == header:
            idx = i
            break

    if idx is None:
        result_lines = lines[:]
        if result_lines and result_lines[-1].strip() != '':
            result_lines.append('')
        result_lines.extend(section_lines)
        return '\n'.join(result_lines).strip() + '\n'

    end = idx + 1
    while end < len(lines) and not lines[end].startswith('## '):
        end += 1

    result_lines = lines[:idx] + section_lines + lines[end:]
    return '\n'.join(result_lines).strip() + '\n'


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def locate_source_file(fingerprint: str) -> Path | None:
    for base in (PROCESSED_DIR, INBOX_DIR):
        if not base.exists():
            continue
        for candidate in base.iterdir():
            if not candidate.is_file():
                continue
            try:
                payload = candidate.read_bytes()
            except Exception:  # noqa: BLE001 - best effort
                continue
            if sha256_bytes(payload) == fingerprint:
                return candidate
    return None


@dataclass
class IssueMeta:
    title: str
    repo: str
    body: str
    labels: list[str]
    assignees: list[str]
    status: str
    parent: str | None
    source_path: Path


def parse_metadata(path: Path, owner_login: str) -> IssueMeta:
    title = path.stem
    repo = '@me/tech-blog'
    body = path.read_text(encoding='utf-8', errors='ignore')
    labels: list[str] = []
    assignees: list[str] = []
    status = 'Todo'
    parent: str | None = None

    if path.suffix in ('.yaml', '.yml'):
        loaded = yaml.safe_load(path.read_text(encoding='utf-8')) or {}
        title = loaded.get('title', title)
        repo = loaded.get('repo', repo)
        body = loaded.get('body', body)
        labels = list(loaded.get('labels', []) or [])
        assignees = list(loaded.get('assignees', []) or [])
        status = loaded.get('status', status)
        parent = loaded.get('parent') or loaded.get('parent_issue')

    repo_slug = normalize_repo(repo, owner_login)

    if parent:
        parent = str(parent).lstrip('#')
    else:
        match = re.search(r'(?:親|Parent)Issue\s*:?\s*#?(\d+)', body, flags=re.IGNORECASE)
        if match:
            parent = match.group(1)

    return IssueMeta(
        title=title,
        repo=repo_slug,
        body=body,
        labels=labels,
        assignees=assignees,
        status=str(status).strip(),
        parent=parent,
        source_path=path,
    )


def load_ingest_map() -> dict[str, str]:
    if not MAP_PATH.exists():
        raise SyncError('ingest map not found')
    return json.loads(MAP_PATH.read_text(encoding='utf-8'))


def safe_assign(issue_number: str, repo_slug: str, assignee: str) -> None:
    cmd = ['gh', 'issue', 'edit', issue_number, '--repo', repo_slug, '--add-assignee', assignee]
    result = run(cmd)
    if result.returncode != 0 and 'Could not add assignee' not in (result.stderr or ''):
        message = (result.stderr or result.stdout or '').strip()
        raise SyncError(f"failed to add assignee '{assignee}': {message}")


def issue_state(repo_slug: str, number: str) -> dict:
    output = run_checked(['gh', 'issue', 'view', number, '--repo', repo_slug, '--json', 'labels,assignees,state,title,body'])
    return json.loads(output)


def project_item_map(project_number: str, owner: str) -> dict[str, dict]:
    output = run_checked([
        'gh', 'project', 'item-list',
        project_number,
        '--owner', owner,
        '--format', 'json',
        '--limit', '200',
    ])
    data = json.loads(output or '{}')
    mapping = {}
    for item in data.get('items', []):
        content = item.get('content') or {}
        url = content.get('url')
        if url:
            mapping[url] = {
                'id': item.get('id'),
                'status': (item.get('status') or '').strip().lower(),
            }
    return mapping


def ingest_sync(cache: dict, owner_login: str) -> dict:
    project_number = str(cache['number'])
    owner = cache['owner']
    project_id = cache['project']
    status_field = next(field for field in cache['fields'] if field['name'] == 'Status')
    opt_lookup = {opt['name'].strip().lower(): opt['id'] for opt in status_field['options']}

    ingest_map = load_ingest_map()
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    created = []
    skipped = []
    failed = []

    for path in sorted(INBOX_DIR.glob('*.*')):
        payload = path.read_bytes()
        fingerprint = sha256_bytes(payload)

        if fingerprint in ingest_map:
            skipped.append({'file': str(path), 'reason': 'dup'})
            continue

        meta = parse_metadata(path, owner_login)

        try:
            for label in meta.labels:
                ensure_label(meta.repo, label)

            cmd = ['gh', 'issue', 'create', '--repo', meta.repo, '--title', meta.title, '--body', meta.body]
            for label in meta.labels:
                cmd.extend(['--label', label])
            for assignee in meta.assignees:
                assign = owner_login if assignee == '@me' else assignee
                cmd.extend(['--assignee', assign])

            issue_proc = run(cmd)
            if issue_proc.returncode != 0:
                message = (issue_proc.stderr or issue_proc.stdout or '').strip()
                raise SyncError(f'issue create failed: {message}')

            combined_output = '\n'.join(filter(None, [issue_proc.stdout, issue_proc.stderr]))
            issue_url = None
            for line in combined_output.splitlines():
                line = line.strip()
                if line.startswith('http'):
                    issue_url = line
                    break
            if not issue_url:
                raise SyncError(f'failed to capture issue url from output: {combined_output!r}')

            add_output = run_checked([
                'gh', 'project', 'item-add',
                project_number,
                '--owner', owner,
                '--url', issue_url,
                '--format', 'json',
                '-q', '.id',
            ])
            item_id = add_output.strip()
            if not item_id:
                raise SyncError('project item id missing')

            status_key = meta.status.lower()
            option_id = opt_lookup.get(status_key, opt_lookup['todo'])
            run_checked([
                'gh', 'project', 'item-edit',
                '--id', item_id,
                '--project-id', project_id,
                '--field-id', status_field['id'],
                '--single-select-option-id', option_id,
            ])

            ingest_map[fingerprint] = issue_url
            path.rename(PROCESSED_DIR / path.name)
            created.append({'file': str(path), 'url': issue_url})

        except Exception as exc:  # noqa: BLE001 - record error
            failed.append({'file': str(path), 'error': str(exc)})

    MAP_PATH.write_text(json.dumps(ingest_map, ensure_ascii=False, indent=2), encoding='utf-8')
    return {'created': created, 'skipped': skipped, 'failed': failed}


def parent_sync(cache: dict, owner_login: str) -> dict:
    project_number = str(cache['number'])
    owner = cache['owner']
    project_id = cache['project']
    status_field = next(field for field in cache['fields'] if field['name'] == 'Status')
    opt_lookup = {opt['name'].strip().lower(): opt['id'] for opt in status_field['options']}

    ingest_map = load_ingest_map()
    project_items = project_item_map(project_number, owner)

    issue_meta: dict[str, IssueMeta] = {}
    issue_number_map: dict[str, str] = {}
    parent_children: dict[str, list[str]] = {}
    missing_source: list[dict] = []

    for fingerprint, issue_url in ingest_map.items():
        source_path = locate_source_file(fingerprint)
        if source_path is None:
            missing_source.append({'issue': issue_url, 'fingerprint': fingerprint})
            continue

        meta = parse_metadata(source_path, owner_login)
        issue_meta[issue_url] = meta
        issue_number = issue_url.rstrip('/').split('/')[-1]
        issue_number_map[issue_number] = issue_url
        if meta.parent:
            parent_children.setdefault(meta.parent, []).append(issue_url)

    issue_cache: dict[str, dict] = {}

    def cached_state(url: str, repo_slug: str, number: str) -> dict:
        if url not in issue_cache:
            issue_cache[url] = issue_state(repo_slug, number)
        return issue_cache[url]

    def ensure_item_status(issue_url: str, meta: IssueMeta) -> None:
        desired_key = meta.status.lower()
        option_id = opt_lookup.get(desired_key, opt_lookup['todo'])

        item_info = project_items.get(issue_url)
        item_id = None
        current_status = ''
        if item_info:
            item_id = item_info.get('id')
            current_status = (item_info.get('status') or '').strip().lower()

        if not item_id:
            add_output = run_checked([
                'gh', 'project', 'item-add',
                project_number,
                '--owner', owner,
                '--url', issue_url,
                '--format', 'json',
                '-q', '.id',
            ])
            item_id = add_output.strip()
            project_items[issue_url] = {'id': item_id, 'status': ''}
            current_status = ''

        if current_status != desired_key:
            result = run([
                'gh', 'project', 'item-edit',
                '--id', item_id,
                '--project-id', project_id,
                '--field-id', status_field['id'],
                '--single-select-option-id', option_id,
            ])
            if result.returncode != 0:
                message = (result.stderr or result.stdout or '').strip()
                failed.append({'issue': issue_url, 'error': f'status sync failed: {message}'})
            else:
                project_items[issue_url]['status'] = desired_key

    updated = []
    missing_parent = []
    failed = []

    for issue_url, meta in issue_meta.items():
        try:
            ensure_item_status(issue_url, meta)
        except Exception as exc:  # noqa: BLE001
            failed.append({'issue': issue_url, 'error': str(exc)})

    for parent_number, child_urls in parent_children.items():
        parent_issue_url = issue_number_map.get(parent_number)
        if not parent_issue_url:
            missing_parent.append({'parent': parent_number, 'children': child_urls})
            continue

        parent_meta = issue_meta[parent_issue_url]

        try:
            parent_info = cached_state(parent_issue_url, parent_meta.repo, parent_number)
        except Exception as exc:  # noqa: BLE001
            failed.append({'parent': parent_issue_url, 'error': str(exc)})
            continue

        child_entries = []
        for child_url in sorted(child_urls):
            child_meta = issue_meta.get(child_url)
            if not child_meta:
                continue
            child_number = child_url.rstrip('/').split('/')[-1]

            try:
                child_info = cached_state(child_url, child_meta.repo, child_number)
            except Exception as exc:  # noqa: BLE001
                failed.append({'parent': parent_issue_url, 'child': child_url, 'error': str(exc)})
                continue

            for label in child_meta.labels:
                try:
                    ensure_label(child_meta.repo, label)
                except Exception as exc:  # noqa: BLE001
                    failed.append({'parent': parent_issue_url, 'child': child_url, 'error': str(exc)})

            for assignee in child_meta.assignees:
                assign = owner_login if assignee == '@me' else assignee
                try:
                    safe_assign(child_number, child_meta.repo, assign)
                except Exception as exc:  # noqa: BLE001
                    failed.append({'parent': parent_issue_url, 'child': child_url, 'error': str(exc)})

            ensure_item_status(child_url, child_meta)

            child_entries.append({
                'number': child_number,
                'title': child_info.get('title') or child_meta.title,
                'state': (child_info.get('state') or '').upper(),
                'project_status': project_items.get(child_url, {}).get('status', ''),
            })

        if not child_entries:
            continue

        child_entries.sort(key=lambda entry: int(entry['number']))

        section_lines = ['## 子Issue']
        for entry in child_entries:
            done = entry['state'] == 'CLOSED' or entry['project_status'] == 'done'
            marker = 'x' if done else ' '
            section_lines.append(f"- [{marker}] #{entry['number']} {entry['title']}")

        new_section = '\n'.join(section_lines)
        next_body = replace_child_section(parent_meta.body, new_section)
        remote_body = parent_info.get('body') or ''

        if next_body.strip() == remote_body.strip():
            continue

        run_checked([
            'gh', 'issue', 'edit',
            parent_number,
            '--repo', parent_meta.repo,
            '--body-file', '-',
        ], input_text=next_body)

        updated.append({'parent': parent_issue_url, 'children': child_entries})

    return {
        'updated': updated,
        'missing_source': missing_source,
        'missing_parent': missing_parent,
        'failed': failed,
    }


def sync_all(cache: dict, owner_login: str) -> dict:
    ingest_result = ingest_sync(cache, owner_login)
    parent_result = parent_sync(cache, owner_login)
    return {'ingest': ingest_result, 'parent': parent_result}


def parse_args(argv: Iterable[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Kanban sync utilities')
    parser.add_argument('--mode', choices=['ingest', 'parent', 'all'], required=True)
    return parser.parse_args(list(argv))


def main(argv: Iterable[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    cache, owner_login = load_project_cache()

    try:
        if args.mode == 'ingest':
            result = ingest_sync(cache, owner_login)
        elif args.mode == 'parent':
            result = parent_sync(cache, owner_login)
        else:
            result = sync_all(cache, owner_login)
    except SyncError as exc:
        print(json.dumps({'error': str(exc)}, ensure_ascii=False))
        return 1

    print(json.dumps(result, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
