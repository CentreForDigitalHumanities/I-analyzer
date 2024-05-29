# I-analyzer

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.8064133.svg)](https://doi.org/10.5281/zenodo.8064133)
[![Actions Status](https://github.com/UUDigitalHumanitiesLab/I-analyzer/workflows/Unit%20tests/badge.svg)](https://github.com/UUDigitalHumanitiesLab/I-analyzer/actions)

> "The great text mining tool that obviates all others."
> — Julian Gonggrijp

I-analyzer is a web application for exploring corpora (large collections of texts). You can use I-analyzer to find relevant documents, or to make visualisations to understand broader trends in the corpus. The interface is designed to be accessible for users of all skill levels.

I-analyzer is primarily intended for academic research and higher education. We focus on data that is relevant for the humanities, but we are open to datasets that are relevant for other fields.

Editing this README to test if this triggers an action.

## Contents

This repository contains the source code for the I-analyzer web application, which consists of a Django backend and Angular frontend.

For corpora included in I-analyzer, the backend includes a definition file that specifies how to read the source files, and how this data should be structured and presented in I-analyzer. This repository does _not_ include the source data itself, beyond a few sample files for testing.

## Usage

If you are interested in using I-analyzer, the most straightforward way to get started is to make an account at [ianalyzer.hum.uu.nl](https://ianalyzer.hum.uu.nl/). This server is maintained by the Research Software Lab and contains corpora focused on a variety of fields. We also maintain more specialised collections at [PEACE portal](https://peace.sites.uu.nl/epigraphy/search/) and [People & Parliament  (not publicly accessible)](https://people-and-parliament.hum.uu.nl/).

I-analyzer does not have an "upload data" option (yet!). If you are interested in using I-analyzer as a way to publish your dataset, or to make it easier to search and analyse, you can go about this two ways:

- Contact us (see below for details) about hosting your dataset on one of our existing servers, or hosting a new server for your project.
- Self-host I-analyzer. This would allow you to maintain full control over the data and who can access it. I-analyzer is open source software, so you are free to host it yourself, either as-is or with your own modifications. However, feel free to contact us with any questions or issues.

## Development

The [documentation directory](./documentation/) contains documentation for developers. This includes [installation instructions](./documentation/First-time-setup.md) to set up an I-analyzer server.

## Licence

I-analyzer is shared under an MIT licence. See [LICENSE](./LICENSE) for more information.

## Citation

If you wish to cite this repository, please use the metadata provided in our [CITATION.cff file](./CITATION.cff).

If you wish to cite material that you accessed through I-analyzer, or you are not sure if you should also be citing this repository, please refer to the [citation instructions in the user manual](./frontend/src/assets/manual/en-GB/citation.md).

## Contact

For questions, small feature suggestions, and bug reports, feel free to [create an issue](https://github.com/UUDigitalHumanitieslab/I-analyzer/issues/new/choose). If you don't have a Github account, you can also [contact the Centre for Digital Humanities](https://cdh.uu.nl/contact/).

If you want to add a new corpus to I-analyzer, or have an idea for a project, please [contact the Centre for Digital Humanities](https://cdh.uu.nl/contact/) rather than making an issue, so we can discuss the possibilities with you.

