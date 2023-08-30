# Functional test suite
Functional tests are located in the folder `functional-tests`.

To run functional tests, make sure you have Selenium and Seleniumbase installed (from backend requirements). Also, create an .ini file in the `functional-tests` folder, which should have the following setup:
```
[credentials]
    username = {your_username}
    password = {your_password}

[corpus]
    name = {name_of_corpus_your_user_can_access}
    field = {multiple_choice_filter_field_name}
    first_option = {first_option_of_that_field}
    query = {query_term}
```

Note that in order for all tests to work, the corpus should also have associated *word models*

To run tests, navigate to the `functional-tests` folder and run `pytest --rs`. `--rs` stands for "reuse session" so after the view that tests logging in, the browser stays logged in. Other potential arguments:
```
--headless
--firefox
--safari
--edge
```