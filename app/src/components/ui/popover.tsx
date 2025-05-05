import * as React from "react";
import { cn } from "@/lib/utils";

interface PopoverProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
    trigger: React.ReactNode;
    align?: "left" | "right" | "center";
}

const Popover: React.FC<PopoverProps> = ({
    isOpen,
    onClose,
    children,
    className,
    trigger,
    align = "right",
}) => {
    const [isPopoverVisible, setPopoverVisible] = React.useState(false);
    const triggerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        setPopoverVisible(isOpen);
    }, [isOpen]);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        if (isPopoverVisible) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isPopoverVisible, onClose]);

    const alignmentClasses = {
        right: "right-0",
        left: "left-0",
        center: "left-1/2 -translate-x-1/2",
    };

    return (
        <div className="relative inline-block" ref={triggerRef}>
            <div onClick={() => setPopoverVisible((prev) => !prev)}>{trigger}</div>
            {isPopoverVisible && (
                <div
                    className={cn(
                        "absolute z-50 mt-2 min-w-[8rem] rounded-md bg-white shadow-lg border border-gray-200 p-2",
                        alignmentClasses[align],
                        className
                    )}
                >
                    {children}
                </div>
            )}
        </div>
    );
};

export { Popover };
