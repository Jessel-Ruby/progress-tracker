
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { subDays } from 'date-fns';

export default function Heatmap({ data }) {
  const today = new Date();
  const startDate = subDays(today, 365);

  return (
    <div className="w-full">
      <style>{`
        .react-calendar-heatmap .color-empty { fill: rgba(255, 255, 255, 0.05); }
        .react-calendar-heatmap .color-scale-1 { fill: #00f3ff40; }
        .react-calendar-heatmap .color-scale-2 { fill: #00f3ff80; }
        .react-calendar-heatmap .color-scale-3 { fill: #00f3ffc0; }
        .react-calendar-heatmap .color-scale-4 { fill: #00f3ff; }
      `}</style>
      <CalendarHeatmap
        startDate={startDate}
        endDate={today}
        values={data}
        classForValue={(value) => {
          if (!value) {
            return 'color-empty';
          }
          const count = value.count;
          if (count >= 4) return 'color-scale-4';
          if (count >= 3) return 'color-scale-3';
          if (count >= 2) return 'color-scale-2';
          return 'color-scale-1';
        }}
        tooltipDataAttrs={(value) => {
          if (!value || !value.date) return { 'data-tip': 'No contributions' };
          return {
            'data-tip': `${value.count} contributions on ${value.date}`,
          };
        }}
        showWeekdayLabels={true}
      />
    </div>
  );
}
