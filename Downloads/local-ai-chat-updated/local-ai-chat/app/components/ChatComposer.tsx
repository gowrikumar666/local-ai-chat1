"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { Mic, MicOff, Paperclip, Send, Square, X } from "lucide-react";
import { Button, IconButton } from "@mui/material";

type SpeechRecognitionResult = {
  isFinal: boolean;
  [index: number]: { transcript: string } | undefined;
};

type SpeechRecognitionEvent = {
  results: ArrayLike<SpeechRecognitionResult>;
};

type SpeechRecognitionErrorEvent = {
  error: string;
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

type Props = {
  value: string;
  disabled: boolean;
  pendingFile: File | null;
  onChange: (value: string) => void;
  onFileChange: (file: File | null) => void;
  onSend: () => void;
  onStop: () => void;
  modelName: string;
};

export const ChatComposer = memo(function ChatComposer({
  value,
  disabled,
  pendingFile,
  onChange,
  onFileChange,
  onSend,
  onStop,
  modelName,
}: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechMessage, setSpeechMessage] = useState("");
  const canSend = Boolean(value.trim() || pendingFile);

  useEffect(() => {
    const speechWindow = window as SpeechWindow;
    setSpeechSupported(
      window.isSecureContext &&
        Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition),
    );

    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    const node = inputRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 160)}px`;
  }, [value]);

  const handleFileInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      onFileChange(file);
      event.target.value = "";
    },
    [onFileChange],
  );

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    recognitionRef.current = null;
    setIsListening(false);
    setSpeechMessage("");
    recognition.stop();
  }, []);

  const handleSend = useCallback(() => {
    if (isListening) stopListening();
    onSend();
  }, [isListening, onSend, stopListening]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
      return;
    }

    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition || !window.isSecureContext) {
      setSpeechMessage("Voice input is unavailable in this browser or connection.");
      return;
    }

    const recognition = new Recognition();
    const initialValue = value;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";
    recognition.onresult = (event) => {
      if (recognitionRef.current !== recognition) return;
      let finalTranscript = "";
      let interimTranscript = "";
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result?.[0]?.transcript ?? "";
        if (result?.isFinal) finalTranscript += transcript;
        else interimTranscript += transcript;
      }
      const spokenText = `${finalTranscript}${interimTranscript}`.trim();
      const separator = initialValue && spokenText ? (initialValue.endsWith(" ") ? "" : " ") : "";
      onChange(`${initialValue}${separator}${spokenText}`);
    };
    recognition.onerror = (event) => {
      if (recognitionRef.current !== recognition) return;
      recognitionRef.current = null;
      setIsListening(false);
      setSpeechMessage(
        event.error === "not-allowed"
          ? "Microphone access was blocked. Allow it in your browser settings to dictate."
          : `Voice input stopped (${event.error}).`,
      );
    };
    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return;
      recognitionRef.current = null;
      setIsListening(false);
      setSpeechMessage("");
    };

    recognitionRef.current = recognition;
    setSpeechMessage("Listening. Your browser may send audio to its speech service.");
    setIsListening(true);
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      setSpeechMessage("Could not start voice input. Check microphone access and try again.");
    }
  }, [isListening, onChange, stopListening, value]);

  return (
    <div className="chat-composer">
      <div className="chat-composer__shell">
        {pendingFile && (
          <div className="chat-file-chip">
            <Paperclip size={14} />
            <span className="chat-file-chip__name" title={pendingFile.name}>
              {pendingFile.name}
            </span>
            <button
              type="button"
              className="chat-file-chip__remove"
              aria-label="Remove file"
              disabled={disabled}
              onClick={() => onFileChange(null)}
            >
              <X size={14} />
            </button>
          </div>
        )}
        <div className="chat-composer__inner">
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,.pdf"
            hidden
            onChange={handleFileInput}
          />
          <IconButton
            aria-label="Upload PDF"
            disabled={disabled}
            onClick={() => fileRef.current?.click()}
            sx={{
              width: { xs: 36, sm: 40 },
              height: { xs: 36, sm: 40 },
              flexShrink: 0,
              color: pendingFile ? "#ef6f61" : "#64748b",
            }}
          >
            <Paperclip size={18} />
          </IconButton>
          <textarea
            ref={inputRef}
            value={value}
            onChange={(event) => {
              if (isListening) stopListening();
              onChange(event.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder={pendingFile ? "Ask about this PDF..." : "Message Morrow..."}
            rows={1}
            disabled={disabled}
            className="chat-composer-input"
          />
          <IconButton
            aria-label={isListening ? "Stop voice input" : "Start voice input"}
            title={
              speechSupported
                ? "Voice input (your browser may send audio to its speech service)"
                : "Voice input requires a supported browser and a secure connection"
            }
            disabled={disabled || !speechSupported}
            onClick={toggleListening}
            sx={{
              width: { xs: 36, sm: 40 },
              height: { xs: 36, sm: 40 },
              flexShrink: 0,
              color: isListening ? "#ef6f61" : "#64748b",
              bgcolor: isListening ? "rgba(239, 111, 97, 0.12)" : "transparent",
            }}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </IconButton>
          <Button
            onClick={disabled ? onStop : handleSend}
            disabled={!disabled && !canSend}
            aria-label={disabled ? "Stop generating" : "Send message"}
            sx={{
              minWidth: 40,
              width: { xs: 40, sm: 44 },
              height: { xs: 40, sm: 44 },
              flexShrink: 0,
              borderRadius: 3,
              bgcolor: "#ef6f61",
              color: "white",
              "&:hover": { bgcolor: "#e35e4e" },
              "&:disabled": { bgcolor: "#d1d5db" },
              p: 0,
            }}
          >
            {disabled ? <Square size={16} fill="currentColor" /> : <Send size={18} />}
          </Button>
        </div>
      </div>
      {speechMessage && (
        <p className="chat-composer__hint" role="status" aria-live="polite">
          {speechMessage}
        </p>
      )}
      <p className="chat-composer__hint">{`Upload a PDF to extract accurate data • Ollama ${modelName}`}</p>
    </div>
  );
});
