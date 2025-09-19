import Calendar21 from "../components/calendar-21";
import Calendar27 from "../components/calendar-27";
import ChartLine from "../components/chart/ChartLine";
import { Label } from "../components/ui/label";
import { useState } from "react";
import { Switch } from "../components/ui/switch";

function Dashboard() {
  const [chartMode, setChartMode] = useState(false);

  return (
    <>
      <div className="flex flex-col w-full justify-center items-center gap-4">
        <div className="flex flex-col w-full items-center gap-2">
          <div className="flex items-center justify-end space-x-2">
            <Label htmlFor="chart-mode">차트 보기</Label>
            <Switch
              id="chart-mode"
              onCheckedChange={() => {
                setChartMode(!chartMode);
              }}
            />
          </div>
          {chartMode ? <ChartLine /> : <Calendar21 />}
        </div>
      </div>
    </>
  );
}

export default Dashboard;
