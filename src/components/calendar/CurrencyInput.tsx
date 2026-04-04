"use client";

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
}

export default function CurrencyInput({
  value,
  onChange,
  placeholder = "0",
}: CurrencyInputProps) {
  const formatted = value === 0 ? "" : value.toLocaleString("ko-KR");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    onChange(raw === "" ? 0 : Number(raw));
  }

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        value={formatted}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#DDD3C2] bg-white px-4 py-3.5 pr-10 text-right font-(family-name:--font-playfair) text-2xl font-semibold text-[#1C1208] placeholder-[#C8BAA8] focus:border-[#B5732A] focus:outline-none transition-colors"
      />
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#9E8E7A]">
        원
      </span>
    </div>
  );
}
