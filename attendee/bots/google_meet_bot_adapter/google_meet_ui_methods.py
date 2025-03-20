import logging

from selenium.common.exceptions import NoSuchElementException, TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from bots.web_bot_adapter.ui_methods import UiCouldNotClickElementException, UiCouldNotLocateElementException, UiRequestToJoinDeniedException, UiRetryableException

logger = logging.getLogger(__name__)


class UiGoogleBlockingUsException(UiRetryableException):
    def __init__(self, message, step=None, inner_exception=None):
        super().__init__(message, step, inner_exception)


class GoogleMeetUIMethods:
    def locate_element(self, step, condition, wait_time_seconds=60):
        try:
            element = WebDriverWait(self.driver, wait_time_seconds).until(condition)
            return element
        except Exception as e:
            # Take screenshot when any exception occurs
            logger.info(f"Exception raised in locate_element for {step}")
            raise UiCouldNotLocateElementException(f"Exception raised in locate_element for {step}", step, e)

    def find_element_by_selector(self, selector_type, selector):
        try:
            return self.driver.find_element(selector_type, selector)
        except NoSuchElementException:
            return None
        except Exception as e:
            logger.info(f"Unknown error occurred in find_element_by_selector. Exception type = {type(e)}")
            return None

    def click_element(self, element, step):
        try:
            element.click()
        except Exception as e:
            logger.info(f"Error occurred when clicking element {step}, will retry")
            raise UiCouldNotClickElementException("Error occurred when clicking element", step, e)

    # If the meeting you're about to join is being recorded, gmeet makes you click an additional button after you're admitted to the meeting
    def click_this_meeting_is_being_recorded_join_now_button(self, step):
        this_meeting_is_being_recorded_join_now_button = self.find_element_by_selector(By.XPATH, '//button[.//span[text()="Join now"]]')
        if this_meeting_is_being_recorded_join_now_button:
            this_meeting_is_being_recorded_join_now_button.click()

    def look_for_blocked_element(self, step):
        cannot_join_element = self.find_element_by_selector(By.XPATH, '//*[contains(text(), "You can\'t join this video call")]')
        if cannot_join_element:
            # This means google is blocking us for whatever reason, but we can retry
            logger.info("Google is blocking us for whatever reason, but we can retry. Raising UiGoogleBlockingUsException")
            raise UiGoogleBlockingUsException("You can't join this video call", step)

    def look_for_denied_your_request_element(self, step):
        denied_your_request_element = self.find_element_by_selector(
            By.XPATH,
            '//*[contains(text(), "Someone in the call denied your request to join") or contains(text(), "No one responded to your request to join the call")]',
        )
        if denied_your_request_element:
            logger.info("Someone in the call denied our request to join. Raising UiRequestToJoinDeniedException")
            raise UiRequestToJoinDeniedException("Someone in the call denied your request to join", step)

    def look_for_asking_to_be_let_in_element_after_waiting_period_expired(self, step):
        asking_to_be_let_in_element = self.find_element_by_selector(
            By.XPATH,
            '//*[contains(text(), "Asking to be let in")]',
        )
        if asking_to_be_let_in_element:
            logger.info("Bot was not let in after waiting period expired. Raising UiRequestToJoinDeniedException")
            raise UiRequestToJoinDeniedException("Bot was not let in after waiting period expired", step)

    def fill_out_name_input(self):
        num_attempts_to_look_for_name_input = 30
        logger.info("Waiting for the name input field...")
        for attempt_to_look_for_name_input_index in range(num_attempts_to_look_for_name_input):
            try:
                name_input = WebDriverWait(self.driver, 1).until(EC.presence_of_element_located((By.CSS_SELECTOR, 'input[type="text"][aria-label="Your name"]')))
                logger.info("name input found")
                name_input.send_keys(self.display_name)
                return
            except TimeoutException as e:
                self.look_for_blocked_element("name_input")

                last_check_timed_out = attempt_to_look_for_name_input_index == num_attempts_to_look_for_name_input - 1
                if last_check_timed_out:
                    logger.info("Could not find name input. Timed out. Raising UiCouldNotLocateElementException")
                    raise UiCouldNotLocateElementException("Could not find name input. Timed out.", "name_input", e)

            except Exception as e:
                logger.info(f"Could not find name input. Unknown error {e} of type {type(e)}. Raising UiCouldNotLocateElementException")
                raise UiCouldNotLocateElementException("Could not find name input. Unknown error.", "name_input", e)

    def click_captions_button(self):
        num_attempts_to_look_for_captions_button = 600
        logger.info("Waiting for captions button...")
        for attempt_to_look_for_captions_button_index in range(num_attempts_to_look_for_captions_button):
            try:
                captions_button = WebDriverWait(self.driver, 1).until(EC.presence_of_element_located((By.CSS_SELECTOR, 'button[aria-label="Turn on captions"]')))
                logger.info("Captions button found")
                self.click_element(captions_button, "click_captions_button")
                return
            except UiCouldNotClickElementException as e:
                raise e
            except TimeoutException as e:
                self.look_for_blocked_element("click_captions_button")
                self.look_for_denied_your_request_element("click_captions_button")
                self.click_this_meeting_is_being_recorded_join_now_button("click_captions_button")

                last_check_timed_out = attempt_to_look_for_captions_button_index == num_attempts_to_look_for_captions_button - 1
                if last_check_timed_out:
                    self.look_for_asking_to_be_let_in_element_after_waiting_period_expired("click_captions_button")

                    logger.info("Could not find captions button. Timed out. Raising UiCouldNotLocateElementException")
                    raise UiCouldNotLocateElementException(
                        "Could not find captions button. Timed out.",
                        "click_captions_button",
                        e,
                    )

            except Exception as e:
                logger.info(f"Could not find captions button. Unknown error {e} of type {type(e)}. Raising UiCouldNotLocateElementException")
                raise UiCouldNotLocateElementException(
                    "Could not find captions button. Unknown error.",
                    "click_captions_button",
                    e,
                )

    # returns nothing if succeeded, raises an exception if failed
    def attempt_to_join_meeting(self):
        self.driver.get(self.meeting_url)

        self.driver.execute_cdp_cmd(
            "Browser.grantPermissions",
            {
                "origin": self.meeting_url,
                "permissions": [
                    "geolocation",
                    "audioCapture",
                    "displayCapture",
                    "videoCapture",
                ],
            },
        )

        self.fill_out_name_input()

        logger.info("Waiting for the 'Ask to join' or 'Join now' button...")
        join_button = self.locate_element(
            step="join_button",
            condition=EC.presence_of_element_located((By.XPATH, '//button[.//span[text()="Ask to join" or text()="Join now"]]')),
            wait_time_seconds=60,
        )
        logger.info("Clicking the join button...")
        self.click_element(join_button, "join_button")

        self.click_captions_button()

        logger.info("Waiting for the more options button...")
        MORE_OPTIONS_BUTTON_SELECTOR = 'button[jsname="NakZHc"][aria-label="More options"]'
        more_options_button = self.locate_element(
            step="more_options_button",
            condition=EC.presence_of_element_located((By.CSS_SELECTOR, MORE_OPTIONS_BUTTON_SELECTOR)),
            wait_time_seconds=6,
        )
        logger.info("Clicking the more options button...")
        self.click_element(more_options_button, "more_options_button")

        logger.info("Waiting for the 'Change layout' list item...")
        change_layout_list_item = self.locate_element(
            step="change_layout_item",
            condition=EC.presence_of_element_located((By.XPATH, '//li[.//span[text()="Change layout"]]')),
            wait_time_seconds=6,
        )
        logger.info("Clicking the 'Change layout' list item...")
        self.click_element(change_layout_list_item, "change_layout_list_item")

        logger.info("Waiting for the 'Spotlight' label element")
        spotlight_label = self.locate_element(
            step="spotlight_label",
            condition=EC.presence_of_element_located((By.XPATH, '//label[.//span[text()="Spotlight"]]')),
            wait_time_seconds=6,
        )
        logger.info("Clicking the 'Spotlight' label element")
        self.click_element(spotlight_label, "spotlight_label")

        logger.info("Waiting for the close button")
        close_button = self.locate_element(
            step="close_button",
            condition=EC.presence_of_element_located((By.CSS_SELECTOR, 'button[aria-label="Close"]')),
            wait_time_seconds=6,
        )
        logger.info("Clicking the close button")
        self.click_element(close_button, "close_button")

    def click_leave_button(self):
        logger.info("Waiting for the leave button")
        leave_button = WebDriverWait(self.driver, 6).until(
            EC.presence_of_element_located(
                (
                    By.CSS_SELECTOR,
                    'button[jsname="CQylAd"][aria-label="Leave call"]',
                )
            )
        )
        logger.info("Clicking the leave button")
        leave_button.click()
