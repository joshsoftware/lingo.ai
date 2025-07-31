package Helper;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class Utility {

	public static String getScreenshot(WebDriver driver) {
		TakesScreenshot ts = (TakesScreenshot) driver;
		return ts.getScreenshotAs(OutputType.BASE64);
	}

	public static String getTitle(WebDriver driver) {
		return driver.getTitle();
	}

	public static boolean isCurrentUrlMatch(WebDriver driver, String url) {

		WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(5));
		return wait.until(ExpectedConditions.urlContains(url));

	}

	public static void pause(int millisec) {
		try {
			Thread.sleep(millisec);
		} catch (InterruptedException e) {
			System.out.println(e.getMessage());
		}
	}

	public static boolean checkElementInvisibility(WebDriver driver, By locator) {
		WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
		return wait.until(ExpectedConditions.invisibilityOfElementLocated(locator));

	}

	public static WebElement checkElement(WebDriver driver, By locator) {
		WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(300));

		WebElement ele = wait.until(ExpectedConditions.elementToBeClickable(locator));

		Utility.highlightElement(driver, ele);

		return ele;

	}

//	public static WebElement checkElementVisibility(WebDriver driver, By locator) {
//		WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(60));
//
//		WebElement ele = wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
//
//		Utility.highlightElement(driver, ele);
//
//		return ele;
//
//	}

	public static List<WebElement> checkListElementPresence(WebDriver driver, By locator) {
		WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(60));
		return wait.until(ExpectedConditions.presenceOfAllElementsLocatedBy(locator));
	}

	public static void highlightElement(WebDriver driver, WebElement element) {
		JavascriptExecutor js = (JavascriptExecutor) driver;
		js.executeScript("arguments[0].setAttribute('style','background:yellow;border: 2px solid red;');", element);
		pause(500);
		js.executeScript("arguments[0].setAttribute('style','border: solid 2px white');", element);
	}

	public static void typeonElement(WebDriver driver, By locator, String textToType) {
		// System.out.println(textToType);

		Utility.checkElement(driver, locator).sendKeys(textToType);
	}

	public static void clickOnElement(WebDriver driver, By locator) {
		Utility.checkElement(driver, locator).click();
	}

	public static String getElementText(WebDriver driver, By locator) {
		System.out.println(driver.findElement(locator).getText());
		return Utility.checkElement(driver, locator).getText();
	}

	public static boolean isElementDisplayed(WebDriver driver, By locator) {
		return Utility.checkElement(driver, locator).isDisplayed();
	}

	public static List<WebElement> getActualList(WebDriver driver, By locator) {
		return driver.findElements(locator);
	}

	public static List<String> getMenuList(WebDriver driver, int size, By locator) {
		List<String> actual_list = new ArrayList<String>();
		List<WebElement> list_webElement = Utility.getActualList(driver, locator);

		if (list_webElement.size() == size) {
			for (WebElement webElement : list_webElement) {
				String str = webElement.getText();

				actual_list.add(str);
			}

		} else {
			System.out.println("List Count Mismatch");
		}

		return actual_list;
	}

}
