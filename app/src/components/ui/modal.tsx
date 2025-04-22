import * as React from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  showCloseButton = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className={cn(
          "relative w-full max-w-lg rounded-xl bg-white p-6 shadow-lg transition-all",
          className
        )}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        )}
        {title && <h2 className="mb-4 text-lg font-semibold">{title}</h2>}
        <div>{children}</div>
      </div>
    </div>
  );
};

export { Modal };
