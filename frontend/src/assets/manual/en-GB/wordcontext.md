Like the [related words graph](/manual/relatedwords), the word context graph shows words that appear in similar contexts to the query term. Instead of showing the similarity with the query term, the graph shows the neighbouring words as a two-dimensional scatter plot, showing how close the terms are to each other.

This visualisation can help to visualise the relationships between terms. However, while the related words and word similarity graphs show the actual cosine similarities in the model, the distances between words in the scatter plot are an _approximation_ of the distances in the real model. They may not be accurate.

The graph displays the results per time interval. Use the slider below the graph to choose the time interval you want to see.

## Options

You can specify the number of neighbours to include for your query term(s). These are the same nearest neighbours you can see in the related words graph.

In addition, you can add additional query terms to the graph. In this graph, there is no difference between searching for _bike_ and adding _car_ as a comparison term, or searching for _car_ and adding _bike_. Both will be included in the plot, with their nearest neighbours.

For example, if you search for _bike_ with the 5 nearest neighbours, and then add _car_ as an additional term, the graph will include the 5 nearest neighbours of _bike_, as well as the 5 nearest neighbours of _car_. Note: it is possible that these neighbours overlap; for example, _tram_ may be a neighbour of both _bike_ and _car_. In that case, you may see fewer terms than you expect.

Note that if you want to compare several terms, you can also set the number of neighbours to 0; in that case, you will only see the terms you entered yourself.

The graph will only show terms if they appeared in that interval. This included your query term(s). This means that not all query terms may appear in each time interval. The graph can even be entirely empty, if none of your query terms were sufficiently frequent in each interval.

## Analysis

For each time interval, the graph selects the nearest neighbours to the query term(s). It then uses [principal component analysis](https://en.wikipedia.org/wiki/Principal_component_analysis) to map the selected terms onto a two-dimensional plot. After this, the 2D map for each timeframe is rotated so it best aligns with the previous timeframe. The optimal angle is determined using [Nelder-Mead optimisation](https://en.wikipedia.org/wiki/Nelder%E2%80%93Mead_method).
