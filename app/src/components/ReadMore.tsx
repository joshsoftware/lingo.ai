'use client'

import { useState } from "react";
import { Card } from "./ui/card";

const ReadMore = ({ summary }: { summary: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const maxLength = 50;

    // Split the text by spaces to calculate the word count
    const wordCount = summary.split(" ").length;

    const toggleExpansion = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className="w-full">
            <Card className="bg-[#fafbff] w-full flex-1 max-w-xs md:max-w-full p-4 rounded-lg break-words">
                <p className="text-sm w-full">
                    {isExpanded || wordCount <= maxLength 
                        ? summary 
                        : summary.split(" ").slice(0, maxLength).join(" ") + "..."
                    }
                </p>
                {(
                    wordCount > maxLength &&
                    <button
                        onClick={toggleExpansion}
                        className="text-blue-400 text-sm hover:underline mt-1"
                    >
                        {isExpanded ? 'Show Less' : 'Show More'}
                    </button>
                )}
            </Card>
        </div>
    );
};

export default ReadMore;
