import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useLocale } from '@/hooks/useLocale';

interface TrendData {
  date: string;
  present: number;
  absent: number;
}

interface AttendanceTrendChartProps {
  data: TrendData[];
}

export default function AttendanceTrendChart({ data }: AttendanceTrendChartProps) {
  const { t } = useLocale();

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-base-100 rounded-xl border border-base-200">
        <p className="text-base-content/60">{t.common?.noData || 'No data available'}</p>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200 h-full">
      <div className="card-body p-4">
        <h3 className="card-title text-lg mb-4">{t.attendanceManagement.attendanceTrend || 'Attendance Trend'}</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(var(--b3))" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }} 
                tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                stroke="oklch(var(--bc) / 0.6)"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="oklch(var(--bc) / 0.6)"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'oklch(var(--b1))', 
                  borderColor: 'oklch(var(--b3))',
                  borderRadius: '0.5rem'
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Area 
                type="monotone" 
                dataKey="present" 
                stackId="1" 
                stroke="#22c55e" 
                fill="url(#colorPresent)" 
                name={t.attendanceManagement.statusNormal || 'Present'}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
