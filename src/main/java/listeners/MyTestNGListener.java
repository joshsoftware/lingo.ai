package listeners;

import org.testng.ITestContext;
import org.testng.ITestListener;
import org.testng.ITestResult;

import com.aventstack.chaintest.plugins.ChainTestListener;

import Helper.BrowserFactory;
import Helper.Utility;

public class MyTestNGListener implements ITestListener {

	public void onTestStart(ITestResult result) {

		ChainTestListener.log("Log:PASS - Test Pass " + result.getMethod().getMethodName());

	}

	public void onTestSuccess(ITestResult result) {
		ChainTestListener.log("Log:PASS - Test PASS " + result.getMethod().getMethodName());
	}

	public void onTestFailure(ITestResult result) {
		ChainTestListener.log("Log:FAIL - Test FAIL " + result.getMethod().getMethodName() + " "
				+ result.getThrowable().getMessage());
		String screenshot = Utility.getScreenshot(BrowserFactory.getDriver());
		ChainTestListener.embed(screenshot, "image/png");

	}

	public void onTestSkipped(ITestResult result) {
		ChainTestListener.log("Log:SKIP - Test SKIPPED " + result.getMethod().getMethodName());

	}

//	public void onStart(ITestContext context) {
//		ChainTestListener.log("");
//
//	}
//
//	public void onFinish(ITestContext context) {
//		ChainTestListener.log("");
//
//	}

}
