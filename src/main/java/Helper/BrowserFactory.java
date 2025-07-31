package Helper;

import java.time.Duration;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.edge.EdgeDriver;
import org.openqa.selenium.firefox.FirefoxDriver;

import com.aventstack.chaintest.plugins.ChainTestListener;

public class BrowserFactory {

	static WebDriver driver;

	//Initializing driver for screenshot in listener during failure
	public static WebDriver getDriver() {
		return driver;
	}

	public static WebDriver startBrowser(String browser, String appUrl) {
		if (browser.equalsIgnoreCase("Chrome")) {
			driver = new ChromeDriver();
		} else if (browser.equalsIgnoreCase("Firefox")) {
			driver = new FirefoxDriver();
		}

		else if (browser.equalsIgnoreCase("Edge")) {
			driver = new EdgeDriver();
		} else {
			System.out.println("We only support CHROME, FIREFOX, EDGE Browser");
			System.out.println("Starting Default Browser");
			driver = new ChromeDriver();
		}
		driver.manage().window().maximize();
		driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(60));
		driver.get(appUrl);
		driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
		return driver;
	}

	public static WebDriver startBrowser(String browser, String appUrl, String headless) {

		if (browser.equalsIgnoreCase("Chrome")) {

			if (headless.equalsIgnoreCase("true")) {
				ChainTestListener.log("LOG INFO: CHROME BROWSER Initialized In HEADLESS");
				ChromeOptions options = new ChromeOptions();
				options.addArguments("headless");
				driver = new ChromeDriver(options);
			}

			else {
				ChainTestListener.log("LOG INFO: Chrome Browser Initialized ");
				driver = new ChromeDriver();
			}
		}

		else if (browser.equalsIgnoreCase("Firefox")) {
			ChainTestListener.log("LOG INFO: FireFox Browser Initialized ");
			driver = new FirefoxDriver();
		} else if (browser.equalsIgnoreCase("Edge")) {
			ChainTestListener.log("LOG INFO: Edge Browser Initialized ");
			driver = new EdgeDriver();
		}

		else {
			ChainTestListener.log("LOG INFO: Sorry We Only support 'CHROME', 'FIREFOX', 'EDGE' ");
			ChainTestListener.log("LOG INFO: Initializing Chrome Browser");
			driver = new ChromeDriver();
		}

		driver.manage().window().maximize();
		driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(60));
		ChainTestListener.log("LOG INFO: Launching Lingo AI URL");
		driver.get(appUrl);
		driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
		return driver;
	}

}
