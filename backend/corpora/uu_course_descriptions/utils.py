from django.utils.html import strip_tags
import re
from langdetect import detect

from addcorpus.serializers import LanguageField

def html_to_text(content):
    html_replacements = [
        (r'<style.*</style>', ''),
        (r'&nbsp;', ' '),
        (r'<li>', '<li>- '),
        (r'</li>', '</li>\n'),
        (r'<br />', '<br />\n'),
        (r'</p>', '</p>\n'),
        (r'_x000D_', ' '), # excel quirk
    ]

    for pattern, repl in html_replacements:
        content = re.sub(pattern, repl, content, flags=re.DOTALL)

    plain = strip_tags(content)

    stripped_lines = '\n'.join(filter(None, map(str.strip, plain.splitlines())))
    return stripped_lines.strip()

def detect_language(content):
    if len(content) < 50:
        return

    try:
        detected = detect(content)
        if detected == 'af':
            # dutch is sometimes mistaken for afrikaans
            # but we know afrikaans is never actually used in this corpus
            return 'nl'
        return detected
    except:
        pass

def language_name(language_code):
    return LanguageField().to_representation(language_code)
