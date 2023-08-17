import time

from selenium.webdriver.common.by import By

USERNAME = 'login'
PASSWORD = 'supersecret'

def test_title(browser, base_address):
    browser.get(base_address)
    assert 'I-Analyzer' in browser.title

def test_admin(browser, admin_address):
    browser.get(admin_address)
    assert 'Django' in browser.title

def test_login(browser, login_address):
    browser.get(login_address)
    assert 'I-Analyzer' in browser.title
    time.sleep(1)
    username_input = browser.find_element(By.NAME, 'username')
    password_input = browser.find_element(By.NAME, 'password')
    submit_button = browser.find_element(By.CLASS_NAME, 'button')
    username_input.send_keys(USERNAME)
    password_input.send_keys(PASSWORD)
    submit_button.click()
    time.sleep(8)
    assert 'Home' in browser.title

def test_search(browser, login_address, search_address):
    login(browser, login_address)
    browser.get(search_address)
    time.sleep(9)
    title = browser.find_element(By.CLASS_NAME, 'title')
    assert 'Search' in title.text
    browser.find_element(By.ID, 'role').click()
    browser.find_elements(By.TAG_NAME, 'li')[0].click()
    time.sleep(3)
    assert browser.current_url == search_address + '?role=Interjection'

def test_visualization(browser, login_address, search_address):
    login(browser, login_address)
    browser.get(search_address)
    time.sleep(9)
    browser.find_element(By.ID, 'tab-visualizations').click()
    time.sleep(2)
    browser.find_element(By.CLASS_NAME, 'dropdown-trigger').click()
    browser.find_elements(By.CLASS_NAME, 'dropdown-item')[1].click()
    time.sleep(1)
    assert 'wordcloud' in browser.current_url
    browser.refresh()
    time.sleep(1)
    # TODO: fix bug which resets visualizations to first menu item upon reload
    assert 'wordcloud' in browser.current_url

def test_word_models(browser, login_address, wordmodels_address):
    login(browser, login_address)
    browser.get(wordmodels_address)
    time.sleep(8)
    title = browser.find_element(By.CLASS_NAME, 'title')
    assert 'Word models' in title.text
    browser.find_element(By.NAME, 'query').send_keys('water')
    buttons = browser.find_elements(By.TAG_NAME, 'button')
    buttons[2].click()
    time.sleep(1)
    assert browser.current_url == wordmodels_address + '?query=water&neighbours=5'
    browser.find_element(By.ID, 'tab-wordsimilarity').click()
    time.sleep(1)
    assert browser.current_url == wordmodels_address + '?query=water&show=wordsimilarity'

def login(browser, login_address):
    browser.get(login_address)
    browser.find_element(By.NAME, 'username').send_keys(USERNAME)
    browser.find_element(By.NAME, 'password').send_keys(PASSWORD)
    browser.find_element(By.CLASS_NAME, 'button').click()
    time.sleep(5)
