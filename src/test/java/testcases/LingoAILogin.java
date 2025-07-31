package testcases;

import java.util.ArrayList;
import java.util.List;

import org.testng.Assert;
import org.testng.AssertJUnit;
import org.testng.annotations.Test;

import com.aventstack.chaintest.plugins.ChainTestListener;

//import com.aventstack.chaintest.plugins.ChainTestListener;

import BaseClass.BaseClass;
import Helper.Utility;
import dataproviders.DataProviders;
import pages.AudioResultPage;
import pages.HomePage;
import pages.LoginPage;

//@Listeners(ChainTestListener.class)
public class LingoAILogin extends BaseClass {

	LoginPage login;
	HomePage home;
	AudioResultPage result;

	@Test(priority = 1, dataProvider = "LoginCredsData", dataProviderClass = DataProviders.class, description = "Validate E2E after Uploading MP3 File")
	public void testMP3FileUpload(String u_name, String pw) {

		// batman.mp3
		// effective_communication.mp4"

		// String upload_file = "/home/ue/Downloads/batman.mp3";
		String upload_file = System.getProperty("user.dir") + "/TranscribeFiles/batman.mp3";

		// Login With Valid Creds
		login = new LoginPage(driver);
		System.out.println("LOG INFO: LOGIN TO LIGO AI");
		home = login.loginWithValidCreds(u_name, pw);

		Assert.assertTrue(Utility.isCurrentUrlMatch(driver, "thelingo.co.in/new"));

		// Upload MP3 File
		if (upload_file.contains("mp3")) {
			ChainTestListener.log("LOG INFO: CHOSEN FILE TO UPLOAD ===>  MP3 ");

			String actual_file_uploaded_title = home.uploadMp3File(upload_file);
			Assert.assertTrue(actual_file_uploaded_title.contains("batman.mp3"), "File Mismatch");
		}

		// Upload MP4
		else if (upload_file.contains("mp4")) {
			ChainTestListener.log("LOG INFO: CHOSEN FILE TO UPLOAD ===>  MP4 ");
			String actual_file_uploaded_title = home.uploadMp3File(upload_file);
			Assert.assertTrue(actual_file_uploaded_title.contains("effective_communication.mp4"), "File Mismatch");
		}
		// Options Not Supported
		else {
			ChainTestListener.log("LOG INFO: CURRENTLY WE SUPPORT MP3 AND MP4 FILES ONLY");
		}
		// String actual_audio_result_title =
		home.clickTranscribe();

		// Validate Post Transcribe Click Message
		Assert.assertTrue(home.captureTranscribingMsg().contains("Transcribing"), "Transcribe Text Mismatch");
		Assert.assertTrue(home.captureTranscribeSaveMsg().contains("Saving"), "Saving Text Mismatch");

		// Validate Audio Processing Results
		Assert.assertTrue(home.captureAudioProcessingResult().contains("Audio Processing Results"));
	}

	@Test(priority = 2, description = "Validate E2E after uploading MP4", dependsOnMethods = { "testMP3FileUpload" })
	public void validateMP3Upload() {

		List<String> expected_audio_file_Details_list = new ArrayList<String>();
		expected_audio_file_Details_list.add("File Name");
		expected_audio_file_Details_list.add("Duration");
		expected_audio_file_Details_list.add("Upload Date");
		expected_audio_file_Details_list.add("Original Language");

		result = new AudioResultPage(driver);
		Assert.assertEquals(result.verifyLabelAudioContainer(), expected_audio_file_Details_list,
				"Audio File Details Container Label Mismatch");

		// Validate "Play Audio Button"
		Assert.assertTrue(result.checkPlayAudioButtonStatus(), "*** Button Status Not enabled ***");

		// Validate English Translation Container
		AssertJUnit.assertTrue(result.checkEnglishTranslationContainerText());

		// Validating File Name
		Assert.assertTrue(result.getUploadedFileName().contains("batman.mp3"));

		// Validating Duration
		Assert.assertNotNull(result.getUploadedFileDuration());

		// Validate Date Format > Current Date
		Assert.assertEquals(result.getUploadedFileDate(), result.getTodayDate(), "***** Date Mismatch *****");

		// Validate Orignal Language > NOT NULL
		Assert.assertNotNull(result.checkFileOrignalLanguage());

		// Validate Transcribe button Options
		List<String> exp_transcribe_buttons_option = new ArrayList<String>();
		exp_transcribe_buttons_option.add("Translation");
		exp_transcribe_buttons_option.add("Timeline");
		exp_transcribe_buttons_option.add("Summary");

		Assert.assertEquals(result.checkTranscribeOptions(), exp_transcribe_buttons_option,
				"Transcribe Option Mismatch");

	}

	@Test(priority = 3, description = "Play Audio And Validate Transcribe")
	public void playAudioFile() {

		result = new AudioResultPage(driver);
		result.clickPlayAudioButton();
		Assert.assertTrue(result.checkConversationContainerStatus());
		result.checkConversationTranscribe();

	}

}
