package BaseClass;

import org.openqa.selenium.WebDriver;
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;

import com.aventstack.chaintest.plugins.ChainTestListener;

import Helper.BrowserFactory;
import Helper.ConfigUtility;

public class BaseClass {

	public WebDriver driver;

	// @Parameters({"browser_name"})
	@BeforeClass
	public void startBrowser() {

		ChainTestListener.log(" *** Instantiating Browser *** ");

		driver = BrowserFactory.startBrowser("Chrome", ConfigUtility.getProperty("appUrl"),ConfigUtility.getProperty("headless"));

	}

	@AfterClass
	public void tearDown() {
		ChainTestListener.log("LOG INFO: CLOSING BROWSER");
		if (driver != null) {
			driver.quit();
			ChainTestListener.log("LOG INFO: BROWSER CLOSED");
		} else {
			System.out.println("LOG INFO: BROWSER NOT INITIATED ");
		}

	}

}
