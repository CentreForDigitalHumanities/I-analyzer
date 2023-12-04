# Making a release

This is a quick checklist for developers.

It's recommended that you use [git-flow to make releases](https://danielkummer.github.io/git-flow-cheatsheet/#release), but it's not technically required.

## Check if we are release-ready

Check if anything ought to be included with the new release:

- Check [open pull requests](https://github.com/UUDigitalHumanitieslab/I-analyzer/pulls)
- Check [issues labelled "bug"](https://github.com/UUDigitalHumanitieslab/I-analyzer/issues?q=is%3Aissue+is%3Aopen+label%3Abug)
- Check project boards that keep track of a release cycle. If issues or PRs are scheduled for this release, wait until they are closed or move them to the next release cycle.

## Make a release branch

Determine if your release is a major, minor, or patch release to figure out the version number.

Start a new branch for your releases. Use `git flow release start x.x.x` or `git flow hotfix start x.x.x`.

Update the version number in `package.json` and `CITATION.cff`

## Check if everything works

In your local environment, start up elasticsearch and run backend tests with `yarn test-back`. Run frontend tests with `yarn test-front`.

Publish the release branch with `git flow release publish x.x.x`. Deploy on the test or acc server. Check that everything works as intended.

## Publish the release

Make a tag for your release and merge it into `develop` and `master`. You can do all this withh `git flow release finish x.x.x`. Push the tag and the changes to develop and master.

## Write release notes

Create a release on the github repository based on the tag, and write release notes. A list of pull requests is sufficient, but when possible, give each PR a description that is comprehensible for users or outsiders.

## Deploy on production

Deploy the `master` branch on the production server.
