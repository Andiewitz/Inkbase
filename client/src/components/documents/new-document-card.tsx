import { motion } from "framer-motion";

export function NewDocumentCard({
  title,
  subtitle,
  icon,
  onClick,
  disabled,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <motion.button
        type="button"
        onClick={onClick}
        disabled={disabled}
        whileHover={disabled ? {} : { y: -2 }}
        whileTap={disabled ? {} : { scale: 0.98 }}
        className={`aspect-[3/4] w-full rounded-xl border flex items-center justify-center bg-white shadow-xs transition-all ${
          disabled
            ? "border-gray-200 opacity-50 cursor-not-allowed bg-gray-50"
            : "border-gray-200 hover:border-blue-500 hover:shadow-md cursor-pointer"
        }`}
      >
        {icon ? (
          icon
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </div>
        )}
      </motion.button>
      <span className="mt-2 text-xs font-medium text-gray-900 text-center truncate max-w-full">
        {title}
      </span>
      {subtitle && (
        <span className="text-[10px] text-gray-400 text-center truncate max-w-full">
          {subtitle}
        </span>
      )}
    </div>
  );
}
