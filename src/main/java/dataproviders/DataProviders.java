package dataproviders;

import org.testng.annotations.DataProvider;

public class DataProviders {
	
	@DataProvider(name = "LoginCredsData")
	public static Object[][] testData() {

		Object obj[][] = ExcelUtility.readExcelData("LoginCreds");
		return obj;

	}

}
