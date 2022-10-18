from addcorpus.load_corpus import load_corpus
import ianalyzer.config_fallback as config
from ianalyzer.factories.app import flask_app
import pytest
import os.path as op
here = op.abspath(op.dirname(__file__))


class UnittestConfig:
    SECRET_KEY = b'dd5520c21ee49d64e7f78d3220b2be1dde4eb4a0933c8baf'
    SQLALCHEMY_DATABASE_URI = 'sqlite://'  # in-memory
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DEBUG = True
    TESTING = True
    CORPORA = {
        'rechtspraak': op.join(here, 'rechtspraak.py')
    }

    SERVERS = {
        'default': config.SERVERS['default']
    }
    CORPUS_SERVER_NAMES = {
        'rechtspraak': 'default'
    }

    RECHTSPRAAK_DATA = op.join(here, 'tests', 'data')
    RECHTSPRAAK_IMAGE = 'troon.jpg'
    RECHTSPRAAK_ES_INDEX = 'rechtspraak'
    RECHTSPRAAK_ES_DOCTYPE = 'article'

    # ?? apparantly needed to not crash
    SAML_FOLDER = "saml"
    SAML_SOLISID_KEY = "uuShortID"
    SAML_MAIL_KEY = "mail"


@pytest.fixture(scope='session')
def test_app(request):
    """ Provide an instance of the application with Flask's test_client. """
    app = flask_app(UnittestConfig)
    app.testing = True

    with app.app_context():
        yield app


@pytest.fixture
def test_corpus(test_app):
    return load_corpus('rechtspraak')


