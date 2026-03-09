import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

export default function TrendChart({ data, color }) {
  const chartData = data.map((val, i) => ({ day: i, value: val }));
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const padding = (max - min) * 0.2 || 1;

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
          <YAxis domain={[min - padding, max + padding]} hide />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={3} 
            dot={false}
            isAnimationActive={true}
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
