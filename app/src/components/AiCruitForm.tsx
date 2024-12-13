'use client'

import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import { Button, buttonVariants } from "./ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AiCruitRequest, aiCruitRequestSchema } from "@/Validators/register";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";

import Link from "next/link";

const AiCruitFrom = () => {
  const router = useRouter();

  const form = useForm<AiCruitRequest>({
    resolver: zodResolver(aiCruitRequestSchema),
    mode: "all",
  });

  const [disableSubmit, setDisableSubmit] = useState(false);
  const { mutate: submitForm, isPending: isSubmitting } = useMutation({
    mutationKey: ["submit-interview-analysis"],
    mutationFn: async (payload: AiCruitRequest) => {
      const response = await axios.post("/analyse-interview", payload);
      return response.data;
    },
    onSuccess: async (res) => {
      toast.success("Your Details Received successfully!, Once Completed, You can visit listing page");
      router.push("/analysis");
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        toast.error("Failed to submit form", {
          description: error.message,
        });
      } else {
        toast.error("An unexpected error occurred. Please try again later.");
      }
    },
    onSettled: () => {
      setDisableSubmit(false);
    },
  });

  const onSubmit = (data: AiCruitRequest) => {
    setDisableSubmit(true);
    submitForm(data);
  };

  return (
    <div className="flex flex-col gap-2 w-full justify-center items-center">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full max-w-sm flex flex-col gap-4 justify-center items-center"
        >
          <h1 className="text-3xl font-bold">
            New Interview Analysis
          </h1>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <FormField
              control={form.control}
              name="candidate_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Candidate Name</FormLabel>
                  <FormControl>
                    <Input {...field} type="text" placeholder="Enter your Name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <FormField
              control={form.control}
              name="interviewer_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interviewer Name</FormLabel>
                  <FormControl>
                    <Input {...field} type="text" placeholder="Enter Interviewer Name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <FormField
              control={form.control}
              name="interview_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interview Link</FormLabel>
                  <FormControl>
                    <Input {...field} type="text" placeholder="Enter Interview Link" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <FormField
              control={form.control}
              name="job_description_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description Link</FormLabel>
                  <FormControl>
                    <Input {...field} type="text" placeholder="Enter Job Description Link" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        
          <Button
            isLoading={isSubmitting}
            type="submit"
            className="bg-[#668D7E] hover:bg-[#668D7E] text-white w-full"
          >
            Submit
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default AiCruitFrom;