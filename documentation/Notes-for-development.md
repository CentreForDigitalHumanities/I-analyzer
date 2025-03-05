# Notes for development

## Python package management

Install `pip-tools` in your virtualenv. Run `pip-sync` or `pip install -r backend/requirements.txt` in order to install all Python package dependencies. If you want to add a new package dependency, take the following steps:

 1. Add the package *without version number* to `backend/requirements.in`,
 2. Run `pip-compile backend/requirements.in` (you can just `pip-compile` if you `cd backend` first). This will update the `backend/requirements.txt` with a pinned version that cooperates well with the other packages.
 3. Commit the changes to `backend/requirements.{in,txt}` at the same time.

The above steps do not actually install the package; you can do this at any stage using `pip install` or afterwards using `pip-sync`.


## Testing

### Backend

Backend tests exist in the `backend` directory. They are typically located in a `tests` subdirectory of the package they apply to. Run tests by calling `pytest` (or `python -m pytest`) from `/backend`. Assess code coverage by running `coverage run --m py.test && coverage report`.

When writing new backend tests, you can use the fixtures in the `conftest.py` for the package. [`backend/conftest.py`](../backend/conftest.py) defines fixtures for the whole project, include some that are used automatically.

For example, the project conftest defines an `auth_user` fixture that creates a user account; this is widely used to test authentication and user data. The [conftest for the `tag` app](../backend/tag/conftest.py) includes a fixture `auth_user_tag` that creates a tag for the user, which is a useful starting point for many of the tests in this app, but not used elsewhere in the project.

Some backend tests require Elasticsearch. If the backend cannot connect to Elasticsearch during testing, these tests will be skipped. (So if you see a lot of skipped tests in the test output, it's because Elasticsearch isn't available.)

### Frontend

Tests are also available for the `frontend`, they should be run from that directory using Angular. Frontend tests can be run with `yarn test-front`.
