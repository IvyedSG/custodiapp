'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

const COLORS = ['#2ECC71', '#F1C40F', '#E74C3C']

// Define proper types for the chart data instead of using 'any'
interface PieChartData {
  name: string
  value: number
}

interface BarChartData {
  locker: string | number
  items: number
}

interface PieChartProps {
  data: PieChartData[]
}

interface BarChartProps {
  data: BarChartData[]
}

export function LockerStatusPieChart({ data }: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function LockerOccupancyBarChart({ data }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="locker" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="items" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  )
}

