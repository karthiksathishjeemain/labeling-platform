import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register necessary components
ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartProps {
    values: number[];
    labels: string[];
}

const PieChart: React.FC<PieChartProps> = ({ values, labels }) => {
    const data = {
        labels: labels,
        datasets: [{
            data: values,
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
            hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
            },
        },
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <div style={{ width: '300px', height: '300px' }}>
                <h2 style={{ textAlign: 'center' }}>Pie Chart Analysis</h2>
                <Pie data={data} options={options} />
            </div>
        </div>
    );
};

export default PieChart;
