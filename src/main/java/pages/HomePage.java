package pages;

import java.util.ArrayList;
import java.util.List;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.testng.Assert;

import com.aventstack.chaintest.plugins.ChainTestListener;

import Helper.Utility;

public class HomePage {

	WebDriver driver;

	// driver Initialization
	public HomePage(WebDriver driver) {
		this.driver = driver;
	}

	// Locators > HomePage
	By mic_container = By.xpath("//p[contains(text(),'upload an audio or video file')]");
	By button_uploadfile = By.xpath("//button[text()='Upload File']");
	By button_startRecording = By.xpath("//button[contains(text(),'Start Recording')]");
	By verifyFileUploaded = By.xpath("//p");
	By button_transcribe = By.xpath("//button[text()='Transcribe']");
	By button_restart = By.xpath("//button[text()='Restart']");
	By h1_checkAudioResults = By.xpath("//h1[text()='Audio Processing Results']");
	By transcribing_msg = By.xpath("//p[contains(text(),'Transcribing')]");
	By save_transcribe_msg = By.xpath("//p[contains(text(),'Saving')]");

	// Locators > ProfileOptions Container
	By profileIcon = By.xpath("//a[contains(text(),'View Records')]//parent::button/following-sibling::div");
	By profileOption_account = By.xpath("//div[@role='menu']/div[text()='My Account']");
	By profileOption_separator = By.xpath("//div[@role='separator']");
	By profile_menuOptions = By.xpath("//div[@role='menuitem']");
	By txt_profileOption = By.xpath("//div[text()='Profile']");
	By container_profile = By.xpath("//h2[text()='Profile']//parent::div");
	By heading_profileContainer = By.xpath("//h2[text()='Profile']");
	By profile_email = By.xpath("//h2[text()='Profile']//parent::div//p");
	By txt_email_initials = By.xpath("//h2[text()='Profile']//parent::div//div[contains(@class,'text-white')]");
	By close_profileContainer = By.xpath("//h2[text()='Profile']//parent::div//button");
	By list_profileTranscribeDetails = By.xpath("//div[contains(@class,'grid')]//div");

	// Locators > LingoBot
	By txt_lingoBot = By.xpath("//div[text()='Lingo bot']");
	By container_lingoBot = By.xpath("//h2[text()='Meeting Recorder Bot']/parent::div");
	By headingTxt_lingoBotContainer = By.xpath("//h2[text()='Meeting Recorder Bot']");
	By subHeadingTxt_lingoBotContainer = By.xpath("//h2[text()='Meeting Recorder Bot']/parent::div//p");
	By buttonCancel_LingoBot = By.xpath("//h2[text()='Meeting Recorder Bot']/parent::div//button[text()='Cancel']");

	// Logout
	By button_logout = By.xpath("//div[text()='Logout']");

	public String uploadMp3File(String file_path) {
		driver.findElement(By.xpath("//button[text()='Upload File']//preceding::input[@type='file']"))
				.sendKeys(file_path);
		return Utility.getElementText(driver, verifyFileUploaded);

	}

	public void clickTranscribe() {
		ChainTestListener.log("LOG INFO: CLICKING ON TRANSCRIBE");
		Utility.clickOnElement(driver, button_transcribe);
	}

	public String captureTranscribingMsg() {

		return Utility.getElementText(driver, transcribing_msg);
	}

	public String captureTranscribeSaveMsg() {
		return Utility.getElementText(driver, save_transcribe_msg);
	}

	public String captureAudioProcessingResult() {
		return Utility.getElementText(driver, h1_checkAudioResults);
	}

	public void clickProfileIcon() {
		Utility.clickOnElement(driver, profileIcon);
	}

	public String getAccountText() {
		return Utility.getElementText(driver, profileOption_account);
	}

	public boolean isProfileSeparatorDisplayed() {
		return Utility.isElementDisplayed(driver, profileOption_separator);
	}

	public List<String> getProfileMenuOptions() {
		return Utility.getMenuList(driver, 4, profile_menuOptions);
	}

	public void clickProfileOptiontxt() {
		Utility.clickOnElement(driver, txt_profileOption);
	}

	public boolean isProfileContainerDisplayed() {
		return Utility.isElementDisplayed(driver, container_profile);
	}

	public String getProfileContainerHeadingText() {
		return Utility.getElementText(driver, heading_profileContainer);
	}

	public String getProfileEmail() {
		return Utility.getElementText(driver, profile_email);
	}

	public String getemailInitials() {
		return Utility.getElementText(driver, txt_email_initials);
	}

	public String getInitials() {
		String email = this.getProfileEmail();
		String email_upper = email.toUpperCase();
		char exp_c1 = email_upper.charAt(0);
		return String.valueOf(exp_c1);
	}

	public void clickProfileClose() {
		Utility.clickOnElement(driver, close_profileContainer);
	}

	public List<String> getTranscribeDetails() throws Exception {

		List<WebElement> user_transcribe_details = Utility.getActualList(driver, list_profileTranscribeDetails);

		List<String> actual_user_transcribe_details = new ArrayList<String>();

		for (WebElement element : user_transcribe_details) {
			String str1 = element.getText();
			String arr[] = str1.split("\n");
			String strA = arr[0];
			String strB = arr[1];
			actual_user_transcribe_details.add(strA);
			// Assert.assertNotNull(strB);
			if (strB.equals(null)) {
				throw new Exception("Null Value Observed at Transcribe Profile Details" + strB);
			}

		}
		return actual_user_transcribe_details;
	}

	public void clickLingoBot() {
		Utility.clickOnElement(driver, txt_lingoBot);

	}

	public boolean isLingoBotContainerDisplayed() {
		return Utility.isElementDisplayed(driver, container_lingoBot);
	}

	public boolean isLingoBotContainerHeadingDisplayed() {
		return Utility.isElementDisplayed(driver, headingTxt_lingoBotContainer);
	}

	public String getLingoBotSubHeading() {
		return Utility.getElementText(driver, subHeadingTxt_lingoBotContainer);
	}

	public void clickLingoCancelButton() {
		Utility.clickOnElement(driver, buttonCancel_LingoBot);
	}

	public boolean IsLingoBotContainerInvisible() {
		return Utility.checkElementInvisibility(driver, container_lingoBot);
	}
	
	public void clickLogout() {
		Utility.clickOnElement(driver, button_logout);
	}

}
