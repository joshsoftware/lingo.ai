"use client";

import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { SigninUserRequest, SignupUserRequest } from "@/Validators/register";
import { useState } from "react";
import Cookies from "js-cookie";

export const useUser = () => {
  const router = useRouter();

  const [disableSubmit, setDisableSubmit] = useState(false);
  const { mutate: signup, isPending: isSigningUp } = useMutation({
    mutationKey: ["signup-user"],
    mutationFn: async (payload: SignupUserRequest) => {
      const response = await axios.post("/api/signup", payload);
      return response.data;
    },
    onSuccess: async (res) => {
      // On signup setting isBotAdded to false as default as user has not added bot yet
      Cookies.set("isBotAdded", String(false), {
        expires: 2, // expires in 2 days (optional)
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      toast.success("User Registered Successfully");
      router.refresh();

      // Wait for the toast to be shown a bit before redirect
      setTimeout(() => {
        router.push("/new"); // Navigate to /new
        router.refresh(); // Force a layout/server refresh
      }, 100); // Adjust timing if needed
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        if (error.response?.status === 422) {
          return toast.error("Failed to Register User", {
            description: error.message,
          });
        } else if (error.response?.status === 409) {
          return toast.error("User already exists, please sign in", {
            action: {
              label: "Signin",
              onClick: () => router.push("/signin"),
            },
          });
        }
      }
      return toast.error(
        "Failed to Register User, please try again in some time"
      );
    },
    onSettled: () => {
      setDisableSubmit(false);
    },
  });

  const { mutate: signin, isPending: isSigningIn } = useMutation({
    mutationKey: ["signin-user"],
    mutationFn: async (payload: SigninUserRequest) => {
      const response = await axios.post("/api/signin", payload);
      return response.data;
    },
    onSuccess: async (res) => {
      Cookies.set("isBotAdded", String(res.data.isBotAdded), {
        expires: 2, // expires in 2 days (optional)
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      toast.success("User sign in Successfull");

      // Wait for the toast to be shown a bit before redirect
      setTimeout(() => {
        router.push("/new"); // Navigate to /new
        router.refresh(); // Force a layout/server refresh
      }, 100); // Adjust timing if needed
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        if (error.response?.status === 422) {
          return toast.error("Failed to sign in User", {
            description: error.message,
          });
        } else if (error.response?.status === 404) {
          return toast.error("User does not exists", {
            action: {
              label: "Signup",
              onClick: () => router.push("/signup"),
            },
          });
        } else if (error.response?.status === 401) {
          return toast.error("Incorrect username or password");
        }
      }
      return toast.error(
        "Failed to sign in User, please try again in some time"
      );
    },
    onSettled: () => {
      setDisableSubmit(false);
    },
  });

  const signupUser = (data: SignupUserRequest) => {
    setDisableSubmit(true);
    signup(data);
  };

  const signinUser = (data: SigninUserRequest) => {
    setDisableSubmit(true);
    signin(data);
  };

  return {
    signupUser,
    signinUser,
    isPending: isSigningUp || isSigningIn,
    disableSubmit,
  };
};
