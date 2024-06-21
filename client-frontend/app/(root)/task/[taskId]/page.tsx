"use client"
import { Appbar } from '@/components/Appbar';
import { BACKEND_URL } from '@/utils';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { createCanvas } from 'canvas';
const  Chart =require ('chart.js');
import PieChart from './pieChart';
const width = 400; // Width of the canvas
const height = 400; // Height of the canvas
// const canvas = createCanvas(width, height);
// const ctx = canvas.getContext('2d');

let total_options ;
let values : number [];
let labels : string [];

async function getTaskDetails(taskId: string) {
    
console.log(taskId)
// console.log("reached the endpoint")
    const response = await axios.get(`${BACKEND_URL}/v1/user/tasksubmitted?task_id=${taskId}`, {
        headers: {
            "Authorization": localStorage.getItem("token")
        }
    })
    total_options=response.data.total_options
    console.log("Total options are ",total_options)
    console.log(response.data)
    return response.data
}


export default function Page({params: { 
    taskId 
}}: {params: { taskId: string }}) {
    const [result, setResult] = useState<Record<string, {
        count: number;
        option: {
            imageUrl: string
        }
    }>>({});
    const [taskDetails, setTaskDetails] = useState<{
        title?: string
    }>({});

    useEffect(() => {
        getTaskDetails(taskId)
            .then((data) => {
                setResult(data.result)
                setTaskDetails(data.taskDetails)
                
            })
    }, [taskId]);
    const labels = Object.keys(result).map((key, index) => `Option ${index + 1}`);
    const values = Object.values(result).map(option => option.count);
    
    return <div>
        <Appbar />
        <div className='text-2xl pt-20 flex justify-center'>
            {taskDetails.title}
        </div>
        <div className='flex justify-center pt-8'>
            {Object.keys(result || {}).map(taskId => <Task imageUrl={result[taskId].option.imageUrl} votes={result[taskId].count} />)}
        </div>
        <div>
        <PieChart values={values} labels={labels} />
        </div>
    </div>
}

function Task({imageUrl, votes}: {
    imageUrl: string;
    votes: number;
}) {
    return <div>
        <img className={"p-2 w-96 rounded-md"} src={imageUrl} />
        <div className='flex justify-center'>
            {votes}
        </div>
    </div>
}