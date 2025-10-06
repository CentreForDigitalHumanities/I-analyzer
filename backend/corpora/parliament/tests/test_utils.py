from bs4 import BeautifulSoup

from corpora.parliament.utils.parlamint_v4 import (
    detokenize_parlamint,
    format_annotated_text,
)

annotated_xml = """
<?xml version="1.0" encoding="UTF-8"?>
<s xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.s14" xml:lang="nl">
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w258" msd="UPosTag=PRON|Case=Nom|Person=1|PronType=Prs" lemma="wij">Wij</w>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w259" msd="UPosTag=AUX|Number=Plur|Tense=Pres|VerbForm=Fin" lemma="moeten">moeten</w>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w260" msd="UPosTag=NOUN|Number=Plur" lemma="meetinstrument">meetinstrumenten</w>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w261" msd="UPosTag=SCONJ" lemma="als">als</w>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w262" msd="UPosTag=DET|Definite=Def" lemma="de">de</w>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w263" msd="UPosTag=NOUN|Gender=Com|Number=Sing" lemma="mate">mate</w>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w264" msd="UPosTag=ADP" lemma="van">van</w>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w265" join="right" msd="UPosTag=NOUN|Gender=Com|Number=Sing" lemma="veiligheid">veiligheid</w>
    <pc xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.pc31" msd="UPosTag=PUNCT">,</pc>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w266" msd="UPosTag=DET|Definite=Def" lemma="de">de</w>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w267" msd="UPosTag=NOUN|Gender=Com|Number=Sing" lemma="stand">stand</w>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w268" msd="UPosTag=ADP" lemma="van">van</w>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w269" msd="UPosTag=DET|Definite=Def" lemma="de">de</w>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w270" msd="UPosTag=NOUN|Gender=Com|Number=Sing" lemma="natuur">natuur</w>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w271" msd="UPosTag=CCONJ" lemma="en">en</w>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w272" msd="UPosTag=DET|Definite=Def" lemma="het">het</w>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w273" msd="UPosTag=NOUN|Gender=Neut|Number=Sing" lemma="milieu">milieu</w>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w274" msd="UPosTag=CCONJ" lemma="en">en</w>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w275" msd="UPosTag=DET|Definite=Def" lemma="de">de</w>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w276" msd="UPosTag=NOUN|Gender=Com|Number=Sing" lemma="vraag">vraag</w>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w277" msd="UPosTag=ADP" lemma="in">in</w>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w278" msd="UPosTag=ADV" lemma="hoeverre">hoeverre</w>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w279" msd="UPosTag=NOUN|Number=Plur" lemma="mens">mensen</w>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w280" msd="UPosTag=PRON|Case=Acc|Person=3|PronType=Prs|Reflex=Yes" lemma="zich">zich</w>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w281" msd="UPosTag=ADJ|Degree=Pos" lemma="gelukkig">gelukkig</w>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w282" msd="UPosTag=AUX|Number=Plur|Tense=Pres|VerbForm=Fin" lemma="kunnen">kunnen</w>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w283" msd="UPosTag=VERB|VerbForm=Inf" lemma="voelen">voelen</w>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w284" msd="UPosTag=ADP" lemma="in">in</w>
                         <name type="LOC">
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w285" join="right" msd="UPosTag=PROPN|Gender=Neut|Number=Sing" lemma="Nederland">Nederland</w>
                         </name>
    <pc xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.pc32" msd="UPosTag=PUNCT">,</pc>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w286" msd="UPosTag=VERB|VerbForm=Part" lemma="bepalen">bepalend</w>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w287" msd="UPosTag=VERB|VerbForm=Inf" lemma="laten">laten</w>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w288" msd="UPosTag=VERB|VerbForm=Inf" lemma="worden">worden</w>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w289" msd="UPosTag=ADP" lemma="bij">bij</w>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w290" msd="UPosTag=DET|Definite=Def" lemma="de">de</w>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w291" msd="UPosTag=NOUN|Gender=Com|Number=Sing" lemma="ontwikkeling">ontwikkeling</w>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w292" msd="UPosTag=ADP" lemma="van">van</w>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w293" msd="UPosTag=DET|Definite=Def" lemma="het">het</w>
    <w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w294" join="right" msd="UPosTag=NOUN|Gender=Neut|Number=Sing" lemma="beleid">beleid</w>
    <pc xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.pc33" msd="UPosTag=PUNCT">.</pc>
</s>
"""


