import React from "react";
import { cn } from "@/lib/utils";

interface VoiceAvatarProps {
  type: "agent" | "user";
  isSpeaking: boolean;
  size?: "sm" | "md" | "lg";
}

const VoiceAvatar: React.FC<VoiceAvatarProps> = ({ type, isSpeaking, size = "lg" }) => {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={cn(
          "rounded-full flex items-center justify-center transition-all duration-500",
          sizeClasses[size],
          type === "agent" ? "bg-primary/10" : "bg-success/10",
          isSpeaking && type === "agent" && "glow-agent animate-pulse-glow",
          isSpeaking && type === "user" && "glow-user animate-pulse-glow",
          !isSpeaking && "glow-none"
        )}
      >
        <div
          className={cn(
            "rounded-full flex items-center justify-center transition-all duration-300",
            size === "lg" ? "w-24 h-24" : size === "md" ? "w-18 h-18" : "w-12 h-12",
            type === "agent" ? "bg-primary/20" : "bg-success/20"
          )}
        >
          {type === "agent" ? (
            <svg className={cn("transition-colors", type === "agent" ? "text-primary" : "text-success")} width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2a4 4 0 0 1 4 4v4a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4Z" />
              <path d="M9 18h6" />
              <path d="M12 18v4" />
              <rect x="3" y="8" width="3" height="6" rx="1.5" />
              <rect x="18" y="8" width="3" height="6" rx="1.5" />
            </svg>
          ) : (
            <svg className="text-success" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="8" r="4" />
              <path d="M5 20a7 7 0 0 1 14 0" />
            </svg>
          )}
        </div>
      </div>
      <span className="text-sm font-medium text-muted-foreground">
        {type === "agent" ? "AI Agent" : "You"}
      </span>
    </div>
  );
};

export default VoiceAvatar;
