#!/usr/bin/env python3
"""Build the EMI 2026 reveal.js deck into a single static index.html.

This script concatenates every ``slides/NN_*.html`` fragment (in sorted
filename order) into ``index.html`` at a stable slot, and inlines the
contents of ``data/*.json`` as a ``window.EMI_DATA`` object at a second
stable slot. Inlining the data avoids ``fetch``/CORS restrictions so the
deck works when ``index.html`` is opened directly via the ``file://``
protocol at the venue (fully offline).

The build is idempotent: it rewrites only the regions delimited by the
stable HTML-comment markers and leaves everything else untouched, so it
can be re-run safely any number of times.

Cache-busting: each rebuild appends ``?v=<token>`` to the local JS/CSS
references (js/components.js, js/deck.js, css/theme.css,
css/reveal-overrides.css). The token is the first 8 hex characters of the
SHA-256 hash of those files' concatenated contents, so it only changes
when the files actually change and the build stays fully deterministic
(no Date.now() / random).

Markers in ``index.html``:
    <!--SLOT:slides:start--> ... <!--SLOT:slides:end-->
    <!--SLOT:data:start-->   ... <!--SLOT:data:end-->

Usage:
    python3 build.py

Pure Python 3 standard library; no third-party dependencies.
"""

import hashlib
import json
import pathlib
import re
import sys
import warnings

# Fail fast: promote warnings to errors so silent issues stop the build.
warnings.filterwarnings("error")

DIRECTORY_ROOT = pathlib.Path(__file__).resolve().parent
PATH_INDEX = DIRECTORY_ROOT / "index.html"
DIRECTORY_SLIDES = DIRECTORY_ROOT / "slides"
DIRECTORY_DATA = DIRECTORY_ROOT / "data"

MARKER_SLIDES_START = "<!--SLOT:slides:start-->"
MARKER_SLIDES_END = "<!--SLOT:slides:end-->"
MARKER_DATA_START = "<!--SLOT:data:start-->"
MARKER_DATA_END = "<!--SLOT:data:end-->"

# Recognized data files, mapped to the key they occupy under EMI_DATA.
DATA_FILES = {
    "overlays.json": "overlays",
    "results.json": "results",
    "mimo.json": "mimo",
    "wgm_compare.json": "wgmCompare",
}

# Local JS/CSS assets that receive a content-hash cache-buster on every build.
# CDN / dist/ files are intentionally excluded.
LOCAL_ASSETS = [
    "js/components.js",
    "js/deck.js",
    "css/theme.css",
    "css/reveal-overrides.css",
]


def collect_slides() -> str:
    """Concatenate all slide fragments in sorted filename order.

    Returns:
        The combined HTML of every ``slides/NN_*.html`` fragment, each
        prefixed by a comment naming its source file. Returns a single
        placeholder ``<section>`` if no fragments exist yet.

    Raises:
        OSError: If a slide fragment cannot be read.
    """
    paths = sorted(DIRECTORY_SLIDES.glob("*.html"))
    if not paths:
        return (
            "\n      <!-- no slide fragments found in slides/ -->\n"
            "      <section><h2>Empty deck</h2>"
            "<p>Add slides/NN_*.html, then re-run build.py.</p>"
            "</section>\n"
        )
    parts = []
    for path in paths:
        body = path.read_text(encoding="utf-8").strip("\n")
        parts.append("\n      <!-- {0} -->\n{1}\n".format(path.name, body))
    return "".join(parts)


def collect_data() -> str:
    """Build the inline ``window.EMI_DATA`` script from data/*.json.

    Each recognized JSON file is parsed (to validate it) and placed under
    its mapped key. Missing files become ``null`` so component code can
    rely on every key existing while section authors develop against
    partial data.

    Returns:
        A ``<script>`` element string assigning ``window.EMI_DATA``.

    Raises:
        ValueError: If a present JSON file fails to parse.
    """
    payload = {}
    for file_name, key in DATA_FILES.items():
        path = DIRECTORY_DATA / file_name
        if path.exists():
            text = path.read_text(encoding="utf-8")
            try:
                payload[key] = json.loads(text)
            except json.JSONDecodeError as error:
                raise ValueError(
                    "invalid JSON in {0}: {1}".format(path, error)
                ) from error
        else:
            payload[key] = None
    serialized = json.dumps(
        payload, ensure_ascii=False, separators=(",", ":")
    )
    return (
        "\n  <script>window.EMI_DATA = {0};</script>\n  ".format(serialized)
    )


