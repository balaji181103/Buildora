"use client"

import { useState, useEffect } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const generateData = () => [
  { name: "Jan", total: Math.floor(Math.random() * 415000) + 83000 },
  { name: "Feb", total: Math.floor(Math.random() * 415000) + 83000 },
  { name: "Mar", total: Math.floor(Math.random() * 415000) + 83000 },
  { name: "Apr", total: Math.floor(Math.random() * 415000) + 83000 },
  { name: "May", total: Math.floor(Math.random() * 415000) + 83000 },
  { name: "Jun", total: Math.floor(Math.random() * 415000) + 83000 },
  { name: "Jul", total: Math.floor(Math.random() * 415000) + 83000 },
  { name: "Aug", total: Math.floor(Math.random() * 415000) + 83000 },
  { name: "Sep", total: Math.floor(Math.random() * 415000) + 83000 },
  { name: "Oct", total: Math.floor(Math.random() * 415000) + 83000 },
  { name: "Nov", total: Math.floor(Math.random() * 415000) + 83000 },
  { name: "Dec", total: Math.floor(Math.random() * 415000) + 83000 },
];

export function OverviewChart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    setData(generateData());
  }, []);

  if (!data.length) {
    return (
      <div style={{ width: '100%', height: 350 }} className="flex items-center justify-center">
        <div>Loading Chart...</div>
      </div>
    );
  }
  
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `₹${value / 1000}k`}
        />
        <Tooltip
            contentStyle={{
                background: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
            formatter={(value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)}
        />
        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
