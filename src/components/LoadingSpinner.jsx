export default function LoadingSpinner({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-10 h-10 border-4 border-[#111C4A]/20 border-t-[#111C4A] rounded-full animate-spin" />
      <p className="text-sm font-medium text-gray-400">{text}</p>
    </div>
  );
}