@pytest.fixture
def corpus_test_data():
    return {
        'name': 'rechtspraak',
        'docs': [
            {
                'id': 'ECLI:NL:CBB:2022:1',
                'issued': '2022-01-07',
                'date': '2022-01-11',
                'publisher': 'Raad voor de Rechtspraak',
                'creator': 'College van Beroep voor het bedrijfsleven',
                'zaaknr': '20/1063',
                'type': 'Uitspraak',
                'procedure': 'Eerste aanleg - meervoudig',
                'spatial': 'Den Haag',
                'subject': 'Bestuursrecht',
                'title': 'ECLI:NL:CBB:2022:1 College van Beroep voor het bedrijfsleven , 11-01-2022 / 20/1063',
                'abstract': 'Artikel 2:3, eerste lid, van de Algemene wet bestuursrecht artikel 4.5.12, eerste lid, aanhef en onder f, van de Regeling nationale EZ-subsidies\nHet College acht het aannemelijk dat appellant de bedoeling heeft gehad om ISDE subsidie voor een warmtepomp aan te vragen. Uit de aanvraag hadden de beoordelaars van SEEH-aanvragen kunnen afleiden dat appellant niet alleen voor vloer- en gevelisolatie en een aantal aanvullende energiebesparende maatregelen subsidie wilde aanvragen, maar ook voor een warmtepomp. Het lag daarom op de weg van de beoordelaars van SEEH-aanvragen om niet alleen een beoordeling op grond van de SEEH te doen, maar ook de aanvraag op grond van artikel 2:3, eerste lid, van de Awb onmiddellijk door te sturen naar de beoordelaars van ISDE-aanvragen. Het kan appellant in dit geval niet worden tegengeworpen dat zijn ISDE-aanvraag te laat bij verweerder is ingediend. Verweerder moet de ISDE-aanvraag dan ook opnieuw in behandeling nemen, uitgaande van de datum van indiening van de SEEH-aanvraag.',
                'content': 'uitspraak \nCOLLEGE VAN BEROEP VOOR HET BEDRIJFSLEVEN\nZaaknummer: 20/1063\nuitspraak van de meervoudige kamer van 11 januari 2022 in de zaak tussen\n [naam 1] , te [woonplaats] , appellant,\nen\nde minister van Economische Zaken en Klimaat, verweerder (gemachtigde: mr. M. Wullink).\nProcesverloop \nBij besluit van 2 oktober 2020 (het primaire besluit) heeft verweerder beslist op de aanvraag van appellant om een investeringssubsidie duurzame energie (ISDE) voor een warmtepomp in het kader van de Regeling nationale EZ-subsidies (Regeling).\nBij besluit van 2 november 2020 (het bestreden besluit) heeft verweerder het bezwaar tegen het primaire besluit ongegrond verklaard en het primaire besluit gehandhaafd. \nAppellant heeft tegen het bestreden besluit beroep ingesteld. \nVerweerder heeft een verweerschrift ingediend.\nHet onderzoek ter zitting heeft plaatsgevonden op 17 augustus 2021. Appellant is verschenen, vergezeld door [naam 2] . Verweerder heeft zich laten vertegenwoordigen door zijn gemachtigde. \nHet College heeft het onderzoek heropend en verweerder gevraagd om nadere stukken in te dienen.\nBij brief van 4 oktober 2021 heeft verweerder nadere stukken ingediend.\nBij brief van 20 oktober 2021 heeft het College verweerder verzocht zijn standpunt nader toe te lichten.\nBij brief van 29 oktober 2021 heeft verweerder zijn standpunt nader toegelicht.\nNadat, desgevraagd, geen van de partijen heeft verklaard gebruik te willen maken van het recht om te worden gehoord op een nadere zitting, heeft het College het onderzoek gesloten. \nOverwegingen \n1.1 Appellant heeft op 10 mei 2020 een aanvraag ingediend voor subsidie op grond van de Subsidieregeling energiebesparing eigen huis (SEEH) bij de minister van Binnenlandse Zaken en Koninkrijkrelaties (BZK). In de aanvraag heeft appellant vloer- en gevelisolatie, een energiedisplay en het waterzijdig inregelen verwarmingssysteem als energiebesparende maatregelen opgegeven. Appellant heeft als bijlage bij het aanvraagformulier foto’s van een warmtepomp, een thermostaat, slimme thermostaatknoppen, vloer- en muurisolatie en een energielabel van de warmtepomp gevoegd. Daarnaast heeft appellant als bijlage de kostenraming voor de gehele verbouwing, de factuur voor een warmtepomp en de productkenmerken van een warmtepomp toegevoegd. Op 12 augustus 2020 en 27 augustus 2020 heeft een medewerker van de Rijksdienst voor Ondernemend Nederland (RVO) om nadere informatie gevraagd. Op 27 augustus 2020 en 31 augustus 2020 heeft appellant de benodigde informatie verschaft en gemeld dat het hem vooral ging om een subsidie voor een warmtepomp. Bij e-mail van 2 september 2020 heeft de betreffende medewerker van RVO aan appellant medegedeeld dat onder de SEEH geen subsidie kan worden aangevraagd voor een warmtepomp en dat appellant voor de overige energiebesparende maatregelen ook niet in aanmerking komt voor een subsidie omdat niet aan alle vereisten voor de SEEH wordt voldaan. Appellant is erop gewezen dat hij voor de warmtepomp gebruik kan maken van de ISDE op grond van titel 4.5 van de Regeling. De minister van BZK heeft bij besluit van 8 september 2020 aan appellant meegedeeld dat hij niet in aanmerking komt voor SEEH-subsidie. \n1.2 In navolging van het e-mailbericht van 2 september 2020 van RVO heeft appellant op 5 september 2020 een ISDE-aanvraag ingediend bij verweerder. Als datum van ingebruikname van de warmtepomp heeft appellant 6 februari 2020 ingevuld. \n1.3 Bij het primaire besluit, dat is gehandhaafd bij het bestreden besluit, heeft verweerder de aanvraag van 5 september 2020 met toepassing van artikel 4.5.12, eerste lid, aanhef en onder f, van de Regeling afgewezen omdat deze niet binnen zes maanden na het installeren van de warmtepomp, te weten uiterlijk 6 augustus 2020, is ingediend.\n2. Appellant voert, samengevat, in beroep aan dat het hem niet kan worden aangerekend dat hij de aanvraag voor de ISDE te laat heeft ingediend. Hij heeft die aanvraag pas op 5 september 2020 ingediend, omdat hij ervan uitging dat hij op grond van de al op 10 mei 2020 ingediende aanvraag voor de SEEH aanspraak kon maken op een subsidie voor de warmtepomp. Appellant werd gesterkt in zijn vertrouwen doordat hij na de indiening van de aanvraag voor de SEEH telefonisch de bevestiging van verweerder kreeg dat hij het aanvraagformulier goed had ingevuld voor de aanvraag van een subsidie voor een warmtepomp. Volgens appellant werd op de website van verweerder geen duidelijk onderscheid gemaakt tussen de SEEH en de ISDE. Pas na het e-mailbericht van 2 september 2020 werd het voor appellant duidelijk dat hij de verkeerde subsidieaanvraag had ingediend. Appellant rekent het de minister van BZK aan dat hij de aanvraag voor de SEEH niet heeft opgevat als een aanvraag in het kader van de ISDE. Volgens appellant had zijn aanvraag intern moeten worden doorgestuurd naar de juiste afdeling. Verder voert appellant aan dat door de niet adequate handelswijze zoveel vertraging is opgelopen dat hij niet meer in staat was om de achteraf gebleken onjuiste aanvraag te herstellen. Appellant voelt zich benadeeld door de trage handelswijze van verweerder. Hij vindt het bovendien onrechtvaardig dat hij wordt afgerekend op een te late indiening van de aanvraag terwijl het verweerder niet wordt aangerekend dat er laat is beslist op de aanvraag. \n3. Verweerder stelt zich op het standpunt dat hij de ISDE-aanvraag terecht heeft afgewezen. De SEEH en de ISDE zijn verschillende regelingen. De SEEH ziet met name op subsidies voor isolatiemaatregelen in particuliere woningen, terwijl de ISDE ziet op het aanbrengen van technische installaties. De regelingen hebben een eigen beoordelingskader en het uitvoerende bestuursorgaan verschilt. Verweerder is verantwoordelijk voor de ISDE en de minister van BZK is verantwoordelijk voor de SEEH. Het is de verantwoordelijkheid van de aanvrager om zich te verdiepen in de vereisten en voorwaarden die horen bij de regeling waarvoor hij subsidie wil aanvragen. Uit de aanvraag van 10 mei 2020 blijkt dat appellant subsidie heeft aangevraagd voor vloer- en gevelisolatie en een aantal aanvullende energiebesparende maatregelen. Verweerder heeft het door appellant ingevulde en ingediende aanvraagformulier als uitgangspunt gehanteerd bij de beoordeling van de aanvraag. Verweerder stelt dat, gezien de vragen die in het aanvraagformulier worden gesteld en de wijze waarop het SEEH-formulier is ingevuld, duidelijk had kunnen zijn voor appellant dat hij geen subsidieaanvraag deed voor een warmtepomp. Voor de medewerkers van de minister van BZK hoefden de wijze waarop het SEEH-formulier is ingevuld en de bijlages die appellant heeft toegevoegd ook geen vragen op te roepen. Pas in de reactie (op 27 augustus 2020) op de gevraagde nadere informatie over de SEEH-aanvraag maakte appellant expliciet kenbaar dat hij een subsidie wilde aanvragen voor een warmtepomp. De medewerkers van de minister van BZK konden er dus niet eerder dan 27 augustus 2020 op bedacht zijn dat het appellant ging om de warmtepomp en niet om de andere energiebesparende maatregelen. \nOp dat moment was de termijn van zes maanden na de installatie uit de ISDE al verstreken. Voor de ISDE-aanvraag geldt dat op grond van artikel 4.5.12, eerste lid, aanhef en onder f, van de Regeling, dwingend is voorgeschreven dat een te laat ingediende aanvraag om subsidie moet worden afgewezen. De Regeling bevat geen hardheidsclausule en biedt verweerder dus geen ruimte voor een belangenafweging als bedoeld in artikel 3:4, eerste lid, van de Algemene wet bestuursrecht (Awb). Verweerder was daarom gehouden de aanvraag van appellant af te wijzen. \n4. Aritkel 2:3, eerste lid van de Awb, luidt als volgt: \nHet bestuursorgaan zendt geschriften tot behandeling waarvan kennelijk een ander bestuursorgaan bevoegd is, onverwijld door naar dat orgaan, onder gelijktijdige mededeling daarvan aan de afzender.\n5. Anders dan verweerder acht het College het aannemelijk dat appellant kennelijk ook de bedoeling heeft gehad om subsidie voor een warmtepomp aan te vragen. De bijlagen die appellant bij de SEEH-aanvraag heeft meegestuurd, zien vrijwel allemaal op een warmtepomp. Uit de aanvraag hadden de beoordelaars van SEEH-aanvragen kunnen afleiden dat appellant niet alleen voor vloer- en gevelisolatie en een aantal aanvullende energiebesparende maatregelen subsidie wilde aanvragen, maar ook voor een warmtepomp. Het lag daarom op de weg van de beoordelaars van SEEH-aanvragen om niet alleen een beoordeling op grond van de SEEH te doen, maar ook – eventueel na het stellen van nadere vragen aan appellant – de aanvraag op grond van artikel 2:3, eerste lid, van de Awb onmiddellijk door te sturen naar de beoordelaars van ISDE-aanvragen. Dat de SEEH en de ISDE aan verschillende bestuursorganen zijn opgedragen, zoals verweerder naar voren brengt, maakt het voorgaande, gelet op het bepaalde in artikel 2:3, eerste lid, van de Awb, niet anders. Daar komt nog bij dat de beide regelingen feitelijk worden uitgevoerd door RVO.\nHet College stelt vast dat de aanvraag niet is doorgezonden en dat pas in augustus, toen de termijn voor de ISDE op grond van artikel 4.5.12, eerste lid, aanhef en onder f, van de Regeling al was verstreken, door de beoordelaar van de SEEH-aanvraag nadere vragen aan appellant zijn gesteld over zijn aanvraag. Appellant heeft die vragen direct beantwoord. \nOnder deze omstandigheden kan appellant niet worden tegengeworpen dat zijn ISDE-aanvraag te laat bij verweerder is ingediend. Verweerder moet de ISDE-aanvraag dan ook opnieuw in behandeling nemen, uitgaande van de datum van indiening van de SEEH-aanvraag. \n6. Het beroep is gegrond en het College vernietigt het bestreden besluit. Het College ziet geen aanleiding zelf in de zaak te voorzien, omdat het aan verweerder is om op de aanvraag te beslissen en de hoogte van de subsidie vast te stellen. Verweerder zal daarom een nieuw besluit moeten nemen met inachtneming van deze uitspraak. Het College stelt hiervoor een termijn van zes weken. \n7. Voor een veroordeling in de proceskosten is geen aanleiding, omdat niet is gebleken van te vergoeden proceskosten.\nBeslissing\nHet College:\n- verklaart het beroep gegrond; - vernietigt het bestreden besluit; - draagt verweerder op binnen 6 weken na de dag van verzending van deze uitspraak een nieuw besluit te nemen op het bezwaar met inachtneming van deze uitspraak; - draagt verweerder op het betaalde griffierecht van € 178,- aan appellant te vergoeden.\nDeze uitspraak is gedaan door mr. J.H. de Wildt, mr. M. van Duuren en mr. B. Bastein, in aanwezigheid van mr. N.C.H. Vrijsen, griffier. De beslissing is in het openbaar uitgesproken op 11 januari 2022.\nDe voorzitter en de griffier zijn niet in de gelegenheid de uitspraak te ondertekenen.'
            }],
    }
