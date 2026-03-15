import React from 'react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ForecastChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis 
          dataKey="interval" 
          stroke="#94a3b8" 
          tick={{ fill: '#64748b' }} 
          tickMargin={10}
        />
        <YAxis 
          yAxisId="left" 
          tickFormatter={(val) => `${val}%`}
          stroke="#94a3b8"
          domain={[0, 100]}
        />
        <YAxis 
          yAxisId="right" 
          orientation="right" 
          tickFormatter={(val) => `${val}m`}
          stroke="#94a3b8"
        />
        <Tooltip 
          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}
        />
        <Legend wrapperStyle={{ paddingTop: '20px' }} />
        
        <Area 
          yAxisId="left" 
          type="monotone" 
          dataKey="confidence_upper" 
          stroke="none" 
          fill="#0ea5e9" 
          fillOpacity={0.1} 
          name="Confidence Interval" 
        />
        <Area 
          yAxisId="left" 
          type="monotone" 
          dataKey="confidence_lower" 
          stroke="none" 
          fill="#f8fafc" 
          fillOpacity={1} 
          name="" 
          legendType="none"
        />
        
        <Line 
          yAxisId="left"
          type="monotone" 
          dataKey="predicted_occupancy" 
          stroke="#0ea5e9" 
          strokeWidth={3}
          name="Occupancy %"
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line 
          yAxisId="right"
          type="monotone" 
          dataKey="predicted_wait" 
          stroke="#f43f5e" 
          strokeWidth={3}
          strokeDasharray="5 5"
          name="Wait Time"
          dot={{ r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
