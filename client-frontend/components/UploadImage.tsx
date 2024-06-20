"use client"
import { BACKEND_URL, CLOUDFRONT_URL } from "../utils/index";
import axios from "axios";
import { useState } from "react"

export function UploadImage({ onImageAdded, image }: {
    onImageAdded: (image: string) => void;
    image?: string;
}) {
    const [uploading, setUploading] = useState(false);

    async function onFileSelect(e: any) {
        console.log(e.target.files[0])
        setUploading(true);
        try {
            const file = e.target.files[0];
            const response = await axios.get(`${BACKEND_URL}/v1/user/presignedUrl`, {
                headers: {
                    "Authorization": localStorage.getItem("token")
                }
            });
           
            const presignedUrl = response.data.url;
            // console.log("presigned url is ",presignedUrl)

            const formData = new FormData();
            formData.set("bucket", response.data.fields["bucket"])
            formData.set("Content-type", response.data.fields["Content-type"])
            formData.set("X-Amz-Algorithm", response.data.fields["X-Amz-Algorithm"]);
            formData.set("X-Amz-Credential", response.data.fields["X-Amz-Credential"]);
            formData.set("X-Amz-Algorithm", response.data.fields["X-Amz-Algorithm"]);
            formData.set("X-Amz-Date", response.data.fields["X-Amz-Date"]);
            formData.set("key", response.data.fields["key"]);
            formData.set("Policy", response.data.fields["Policy"]);
            formData.set("X-Amz-Signature", response.data.fields["X-Amz-Signature"]);
            formData.set("X-Amz-Algorithm", response.data.fields["X-Amz-Algorithm"]);
            formData.append("file", file);
            console.log("bande bidtu")
            console.log("presigned url is ",presignedUrl)
            // console.log("X- algo  is ",response.data.fields["key"])   
            console.log("bucket", response.data.fields["bucket"])
            console.log("X-Amz-Algorithm", response.data.fields["X-Amz-Algorithm"]);
            console.log("X-Amz-Credential", response.data.fields["X-Amz-Credential"]);
            console.log("X-Amz-Algorithm", response.data.fields["X-Amz-Algorithm"]);
            console.log("X-Amz-Date", response.data.fields["X-Amz-Date"]);
            console.log("key", response.data.fields["key"]);
            console.log("Policy", response.data.fields["Policy"]);
            console.log("X-Amz-Signature", response.data.fields["X-Amz-Signature"]);
            console.log("X-Amz-Algorithm", response.data.fields["X-Amz-Algorithm"]);
            console.log("file", file);
        
            const awsResponse = await axios.post(presignedUrl, formData);
            console.log("the respone from aws is",awsResponse)
            onImageAdded(`${CLOUDFRONT_URL}/${response.data.fields["key"]}`);
        } catch(e) {
            console.log("error bantu")
            console.log(e)
        }
        setUploading(false);
    }

    if (image) {
        return <img className={"p-2 w-96 rounded"} src={image} />
    }

    return <div>
        <div className="w-40 h-40 rounded border text-2xl cursor-pointer">
                <div className="h-full flex justify-center flex-col relative w-full">
                    <div className="h-full flex justify-center w-full pt-16 text-4xl">
                    {uploading ? <div className="text-sm">Loading...</div> : <>
                        +
                        <input className="w-full h-full bg-red-400 w-40 h-40" type="file" style={{position: "absolute", opacity: 0, top: 0, left: 0, bottom: 0, right: 0, width: "100%", height: "100%"}} onChange={onFileSelect} />
                    </>}
                </div>
            </div>
        </div>
    </div>
}