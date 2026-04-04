import React from "react";
import { cn } from "@/lib/utils";

interface TranscriberBarProps {
  text: string;
  isListening: boolean;
}

const TranscriberBar: React.FC<TranscriberBarProps> = ({ text, isListening }) => {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className={cn(
        "rounded-xl border bg-card p-4 transition-all duration-300",
        isListening && "border-primary/50 shadow-sm"
      )}>
        <div className="flex items-center gap-3">
          {isListening && (
            <div className="flex items-end gap-0.5 h-6">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-1 bg-primary rounded-full"
                  style={{
                    animation: `sound-wave 0.8s ease-in-out ${i * 0.15}s infinite`,
                    height: "8px",
                  }}
                />
              ))}
            </div>
          )}
          <p className={cn(
            "text-sm flex-1 min-h-[1.5rem]",
            text ? "text-foreground" : "text-muted-foreground"
          )}>
            {text || (isListening ? "Listening..." : "Click start to begin")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TranscriberBar;