def test_detokenize_parlamint():
    soup = BeautifulSoup(annotated_xml, 'xml')
    tokens = soup.find_all(["w", "pc"])
    assert (
        detokenize_parlamint(tokens)
        == "Wij moeten meetinstrumenten als de mate van veiligheid, de stand van de natuur en het milieu en de vraag in hoeverre mensen zich gelukkig kunnen voelen in Nederland, bepalend laten worden bij de ontwikkeling van het beleid."
    )


def test_format_annotated_text():
    soup = BeautifulSoup(annotated_xml, 'xml')
    annotations = soup.find_all("name")
    annotated_text = [format_annotated_text(annotation) for annotation in annotations]
    assert (
        " ".join(annotated_text)
        == "Wij moeten meetinstrumenten als de mate van veiligheid, de stand van de natuur en het milieu en de vraag in hoeverre mensen zich gelukkig kunnen voelen in [Nederland](LOC), bepalend laten worden bij de ontwikkeling van het beleid."
    )


xml_annotation_start = """
<?xml version="1.0" encoding="UTF-8"?>
<s xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.s7" xml:lang="nl">
                     <name type="PER">
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w160" msd="UPosTag=PROPN" lemma="von">Von</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w161" msd="UPosTag=PROPN" lemma="humboldt">Humboldt</w>
                     </name>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w162" msd="UPosTag=VERB|Number=Sing|Tense=Past|VerbForm=Fin" lemma="merken">merkte</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w163" msd="UPosTag=ADJ|Degree=Pos" lemma="terecht">terecht</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w164" join="right" msd="UPosTag=ADP" lemma="op">op</w>
<pc xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.pc21" msd="UPosTag=PUNCT">:</pc>
<pc xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.pc22" join="right" msd="UPosTag=PUNCT">"</pc>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w165" msd="UPosTag=ADJ|Degree=Pos" lemma="public">Public</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w166" msd="UPosTag=NOUN|Gender=Neut|Number=Sing" lemma="welfare">welfare</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w167" msd="UPosTag=AUX|Number=Sing|Tense=Past|VerbForm=Fin" lemma="could">could</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w168" msd="UPosTag=ADV" lemma="not">not</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w169" msd="UPosTag=AUX|VerbForm=Inf" lemma="be">be</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w170" msd="UPosTag=VERB|VerbForm=Part" lemma="measured">measured</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w171" msd="UPosTag=ADP" lemma="according">according</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w172" msd="UPosTag=ADP" lemma="to">to</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w173" msd="UPosTag=X|Foreign=Yes" lemma="the">the</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w174" msd="UPosTag=NOUN|Gender=Com|Number=Sing" lemma="value">value</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w175" msd="UPosTag=ADP" lemma="of">of</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w176" msd="UPosTag=PRON|Person=3|Poss=Yes|PronType=Prs" lemma="its">its</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w177" join="right" msd="UPosTag=NOUN|Gender=Neut|Number=Sing" lemma="export">export</w>
<pc xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.pc23" msd="UPosTag=PUNCT">."</pc>
</s>
"""


def test_starts_with_annotation():
    soup = BeautifulSoup(xml_annotation_start, 'xml')
    annotations = soup.find_all("name")
    annotated_text = [format_annotated_text(annotation) for annotation in annotations]
    assert (
        " ".join(annotated_text)
        == '[Von Humboldt](PER) merkte terecht op: "Public welfare could not be measured according to the value of its export."'
    )


xml_annotation_end = """
<?xml version="1.0" encoding="UTF-8"?>
<s xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.s93" xml:lang="nl">
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w1933" msd="UPosTag=PRON|Case=Nom|Person=1|PronType=Prs" lemma="wij">We</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w1934" msd="UPosTag=VERB|Number=Plur|Tense=Pres|VerbForm=Fin" lemma="werken">werken</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w1935" msd="UPosTag=ADV" lemma="hier">hier</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w1936" msd="UPosTag=ADV" lemma="samen">samen</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w1937" msd="UPosTag=ADP" lemma="aan">aan</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w1938" msd="UPosTag=NOUN|Number=Plur" lemma="wet">wetten</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w1939" msd="UPosTag=ADP" lemma="voor">voor</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w1940" msd="UPosTag=ADJ|Degree=Pos" lemma="heel">heel</w>
                     <name type="LOC">
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w1941" join="right" msd="UPosTag=PROPN|Gender=Neut|Number=Sing" lemma="Nederland">Nederland</w>
                     </name>
<pc xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.pc174" msd="UPosTag=PUNCT">.</pc>
</s>
"""


