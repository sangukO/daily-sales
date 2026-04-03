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
  // 숫자를 1,000 단위 콤마 포맷으로 변환
  const formatted = value === 0 ? "" : value.toLocaleString("ko-KR");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // 콤마 제거 후 숫자만 추출
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
        className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-8 text-right text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
        원
      </span>
    </div>
  );
}