def replace_region(
    document: str, marker_start: str, marker_end: str, content: str
) -> str:
    """Replace the text between two markers, keeping the markers in place.

    Args:
        document: Full text of the index document.
        marker_start: Opening marker comment.
        marker_end: Closing marker comment.
        content: Replacement text inserted between the markers.

    Returns:
        The document with the inter-marker region replaced.

    Raises:
        ValueError: If either marker is missing from the document.
    """
    if marker_start not in document or marker_end not in document:
        raise ValueError(
            "missing markers {0} / {1} in index.html".format(
                marker_start, marker_end
            )
        )
    pattern = re.compile(
        re.escape(marker_start) + r".*?" + re.escape(marker_end),
        re.DOTALL,
    )
    replacement = marker_start + content + marker_end
    return pattern.sub(lambda _match: replacement, document, count=1)


def asset_version() -> str:
    """Compute a short content-hash token from all local JS/CSS assets.

    The hash covers the concatenated bytes of every file listed in
    ``LOCAL_ASSETS`` (missing files are silently skipped). Using a content
    hash keeps builds deterministic — the token changes only when the file
    content changes, never from the clock or randomness.

    Returns:
        First 8 hex characters of the SHA-256 digest.
    """
    digest = hashlib.sha256()
    for name in LOCAL_ASSETS:
        path = DIRECTORY_ROOT / name
        if path.exists():
            digest.update(path.read_bytes())
    return digest.hexdigest()[:8]


def stamp_assets(document: str, token: str) -> str:
    """Append ``?v=<token>`` to every local JS/CSS reference in the document.

    Any existing ``?v=...`` suffix is replaced so repeated builds do not
    accumulate stacked query parameters. Only exact filename matches listed
    in ``LOCAL_ASSETS`` are touched; CDN / dist/ paths are left unchanged.

    Args:
        document: Full text of index.html (before writing back).
        token:    Cache-buster token, typically from ``asset_version()``.

    Returns:
        The document with updated ``src``/``href`` attributes.
    """
    for name in LOCAL_ASSETS:
        # Match  src="name"  or  src="name?v=anything"  (and href=).
        # The full relative path anchors the substitution so no CDN URL
        # whose basename happens to match is affected.
        escaped = re.escape(name)
        pattern = re.compile(
            r'((?:src|href)="' + escaped + r')(?:\?v=[^"]*)?(")'
        )
        replacement = r"\g<1>?v=" + token + r"\g<2>"
        document = pattern.sub(replacement, document)
    return document


def main() -> int:
    """Read index.html, inject slides and data, and write it back.

    Returns:
        Process exit code: 0 on success.

    Raises:
        FileNotFoundError: If index.html does not exist.
    """
    if not PATH_INDEX.exists():
        raise FileNotFoundError(
            "index.html not found at {0}".format(PATH_INDEX)
        )
    document = PATH_INDEX.read_text(encoding="utf-8")
    document = replace_region(
        document, MARKER_SLIDES_START, MARKER_SLIDES_END, collect_slides()
    )
    document = replace_region(
        document, MARKER_DATA_START, MARKER_DATA_END, collect_data()
    )
    token = asset_version()
    document = stamp_assets(document, token)
    PATH_INDEX.write_text(document, encoding="utf-8")
    slide_count = len(list(DIRECTORY_SLIDES.glob("*.html")))
    present_data = [
        name for name in DATA_FILES if (DIRECTORY_DATA / name).exists()
    ]
    print(
        "built index.html: {0} slide file(s), data inlined: {1}, "
        "asset version: {2}".format(
            slide_count, present_data or "none", token
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
