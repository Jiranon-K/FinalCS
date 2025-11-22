import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { useLocale } from '@/hooks/useLocale';

interface StatusDistributionProps {
  stats: {
    present: number;
    absent: number;
  } | undefined;
}

export default function StatusDistributionChart({ stats }: StatusDistributionProps) {
  const { t } = useLocale();

  const data = [
    { name: t.attendanceManagement.statusNormal || 'Present', value: stats?.present || 0, color: '#22c55e' },
    { name: t.attendanceManagement.statusAbsent || 'Absent', value: stats?.absent || 0, color: '#ef4444' },
  ].filter(item => item.value > 0);

  if (data.length === 0) {
    return (
      <div className="card bg-base-100 shadow-sm border border-base-200 h-full">
        <div className="card-body p-4 flex items-center justify-center h-64">
          <p className="text-base-content/60">{t.common?.noData || 'No data available'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200 h-full">
      <div className="card-body p-4">
        <h3 className="card-title text-lg mb-4">{t.attendanceManagement.statusDistribution || 'Status Distribution'}</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'oklch(var(--b1))', 
                  borderColor: 'oklch(var(--b3))',
                  borderRadius: '0.5rem'
                }}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
