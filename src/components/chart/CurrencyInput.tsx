import { Input } from "@/components/ui/input";

type CurrencyInputProps = {
  value: number | string;
  onValueChange: (value: number | string) => void;
};

function CurrencyInput({ value, onValueChange }: CurrencyInputProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const rawValue = e.target.value.replaceAll(",", "");
    onValueChange(rawValue === "" ? "" : Number(rawValue));
  }

  return (
    <Input
      type="text"
      inputMode="numeric"
      placeholder="매출액을 입력하세요."
      value={Number(value).toLocaleString("ko-KR")}
      onChange={handleChange}
    />
  );
}

export default CurrencyInput;
