import { formatDhivehiDate } from "@/lib/articles";

// Calendar-style date: the day large, the month and year stacked small beside
// it, and optionally the time after a second divider.
export default function DateStamp({ date, time, className }: { date: string; time?: string; className?: string }) {
  const full = formatDhivehiDate(date);
  const [day, month, year] = full.split(" ");
  return (
    <div className={className ? `date-stamp ${className}` : "date-stamp"} aria-label={time ? `${full} - ${time}` : full}>
      <b className="num" aria-hidden="true">
        {day}
      </b>
      <i aria-hidden="true" />
      <span aria-hidden="true">
        <span>{month}</span>
        <span className="num">{year}</span>
      </span>
      {time && (
        <>
          <i aria-hidden="true" />
          <span className="num stamp-time" aria-hidden="true">
            {time}
          </span>
        </>
      )}
    </div>
  );
}
