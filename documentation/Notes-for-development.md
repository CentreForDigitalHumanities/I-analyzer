# Notes for development

## Python package management

Install `pip-tools` in your virtualenv. Run `pip-sync` or `pip install -r backend/requirements.txt` in order to install all Python package dependencies. If you want to add a new package dependency, take the following steps:

 1. Add the package *without version number* to `backend/requirements.in`,
 2. Run `pip-compile backend/requirements.in` (you can just `pip-compile` if you `cd backend` first). This will update the `backend/requirements.txt` with a pinned version that cooperates well with the other packages.
 3. Commit the changes to `backend/requirements.{in,txt}` at the same time.

The above steps do not actually install the package; you can do this at any stage using `pip install` or afterwards using `pip-sync`.


## Testing

Backend tests exist in the `backend` directory. They are typically located in a `tests` subdirectory of the module they apply to. Run tests by calling `pytest` (or `python -m pytest`) from `/backend`. Assess code coverage by running `coverage run --m py.test && coverage report`.

When writing new backend tests, you can use the fixtures in the `conftest.py` for the module. For example, in the `api` module, you can do the following in order to test a view.

```py
def test_some_view(client):
    response = client.get('/some/route')
    assert response.status_code == 200
    # etcetera
```

For further details, consult the source code in `conftest.py` of the module.

Tests are also available for the `frontend`, they should be run from that directory using Angular. Frontend tests can be run with `yarn test-front`.
