import { useState } from "react";
import { Input } from "@/components/ui/input";

function CurrencyInput({ amountProp }: { amountProp?: number }) {
  const [amount, setAmount] = useState<number>(amountProp || 0);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replaceAll(",", "");
    const numericValue = Number(rawValue);

    if (!isNaN(numericValue)) {
      setAmount(numericValue);
    }
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      id="amount"
      name="amount"
      placeholder="매출액을 입력하세요."
      value={amount.toLocaleString("ko-KR")}
      onChange={handleAmountChange}
    />
  );
}

export default CurrencyInput;
