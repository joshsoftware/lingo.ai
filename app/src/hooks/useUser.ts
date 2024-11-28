'use client';

import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { SigninUserRequest, SignupUserRequest } from "@/Validators/register";
import { useState } from "react";

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
          toast.success("User Registered Successfully");
          router.push("/new")
        },
        onError: (error) => {
          if (error instanceof AxiosError) {
            if (error.response?.status === 422) {
              return toast.error("Failed to Register User", {
                description: error.message,
              });
            }
            else if(error.response?.status === 409){
              return toast.error("User already exists, please sign in", {
                action: {
                  label: "Signin",
                  onClick: () => router.push("/signin"),
                }
              });
            }
          }
          return toast.error(
            "Failed to Register User, please try again in some time",
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
        toast.success("User sign in Successfull");
        router.push("/new")
      },
      onError: (error) => {
        if (error instanceof AxiosError) {
          if (error.response?.status === 422) {
            return toast.error("Failed to sign in User", {
              description: error.message,
            });
          }
          else if(error.response?.status === 404){
            return toast.error("User does not exists", {
              action: {
                label: "Signup",
                onClick: () => router.push("/signup"),
              }
            });
          }
          else if(error.response?.status === 401){
            return toast.error("Incorrect username or password");
          }
        }
        return toast.error(
          "Failed to sign in User, please try again in some time",
        );
      },
      onSettled: () => {
        setDisableSubmit(false);
      }
  });

    const signupUser = (data: SignupUserRequest) => {
        setDisableSubmit(true);
        signup(data);
    }

    const signinUser = (data: SigninUserRequest) => {
      setDisableSubmit(true);
      signin(data);
    }

    return {
        signupUser,
        signinUser,
        isPending: isSigningUp || isSigningIn,
        disableSubmit
    }

}

