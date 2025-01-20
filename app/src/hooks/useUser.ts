"use client";

import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { SigninUserRequest, SignupUserRequest } from "@/validators/register";
import { useState } from "react";
import { ValidationMessage } from "@/constants/messages";

export const useUser = () => {
  const router = useRouter();

  const [disableSubmit, setDisableSubmit] = useState(false);
  const { mutate: signup, isPending: isSigningUp } = useMutation({
    mutationKey: ["signup-user"],
    mutationFn: async (payload: SignupUserRequest) => {
      const response = await axios.post("/api/signup", payload);
      return response.data;
    },
    onSuccess: async () => {
      toast.success(ValidationMessage.SIGNUP_SUCCESS);
      router.push("/new");
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        if (error.response?.status === 422) {
          return toast.error(ValidationMessage.SIGNUP_FAILED, {
            description: error.message,
          });
        } else if (error.response?.status === 409) {
          return toast.error(ValidationMessage.USER_EXISTS, {
            action: {
              label: "Signin",
              onClick: () => router.push("/signin"),
            },
          });
        }
      }
      return toast.error(ValidationMessage.CUSTOM_ERROR);
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
    onSuccess: async () => {
      toast.success(ValidationMessage.SIGNIN_SUCCESS);
      router.push("/new");
      /* Next.js router wasn't detecting the authentication state change immediately after signin.
         Added router.refresh() to force Next.js to revalidate the route and update client-side data.
      */
      router.refresh();
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        if (error.response?.status === 422) {
          return toast.error(ValidationMessage.SIGN_IN_FAILED, {
            description: error.message,
          });
        } else if (error.response?.status === 404) {
          return toast.error(ValidationMessage.USER_DOES_NOT_EXISTS, {
            action: {
              label: "Signup",
              onClick: () => router.push("/signup"),
            },
          });
        } else if (error.response?.status === 401) {
          return toast.error(ValidationMessage.INVALID_CREDENTIALS);
        }
      }
      return toast.error(ValidationMessage.CUSTOM_ERROR);
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
