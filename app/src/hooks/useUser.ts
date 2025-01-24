'use client'

import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { SignupUserRequest } from "@/validators/regoster";
import { useState } from "react";
import { Messages } from "@/constants/messages";
import { SigninUserRequest } from "@/validators/signin";

export const useUser = () => {
  const router = useRouter();

    const [disableSubmit,setDisableSubmit] = useState(false);
    const { mutate:signup, isPending:isSigningUp } = useMutation({
        mutationKey: ["signup-user"],
        mutationFn: async (payload: SignupUserRequest) => {
          const response = await axios.post("/api/signup", payload);
          return response.data;
        },
        onSuccess: async (res) => {
          toast.success(Messages.SIGNUP_SUCCESS);
          router.push(res?.role === "hr" ? "/analyse" : "/record");
        },
        onError: (error) => {
          if (error instanceof AxiosError) {
            if (error.response?.status === 422) {
              return toast.error(Messages.SIGNUP_FAILED, {
                description: error.message,
              });
            }
            else if(error.response?.status === 409){
              return toast.error(Messages.USER_EXISTS, {
                action: {
                  label: "Signin",
                  onClick: () => router.push("/signin"),
                }
              });
            }
          }
          return toast.error(
            Messages.SIGNUP_FAILED,
          );
        },
        onSettled: () => {
          setDisableSubmit(false);
        }
    });

    const { mutate:signin, isPending:isSigningIn } = useMutation({
      mutationKey: ["signin-user"],
      mutationFn: async (payload: SigninUserRequest) => {
        const response = await axios.post("/api/signin", payload);
        return response.data;
      },
      onSuccess: async (res) => {
        toast.success(Messages.SIGNIN_SUCCESS);
        console.log("User Role : ", res?.role);
        if (res?.role === "hr") {
          router.push("/analyse");
        } else if (!res?.role) {
          router.push("/");
        } else {
          router.push("/");
        }
      
        router.refresh();
      },
      onError: (error) => {
        if (error instanceof AxiosError) {
          if (error.response?.status === 422) {
            return toast.error(Messages.SIGNUP_FAILED, {
              description: error.message,
            });
          }
          else if(error.response?.status === 404){
            return toast.error(Messages.USER_DOES_NOT_EXISTS, {
              action: {
                label: "Signup",
                onClick: () => router.push("/signup"),
              }
            });
          }
          else if(error.response?.status === 401){
            return toast.error(Messages.INVALID_CREDENTIALS);
          }
        }
        return toast.error(
          Messages.SIGN_IN_FAILED,
        );
      },
      onSettled: () => {
        setDisableSubmit(false);
      }
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