def test_ends_with_annotation():
    soup = BeautifulSoup(xml_annotation_end, 'xml')
    annotations = soup.find_all("name")
    annotated_text = [format_annotated_text(annotation) for annotation in annotations]
    assert (
        " ".join(annotated_text)
        == "We werken hier samen aan wetten voor heel [Nederland](LOC)."
    )


xml_multiple_annotations = """
<?xml version="1.0" encoding="UTF-8"?>
<s xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.s6" xml:lang="nl">
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w132" msd="UPosTag=ADV" lemma="al">Al</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w133" msd="UPosTag=ADP" lemma="in">in</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w134" msd="UPosTag=NUM" lemma="1804">1804</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w135" msd="UPosTag=VERB|Number=Sing|Tense=Past|VerbForm=Fin" lemma="gebruikt">gebruikte</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w136" msd="UPosTag=NOUN|Gender=Com|Number=Sing" lemma="wetenschapper">wetenschapper</w>
                     <name type="PER">
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w137" msd="UPosTag=PROPN" lemma="alexander">Alexander</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w138" msd="UPosTag=PROPN" lemma="von">von</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w139" msd="UPosTag=PROPN" lemma="humboldt">Humboldt</w>
                     </name>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w140" msd="UPosTag=DET|Definite=Def" lemma="het">het</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w141" msd="UPosTag=ADJ|Degree=Pos" lemma="breed">brede</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w142" msd="UPosTag=NOUN|Gender=Neut|Number=Sing" lemma="welvaartsargument">welvaartsargument</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w143" msd="UPosTag=SCONJ" lemma="toen">toen</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w144" msd="UPosTag=VERB|VerbForm=Part" lemma="stellen">gesteld</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w145" msd="UPosTag=AUX|Number=Sing|Tense=Past|VerbForm=Fin" lemma="worden">werd</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w146" msd="UPosTag=SCONJ" lemma="dat">dat</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w147" msd="UPosTag=ADP" lemma="door">door</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w148" msd="UPosTag=DET|Definite=Def" lemma="de">de</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w149" msd="UPosTag=NOUN|Gender=Com|Number=Sing" lemma="afschaffing">afschaffing</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w150" msd="UPosTag=ADP" lemma="van">van</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w151" msd="UPosTag=DET|Definite=Def" lemma="de">de</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w152" msd="UPosTag=NOUN|Gender=Com|Number=Sing" lemma="slavernij">slavernij</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w153" msd="UPosTag=DET|Definite=Def" lemma="de">de</w>
                     <name type="MISC">
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w154" msd="UPosTag=ADJ|Degree=Pos" lemma="Amerikaans">Amerikaanse</w>
                     </name>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w155" msd="UPosTag=NOUN|Gender=Com|Number=Sing" lemma="productie">productie</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w156" msd="UPosTag=ADP" lemma="van">van</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w157" msd="UPosTag=NOUN|Gender=Neut|Number=Sing" lemma="katoen">katoen</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w158" msd="UPosTag=AUX|Number=Sing|Tense=Past|VerbForm=Fin" lemma="zullen">zou</w>
<w xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.w159" join="right" msd="UPosTag=VERB|VerbForm=Inf" lemma="teruglopen">teruglopen</w>
<pc xml:id="ParlaMint-NL_2017-01-31-tweedekamer-23.pc20" msd="UPosTag=PUNCT">.</pc>
</s>
"""


def test_multiple_annotations():
    soup = BeautifulSoup(xml_multiple_annotations, 'xml')
    annotations = soup.find_all("name")
    annotated_text = [format_annotated_text(annotation) for annotation in annotations]
    assert (
        " ".join(annotated_text)
        == "Al in 1804 gebruikte wetenschapper [Alexander von Humboldt](PER) het brede welvaartsargument toen gesteld werd dat door de afschaffing van de slavernij de [Amerikaanse](MISC) productie van katoen zou teruglopen."
    )
