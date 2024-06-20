"use client";
import { Appbar } from "@/components/Appbar";
import { NextTask } from "@/components/NextTask";
import Image from "next/image";
import { useState } from "react";

export default function Home() {

  return (
    <main>
      <Appbar />
      <NextTask/>
    </main>
  );
}