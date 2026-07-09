import { useEffect, useState } from "react";

export default function ProgressBar({ isLoading, text = "" }) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let interval;
    let timeout;

    if (isLoading) {
      setVisible(true);
      setProgress(0);

      // Fast initial progress to 90% in ~1.2s
      const startTime = Date.now();
      const duration = 1200;

      interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min(90, (elapsed / duration) * 90);
        setProgress(newProgress);
      }, 16);

      // Hold at 90% until loading completes
      // The final jump to 100% will happen on cleanup
    } else if (visible) {
      setProgress(100);
      timeout = setTimeout(() => {
        setVisible(false);
      }, 200);
    }

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isLoading, visible]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-100 overflow-hidden">
      <div className="h-full bg-[#111C4A] transition-all duration-200 ease-out" style={{ width: `${progress}%` }} />
    </div>
  );
}
