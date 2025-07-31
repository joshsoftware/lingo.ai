package Pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

import com.aventstack.chaintest.plugins.ChainTestListener;

import Helper.Utility;

public class LoginPage {

	WebDriver driver;

	public LoginPage(WebDriver driver) {
		this.driver = driver;
	}

	By email = By.name("userEmail");
	By password = By.xpath("//input[@name='password']");
	By signinButton = By.xpath("//button[@type='submit']");
	By signupLink = By.partialLinkText("Sign Up");
	By homepage_signIn = By.xpath("//button//a[text()='Sign In']");

	public HomePage loginWithValidCreds(String user_email, String user_pw) {

		ChainTestListener.log("LOG INFO: ENTERING USER EMAIL");
		Utility.typeonElement(driver, email, user_email);

		ChainTestListener.log("LOG INFO: ENTERING USER PASSWORD");
		Utility.typeonElement(driver, password, user_pw);

		ChainTestListener.log("LOG INFO: ENTERING USER SIGNIN");
		Utility.clickOnElement(driver, signinButton);

		return new HomePage(driver);

	}

	public boolean isSignInButtonDisplayed() {
		return Utility.isElementDisplayed(driver, homepage_signIn);
	}

}
