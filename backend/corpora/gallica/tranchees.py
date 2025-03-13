from datetime import datetime

from django.conf import settings

from corpora.gallica.gallica import Gallica

class Tranchees(Gallica):
    title = "Journaux de tranchées"
    description = "Publications distributed in the trenches of World War 1"
    min_date = datetime(year=1914, month=1, day=1)
    max_date = datetime(year=1954, month=12, day=31)
    publication_ids = [
        "cb32735055z", # Cafard muselé
        "cb32736738j", # Le Camouflet
        "cb327369759", # Le Canard du biffin
        "cb32736976n", # Le Canard du boyau
        "cb32737002v", # Le Canard poilu
        "cb327404552", # Le Chat pelottant
        "cb34384155m", # Le Crapouillot
        "cb32752343g", # Le Cri de ralliement des Gromort
        "cb44415603t", # La Colonne double
        "cb32754250z", # De la lumière
        "cb327615837", # L'Écho des guitounes
        "cb327619882", # L'Écho du boyau
        "cb32715529c", # La Bourguignotte
        "cb32715529c", # Le Filon (Blois)
        "cb32775728t", # Flambeau
        "cb32775703g", # Le Flambeau
        "cb32775703g", # La Fourragère
        "cb32778911c", # Le Front
        "cb32779223p", # La Fusée à retards
        "cb32779220n", # La Fusée: journal anti-boche
        "cb327803261", # Gazette de l'Académie Julian
        "cb327803470", # Gazette de l'Atelier André
        "cb32780348b", # Gazette de l'Aterlier Bernier
        "cb32780349p", # Gazette de l'Atelier Defrasse
        "cb327803579", # Gazette de l'École régionale
        "cb32780350w", # Gazette de l'Atelier Héraud
        "cb327813028", # Gazette de l'Atelier Laloux
        "cb327803517", # Gazette de l'Atelier Lambert
        "cb32780358n", # Gazette de l'Écoke des Beaux-Arts
        "cb32780494s", # Gazette de Lemar
        "cb32780668s", # Gazette Deglane
        "cb32780698q" # Gazette des arts déco
        "cb43639008g" # Gazette des classes de composition
        "cb32780766c" # Gazette des Cormon, Collin, Flameng
        "cb42750804k", # La Gazette des JPL
        "cb32781243k", # Gazette Godefroy-Freynet
        "cb32781466s", # Gazette Pauline
        "cb32781583n", # Gazette Woillez de la Bouglise
        "cb32783911c", # La Greffe générale
        "cb444156285", # La Gazette de nos Poilus
        "cb32787828s", # Hurle obus
        "cb327882825", # Les idées noires
        "cb32803692w", # Le Klaxon
        "cb32804817x", # La Lacrymogène
        "cb32809265b", # Le Looping
        "cb32811709h", # Marmita
        "cb38688428k", # La Marmite
        "cb42429408w", # Le Marsouin du 53e
        "cb32817015z", # La Mitraille (Nancy)
        "cb32821051k", # La Musette (Toulouse)
        "cb32823952w", # Le Nonante
        "cb32824500s", # Nos filleuls
        "cb32808132v", # Le Lion d'Arras
        "cb32796106h", # Les Jeunes patriotes
        "cb32824610c", # Nos tanks
        "cb444157409", # Jaussely's gazette
        "cb444157064", # Journal des soldats du "Choral moderne"
        "cb328350287", # Le Pépère
        "cb32835057t", # Le Perco
        "cb328352410", # Le Périscope
        "cb328406026", # Le Poilu sans poil
        "cb32836282t", # Le Petit écho du 21e
        "cb328362835", # Le "Petit écho" en campagne
        "cb32840414n", # Le Plus-que-Torial
        "cb32840486h", # Le Poilu du 37
        "cb32840582d", # Le Poilu marmité
        "cb32840601v", # Le Poilu st-émilionnais
        "cb44415720p", # Le Poilu du Petit Parisie
        "cb38688438w", # Le Panseur
        "cb328405216", # Le Poilu (Châlons-sur-Marne)
        "cb32840513k", # Le Poil civil
        "cb328465460", # Le Quatrième vitrier
        "cb32848663b", # Le Rayon
        "cb32849865t", # Le Redon
        "cb328638993", # Le Sac à terre
        "cb328709646", # Le Son du cor
        "cb328713356", # Le Souvenir
        "cb328637943", # L'S. P... rance : journal gai
        "cb328764559", # Télé-mail
        "cb32876691q", # Le Temps buté
        "cb32879433q", # Le Trait d'union
        "cb444157618", # La Trompette des marécage
    ]
    category = "periodical"
    es_index = getattr(settings, 'TRANCHEES_INDEX', 'tranchees')
    image = "resistance.jpg"
