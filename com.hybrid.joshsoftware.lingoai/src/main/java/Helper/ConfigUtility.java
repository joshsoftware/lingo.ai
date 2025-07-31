package Helper;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.Properties;

public class ConfigUtility {

	public static String getProperty(String key) {
		Properties prop = null;

		try {

			prop = new Properties();
			prop.load(
					new FileInputStream(new File(System.getProperty("user.dir") + "/Configuration/lingo.properties")));
		} catch (FileNotFoundException e) {
			System.out.println("File Not Found " + e.getMessage());
		} catch (IOException e) {
			System.out.println("Issue On loading " + e.getMessage());
		}
		return prop.getProperty(key);
	}

}
