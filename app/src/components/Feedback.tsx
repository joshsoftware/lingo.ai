'use client'

import { useState } from 'react';
import './Feedback.css';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Button } from './ui/button';
import React from 'react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';
import { feedBackProps } from '@/types/transcriptions';
import { Messages } from '@/constants/messages';

const Feedback = (props: feedBackProps) => {
    const { analysisId } = props;
    const [feedback, setFeedback] = useState("");
    const [error, setError] = useState("");
    const [isFoundUseful, setIsFoundUseful] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isPositiveFeedbackLoading, setIsPositiveFeedbackLoading] = useState(false);
    const [isNegativeFeedbackLoading, setIsNegativeFeedbackLoading] = useState(false);
    const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false);


    const onFeedback = (liked: boolean) => {
        setIsFoundUseful(liked);
        if (liked) {
            const requestBody = {
                comment: feedback,
                isFoundUseful: isFoundUseful,
                analysisId: analysisId
            }
            SaveAnalysisFeedBack(requestBody);
        } else {
            setError("");
            setOpenDialog(true);
        }
    }

    const { mutate: SaveAnalysisFeedBack } = useMutation({
        mutationKey: ["SaveAnalysisFeedBack"],
        mutationFn: async (payload: any) => {
            setIsLoading(true);
            setIsPositiveFeedbackLoading(payload.isFoundUseful ?? false);
            setIsNegativeFeedbackLoading(!(payload.isFoundUseful ?? true));
            const response = await axios.post("/api/feedback", payload);
            return response;
        },
        onSuccess: async (res: any) => {
            setIsLoading(false);
            setIsLoading(true);
            setIsPositiveFeedbackLoading(false);
            setIsNegativeFeedbackLoading(false);
            setIsFeedbackSubmitted(true);
            toast.success("Thanks for your feedback!");
            handleClose(true);
        },
        onError: (error) => {
            setError(Messages.CUSTOM_ERROR);
            setIsLoading(false);
            setIsPositiveFeedbackLoading(false);
            setIsNegativeFeedbackLoading(false);
        },
    });

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setFeedback(e.target.value);
    };

    const handleClose = (forceClose: boolean = false) => {
        if(isLoading && !forceClose) {
            return;
        }
        setOpenDialog(false);
    };

    const handleSubmit = async () => {
        if (feedback.trim() === "") {
            setError("This field is required.");
        } else {
            const requestBody = {
                comment: feedback,
                isFoundUseful: isFoundUseful,
                analysisId: analysisId
            }
            SaveAnalysisFeedBack(requestBody);
            setError("");
        }
    };

    return (
        <div className="absolute bottom-4 right-4 flex flex-col rounded-2xl bg-[#ffffff] shadow-xl px-4 py-2 border">
            {(!isFeedbackSubmitted &&
                <div className="flex flex-col p-2">
                    <div className="text-lg text-[#374151]">Was this helpful?</div>
                    <div className="flex justify-end pt-2">
                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                onFeedback(true);
                            }}
                            isLoading={isPositiveFeedbackLoading}
                            disabled={isLoading || isPositiveFeedbackLoading || isNegativeFeedbackLoading}
                            className="feedback-positive-button bg-[#ffffff] text-[#ffffff]   text-base  p-3 rounded-lg hover:bg-green-700 active:scale-95 transition-transform transform">
                            <ThumbsUp className='w-8 h-8' />
                        </Button>
                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                onFeedback(false);
                            }}
                            isLoading={isNegativeFeedbackLoading}
                            disabled={isLoading || isPositiveFeedbackLoading || isNegativeFeedbackLoading}
                            className="feedback-negative-button ml-2 bg-[#ffffff] text-[#ffffff]   text-base  p-3 rounded-lg hover:bg-red-700 active:scale-95 transition-transform transform">
                            <ThumbsDown className='w-8 h-8' />
                        </Button>
                    </div>
                </div>
            )}
            {(openDialog &&
                <div className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
                    <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                    <h3 className="text-xl text-black">Help us improve!</h3>
                                    <p className="text-s text-gray-500 mb-4">Share your suggestions to help us improve.</p>
                                    <div className="flex flex-col items-center">
                                        <button
                                            onClick={() => handleClose()}
                                            className="absolute text-xl top-2 right-4 text-gray-500 hover:text-gray-700"
                                            aria-label="Close modal"
                                        >
                                            &times;
                                        </button>
                                        <textarea
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            cols={6}
                                            rows={5}
                                            onChange={handleTextareaChange}
                                            placeholder="Type here..."
                                            maxLength={2000}
                                        />
                                    </div>
                                    {error && <p className="text-red-500 mt-1">{error}</p>}

                                    <div className="flex flex-col justify-center items-center w-full md:flex-row gap-4 mt-4">
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSubmit();
                                        }}
                                        isLoading={isLoading}
                                        disabled={isLoading}
                                        className="flex gap-2 bg-[#3f51b5] hover:bg-[#303f9f] text-white"
                                    >
                                        {isLoading ? "Hang on" : "Submit"}
                                    </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            )}
        </div>
    );
};

export default Feedback;
