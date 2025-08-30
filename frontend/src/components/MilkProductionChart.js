import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const MilkProductionChart = ({ records }) => {
  const formattedData = records
    .map(record => ({
      date: new Date(record.date),
      'Morning': record.morning,
      'Evening': record.evening,
      'Total': record.total,
    }))
    .sort((a, b) => a.date - b.date);

  const last30DaysData = formattedData.filter(record => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return record.date >= thirtyDaysAgo;
  });

  if (!last30DaysData || last30DaysData.length === 0) {
    return <div className="text-center text-gray-500">No milk production data available for the last 30 days.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={last30DaysData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tickFormatter={(date) => format(date, 'MMM d')}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis label={{ value: 'Milk (L)', angle: -90, position: 'insideLeft' }} />
        <Tooltip 
          labelFormatter={(date) => format(date, 'MMMM d, yyyy')}
          formatter={(value, name) => [`${value.toFixed(2)} L`, name]}
        />
        <Legend />
        <Line type="monotone" dataKey="Total" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
        <Line type="monotone" dataKey="Morning" stroke="#82ca9d" strokeDasharray="5 5" />
        <Line type="monotone" dataKey="Evening" stroke="#ffc658" strokeDasharray="5 5" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default MilkProductionChart;
