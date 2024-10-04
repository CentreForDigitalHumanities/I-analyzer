import requests

from addcorpus.python_corpora.corpus import XMLCorpusDefinition

class Gallica(XMLCorpusDefinition):

    def sources():
        # obtain list of ark numbers
        ark_numbers = []
        for ark in ark_numbers:
            text = requests.get("https://gallica.bnf.fr/ark:/12148/{ark}.texteBrut")
            metadata = requests.get(
                "https://gallica.bnf.fr/services/OAIRecord?ark={ark}"
            )
