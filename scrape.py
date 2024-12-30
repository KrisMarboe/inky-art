# import 
import os
import dotenv
from selenium import webdriver
from selenium.webdriver.common.by import By

from selenium.common.exceptions import TimeoutException

from selenium.webdriver.support.ui import WebDriverWait # available since 2.4.0

from selenium.webdriver.support import expected_conditions as EC # available since 2.26.0

# Load the .env file
dotenv.load_dotenv()

# Create a new instance of the Firefox driver
driver = webdriver.Firefox()

# go to the google home page
driver.get("https://formspree.io/forms/xkggzyka/submissions")

# Wait for the page to load, timeout after 10 seconds
try:
    element = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.ID, "email-address"))
    )
except TimeoutException:
    print("Timed out waiting for page to load")
    driver.quit()

# Log in using environment variables
driver.find_element(By.ID, "email-address").send_keys(os.getenv("EMAIL"))
driver.find_element(By.ID, "password").send_keys(os.getenv("PASSWORD"))

# Locate submit button by type and click
driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

# Wait for the page to load, timeout after 10 seconds
try:
    element = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.ID, "form-list"))
    )
except TimeoutException:
    print("Timed out waiting for page to load")
    driver.quit()