import { useEffect, useState } from "react";

const MESSAGE_INTERVAL_MS = 1600;

export default function LoadingSpinner({
  text = "Loading...",
  messages,
  fullScreen = false,
}) {
  const [messageIndex, setMessageIndex] = useState(0);
  const messageCount = messages && messages.length > 0 ? messages.length : 0;

  useEffect(() => {
    if (messageCount === 0) return undefined;
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % messageCount);
    }, MESSAGE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [messageCount]);

  const label = messageCount > 0 ? messages[messageIndex] : text;

  const content = (
    <>
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-sm font-medium text-text-muted">{label}</p>
    </>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-bg-base flex items-center justify-center">
        {content}
      </div>
    );
  }

  return <div className="flex flex-col items-center justify-center py-20 gap-4">{content}</div>;
}
