package dataproviders;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;

import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;


public class ExcelUtility {
	static XSSFWorkbook wb;

	public static Object[][] readExcelData(String sheet_name) {

		FileInputStream fis = null;

		File src = new File(System.getProperty("user.dir") + "/TestData/TestData.xlsx");

		try {
			fis = new FileInputStream(src);
			wb = new XSSFWorkbook(fis);
	
		} catch (FileNotFoundException e) {
			System.out.println("File Not Found " + e.getMessage());
		} catch (IOException e) {

			System.out.println("File Not able to load " + e.getMessage());
		}
		int row_count = wb.getSheet(sheet_name).getPhysicalNumberOfRows();
		int column_count = wb.getSheet(sheet_name).getRow(0).getPhysicalNumberOfCells();

		Object obj[][] = new Object[row_count][column_count];
		for (int i = 0; i < row_count; i++) {
			for (int j = 0; j < column_count; j++) {
				obj[i][j] = ExcelUtility.getCellType(sheet_name, i, j);

			}

		}
		
		return obj;
	
	}

	public static String getCellType(String sheet_name, int row, int cell) {
		String data = "";
		CellType cellType = wb.getSheet(sheet_name).getRow(row).getCell(cell).getCellType();

		if (cellType == CellType.STRING) {
			data = wb.getSheet(sheet_name).getRow(row).getCell(cell).getStringCellValue();
		} else if (cellType == CellType.NUMERIC) {
			data = String.valueOf(wb.getSheet(sheet_name).getRow(row).getCell(cell).getNumericCellValue());
		}

		else if (cellType == CellType.BOOLEAN) {
			data = String.valueOf(wb.getSheet(sheet_name).getRow(row).getCell(cell).getBooleanCellValue());
		}
		return data;
	}

}
