Beste Lezer,

Zoals bekend, is de database waar I-analyzer mee werkt, georganiseerd met Elasticsearch. Om daarin te zoeken, is het nodig termen en operatoren te gebruiken, die Elasticsearch “begrijpt”. Hiervoor is de simple query string query handleiding van Elasticsearch geadviseerd. Die vind je hier: https://www.elastic.co/guide/en/elasticsearch/reference/5.5/query-dsl-simple-query-string-query.html

Het is een goed idee om deze handleiding bij de hand te houden als je met I-analyzer in zijn huidige vorm aan de gang gaat en hem regelmatig te raadplegen. Let wel: niet alles wat in de handleiding wordt genoemd is ook mogelijk. Soms hebben we dingen niet “aan” gezet, die theoretisch wel zouden kunnen. 

Hier volgen de belangrijkste punten uit die handleiding. Tevens heb ik aan het eind van dit document een tabel toegevoegd die demonstreert wat de operatoren voor effect hebben op de aantallen treffers.

# Simple Query string syntax

Deze zoekmethode ondersteunt de volgende functies:

| Functie | Beschrijving |
|:---:| --- |
| `+` | staat voor AND (bank AND kapitaal) |
| &#124; | staat voor OR (bank OR kapitaal) |
| `-` | betekent bevat niet (niet kapitaal) |
| `"` | maakt het mogelijk op een complete phrase tegelijk te zoeken “het kapitaal van de bank” |
| `*` | is alleen toegestaan na een aantal andere karakters en is een wildcard voor een aantal letters (`kapit*` is toegestaan `*kapit` niet) |
| `~N` | na een woord betekent woord + willekeurige letters (fuzziness), geef hier het aantal willekeurige letters dat anders mag zijn. Dus `bank~1` zoekt ook balk, blak, dank enz. |
| `~N` | na een frase van enkele woorden geeft aan hoeveel woorden anders mogen zijn |

Tekens zoals `|` en `+`, zijn gereserveerde karakters. Wilt u zoeken op woorden die juist zulke tekens bevatten, dan moet het teken worden voorafgegaan door \.

De zoekfunctie staat default ingesteld op `OR`. Dat betekent dat als u intypt: `Plaat Fiets`, er wordt gezocht op of documenten die `Plaat` of documenten die `Fiets` bevatten. Dit heeft ook consequenties voor de `–`functie. `Plaat Fiets –Tafel` wordt: documenten die `Plaat` bevatten of documenten die `Fiets` bevatten of documenten die niet het woord `Tafel` bevatten. 

## Pas op de spatie
Een spatie kan ook een speciaal teken zijn. Soms (ik heb bij de jaarverslagen nog niet ontdekt wanneer), kan een escape dus `\` voor de spatie nodig zijn.

### Voorbeelden van zoekresultaten

> Vraag: termen kapitaal en bank in alle velden in verschillende combinaties

| Zoekterm | Treffers |
| --- | --- |
| `kapitaal` | 568 treffers |
| `bank` | 76161 treffers |
| `bank  +kapitaal` |		256 treffers  (bank EN kapitaal)|
| `+bank +kapitaal` |		256 treffers (EN bank En kapitaal)|
| `+bank +-kapitaal` |	75905 treffers (bank en niet kapitaal ofwel documenten waar bank wel in voorkomt en documenten waar kapitaal niet in voorkomt) |
| `+-bank+kapitaal`|		312 treffers (niet bank maar wel kapitaal) |
| `"kapitaal van de bank"` |	2 treffers|
| `kapitaal deposito` |		632 treffers|
| `kapitaaldeposito`|  		2 treffers|
| `+kapitaal +deposito`|		27 treffers|
| `kapitaaldeposito~1` |		2 treffers|
| `kapitaaldeposito~2` |	4 treffers waarvan 2 maal kapitaaldeposito’s (2 tekens verschil) |
| `kapit*`|			910 treffers |
| `*kapit` |				There were no results to your query. |
| `bank~1` | 			76241 treffers (vergelijk met bank hiervoor) | 
| `"de bank is"` |  			24 treffers |
| `"de bank is" ~1`|		32 treffers  |

Er wordt standaard in alle velden gezocht. Wil je dat niet, dan geef je eerst een veldnaam op. Bijvoorbeeld `year:` of `content:`

In sommige gevallen is het duidelijk waarom de verschillen in zoekresultaten optreden. Maar soms zijn de oorzaken van de verschillen niet zo voor de hand liggend. Dan vind je hopelijk wat hulp in de bovenstaande handleiding. 

Veel succes!
