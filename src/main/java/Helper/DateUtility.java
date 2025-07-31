package Helper;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public class DateUtility {

	public static String getDate() {
		LocalDate today = LocalDate.now(); // gets current date

		DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy");
		String formattedDate = today.format(formatter);

		return formattedDate; // e.g., 22 July 2025
	}

}
