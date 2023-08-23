from selenium.webdriver.common.by import By

def test_title(browser, base_address):
    browser.get(base_address)
    assert 'I-Analyzer' in browser.title

def test_admin(browser, admin_address):
    browser.get(admin_address)
    assert 'Django' in browser.title

def test_login(browser, login_address):
    browser.get(login_address)
    login_element = browser.find_element(By.CLASS_NAME, 'is-login')
    assert login_element

def test_search(browser, search_address):
    browser.get(search_address)
    title = browser.find_element(By.CLASS_NAME, 'title-section')
    assert 'Search' in title
