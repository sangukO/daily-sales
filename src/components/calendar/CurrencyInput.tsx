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
    <div className="relative border-2 border-black flex items-center">
      <input
        type="text"
        inputMode="numeric"
        value={formatted}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full bg-white px-4 py-4 pr-14 text-right text-4xl font-black text-black placeholder-(--gray-4) focus:outline-none tabular-nums"
      />
      <span className="absolute right-4 text-xl font-bold text-(--gray-2) pointer-events-none">
        원
      </span>
    </div>
  );
}
