package Pages;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Reporter;

import Helper.DateUtility;
import Helper.Utility;

public class AudioResultPage {

	WebDriver driver;

	public AudioResultPage(WebDriver driver) {

		this.driver = driver;

	}

	// Audio Processing Result Locators
	By txt_uploaded_audio_file = By
			.xpath("//p[text()='Complete analysis of your uploaded audio file with translation and insights']");

	// Audio File Details Container Locators
	By txt_audio_file_detais = By.xpath("//h3[text()='Audio File Details']");
	By list_actual_audio_file_Details_label = By.xpath(
			"//h3[text()='Audio File Details']/parent::div/following-sibling::div//p[contains(@class,'text-muted-foreground')]");
	By button_playAudio = By.xpath("//button[text()='Play Audio']");
	By button_pauseAudio = By.xpath("//button[text()='Pause Audio']");
	By file_name = By.xpath("//p[text()='File Name']//following-sibling::p");
	By file_duration = By.xpath("//p[text()='Duration']//following-sibling::div");
	By file_actual_date = By.xpath("//p[text()='Upload Date']//following-sibling::p");
	By file_orignal_language = By.xpath("//p[text()='Original Language']//following-sibling::div");
	By button_timeline = By.xpath("//button[text()='Timeline']");

	// Validate Transcribe button Options
	By listButton_transcribe_Options = By.xpath("//div[@role='tablist']//button");

	// Englsih Translation COntainer
	By containerTxt_Englishtranslation = By.xpath("//h3[text()='English Translation']");

	// Timeline Conversation Container
	By conversation_container = By.xpath("//h3[text()='Conversation Timeline']");
	By conversation_timeline_text_seq = By.xpath(
			"//h3[text()='Conversation Timeline']/parent::div/following-sibling::div//div[contains(@class,'items-start')]");

	public boolean getAudioFileUploadedMsg() {
		return Utility.isElementDisplayed(driver, txt_uploaded_audio_file);
	}

	public List<String> verifyLabelAudioContainer() {

		List<WebElement> actual_audio_file_Details_label_list = Utility.checkListElementPresence(driver,
				list_actual_audio_file_Details_label);

		List<String> actual_myList = new ArrayList<String>();

		if (actual_audio_file_Details_label_list.size() == 4) {

			for (int i = 0; i < actual_audio_file_Details_label_list.size(); i++) {
				String a = actual_audio_file_Details_label_list.get(i).getText();

				actual_myList.add(a);
			}
		} else {
			Reporter.log("*** File Details List Count Mismatch ***", true);
		}
		return actual_myList;
	}

	public boolean checkPlayAudioButtonStatus() {
		return Utility.isElementDisplayed(driver, button_playAudio);

	}

	public boolean checkEnglishTranslationContainerText() {
		return Utility.isElementDisplayed(driver, containerTxt_Englishtranslation);

	}

	public String getUploadedFileName() {
		return Utility.getElementText(driver, file_name);

	}

	public String getUploadedFileDuration() {
		return Utility.getElementText(driver, file_duration);

	}

	public String getTodayDate() {
		return DateUtility.getDate();
	}

	public String getUploadedFileDate() {
		return Utility.getElementText(driver, file_actual_date);

	}

	public String checkFileOrignalLanguage() {
		return Utility.getElementText(driver, file_orignal_language);

	}

	public List<String> checkTranscribeOptions() {
		List<WebElement> actual_transcribe_Options_List = Utility.checkListElementPresence(driver,
				listButton_transcribe_Options);

		List<String> myList = new ArrayList<String>();
		if (actual_transcribe_Options_List.size() == 3) {
			for (int i = 0; i < actual_transcribe_Options_List.size(); i++) {
				String a = actual_transcribe_Options_List.get(i).getText();

				myList.add(a);
			}
		} else {
			Reporter.log("*** Transcribe Options Count Mismatch ***", true);
		}

		return myList;

	}

	public void clickPlayAudioButton() {
		Utility.clickOnElement(driver, button_playAudio);
		if (Utility.getElementText(driver, button_pauseAudio).equals("Pause Audio")) {
			Utility.clickOnElement(driver, button_timeline);
		} else {
			Reporter.log("Pause Button Text Mismatch", true);
		}
	}

	public boolean checkConversationContainerStatus() {
		return Utility.isElementDisplayed(driver, conversation_container);
	}

	public void checkConversationTranscribe() {
		List<WebElement> abc = Utility.checkListElementPresence(driver, conversation_timeline_text_seq);
		for (WebElement xyz : abc) {
			WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(60));
			wait.until(ExpectedConditions.attributeContains(xyz, "class", "bg-green-100/50 border-green-50"));
			System.out.println("TRUE > Getting Green Border");
		}
	}

}
