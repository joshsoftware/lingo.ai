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
import { Checkbox } from "@/components/ui/checkbox"

import Link from "next/link";

const AiCruitFrom = () => {
  const router = useRouter();

  const form = useForm<AiCruitRequest>({
    resolver: zodResolver(aiCruitRequestSchema),
    mode: "all",
  });

  const [disableSubmit, setDisableSubmit] = useState(false);
  const [checked, setChecked] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { mutate: submitForm, isPending: isSubmitting } = useMutation({
    mutationKey: ["submit-interview-analysis"],
    mutationFn: async (formData: FormData) => {
      // get microservice url from env
      const BASE_URL = process.env.NEXT_PUBLIC_MICROSERVICE_URL;

      if (!BASE_URL) {
        return new Response("Microservice URL not found", { status: 500 });
      }

      const response = await axios.post(BASE_URL+"/analyse-interview", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    onSuccess: async (res) => {
      toast.success(
        "Your Details Received successfully! Once completed, you can visit the listing page"
      );
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
    const formData = new FormData();

    formData.append("candidate_name", data.candidate_name);
    formData.append("interviewer_name", data.interviewer_name);
    formData.append("job_description_link", data.job_description_link);

    if (checked) {
      if (data.interview_transcript) {
        formData.append("interview_transcript", data.interview_transcript);
      }
      if (selectedFile) {
        formData.append("transcript_file", selectedFile);
      }
    } else {
      if (data.interview_link) {
        formData.append("interview_link", data.interview_link);
      }
    }

    submitForm(formData);
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
          <div className="flex w-full max-w-sm items-center gap-1.5">
            <Checkbox 
              checked={checked} 
              onCheckedChange={() => setChecked(!checked)}
            />Do you want to add interview transcript?
          </div>
          {!checked ? 
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
          </div> :
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <FormField
              control={form.control}
              name="interview_transcript"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interview Transcript</FormLabel>
                  <FormControl>
                    <Input {...field} type="text" placeholder="Enter Interview Transcript Link" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <span style={{color:"red"}}>Or</span>
            <FormField
              control={form.control}
              name="transcript_file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transcript File</FormLabel>
                  <FormControl>
                  <Input
                    type="file"
                    accept=".txt,.docx,.pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        }
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