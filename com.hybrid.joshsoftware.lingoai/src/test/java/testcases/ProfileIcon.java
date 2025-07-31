package testcases;

import java.util.ArrayList;
import java.util.List;

import org.testng.Assert;
import org.testng.AssertJUnit;
import org.testng.annotations.Test;

import com.aventstack.chaintest.plugins.ChainTestListener;

import BaseClass.BaseClass;
import Helper.Utility;
import Pages.HomePage;
import Pages.LoginPage;
import dataproviders.DataProviders;

public class ProfileIcon extends BaseClass {

	HomePage home;
	LoginPage login;

	@Test(priority = 1, dataProvider = "LoginCredsData", dataProviderClass = DataProviders.class, description = "Profile Icon Click and Validate Profile Options")
	public void testProfileDropdownOptions(String u_name, String pw) {

		login = new LoginPage(driver);
		home = login.loginWithValidCreds(u_name, pw);

		Assert.assertTrue(Utility.isCurrentUrlMatch(driver, "thelingo.co.in/new"), "URL Mismatch");

		List<String> expected_profileOption_list = new ArrayList<String>();

		expected_profileOption_list.add("Profile");
		expected_profileOption_list.add("Lingo bot");
		expected_profileOption_list.add("Upgrade plan");
		expected_profileOption_list.add("Logout");
		ChainTestListener.log(" Expected Profile option List loaded ");

		// Click Profile Icon and check Visibility
		home.clickProfileIcon();
		ChainTestListener.log(" Clicked On Profile icon ");

		// Validating My Account Text
		Assert.assertTrue(home.getAccountText().contains("My Account"), "Account Text Mismatch On Profile DD");
		ChainTestListener.log("Account Text Label Is Displayed ");

		// Validating Separator
		Assert.assertTrue(home.isProfileSeparatorDisplayed(), " Separation Isn't displayed ");
		ChainTestListener.log(" Profile Separator Is Displayed ");

		Assert.assertEquals(home.getProfileMenuOptions(), expected_profileOption_list,
				"Mismatch In Actual Profile Options ANd Expected Profile Option");
		ChainTestListener.log("Profile List Option Matching Succesful");

	}

	@Test(priority = 2, dataProvider = "LoginCredsData", dataProviderClass = DataProviders.class, dependsOnMethods = {
			"testProfileDropdownOptions" })
	public void clickProfileOptions(String u_name, String pw) throws Exception {

		List<String> exp_user_transcribe_details = new ArrayList<String>();
		exp_user_transcribe_details.add("Recordings:");
		exp_user_transcribe_details.add("Limit:");
		exp_user_transcribe_details.add("Remaining:");
		exp_user_transcribe_details.add("Subscription:");

		// Profile Option Click From dd
		home.clickProfileOptiontxt();
		ChainTestListener.log("Clicked on Profile Option From DD");

		// Verify Profile Container Visibility
		Assert.assertTrue(home.isProfileContainerDisplayed(), "Profile COntainer Visibility Error");
		ChainTestListener.log("Verifiication for Profile Container visibility");

		// Verify Profile Heading
		Assert.assertTrue(home.getProfileContainerHeadingText().equals("Profile"), "Profile Header Text Mismatch");
		ChainTestListener.log("Verifiication for Profile Heading visibility");

		// Verify Email Displayed
		Assert.assertEquals(home.getProfileEmail(), u_name, "Profile Email Mismatch ");
		ChainTestListener.log("Verifiication of Profile Email Successful");

		// Verify Email Initials
		Assert.assertEquals(home.getemailInitials(), home.getInitials(), "Initials Not Matching ");
		ChainTestListener.log("Verifiication for Profile Email Initials visibility");

		// Verify profile transcribe details
		Assert.assertEquals(home.getTranscribeDetails(), exp_user_transcribe_details,
				"Transcribe Details List Mismatch");
		ChainTestListener.log("Verifiication for Profile Transcribe Option");

		home.clickProfileClose();

	}

	@Test(priority = 3, dependsOnMethods = { "testProfileDropdownOptions" })
	public void testLingoBot() {

		home.clickProfileIcon();
		ChainTestListener.log("Clicked Profile Icon");

		home.clickLingoBot();
		ChainTestListener.log("Clicked Lingo Bot From DD");

		Assert.assertTrue(home.isLingoBotContainerDisplayed(), "Lingo Container Visibility Error ");
		ChainTestListener.log("Lingo Bot Container Visibility Checked");

		Assert.assertTrue(home.isLingoBotContainerHeadingDisplayed(), "Lingo Bot Container Heading Mismatch");
		ChainTestListener.log("Lingo Bot Container Heading Visibility Checked");

		AssertJUnit.assertEquals(home.getLingoBotSubHeading(), "Do you want to add a bot for meeting Summarization?");
		ChainTestListener.log("Lingo Bot Container Sub-Heading Visibility Checked");

		home.clickLingoCancelButton();
		ChainTestListener.log("Lingo Bot Cancel Button Clicked");

		Assert.assertTrue(home.IsLingoBotContainerInvisible(), "Lingo Bot Container still Visible");
		ChainTestListener.log("Checked Invisibility after Lingo Bot Container Cancel ");

		/*
		 * 
		 * Currently code missing for "ADD BOT"
		 * 
		 */
	}

	@Test(priority = 3, dependsOnMethods = { "testProfileDropdownOptions" })
	public void testLogout() {

		home.clickProfileIcon();
		ChainTestListener.log("Clicked Profile Icon");

		home.clickLogout();
		ChainTestListener.log(" Clicked On Logout ");

		Assert.assertTrue(login.isSignInButtonDisplayed(), "Logout Error, Signin Button Not Displayed");
		ChainTestListener.log(" Logout Assertion Successful");

	}
}
