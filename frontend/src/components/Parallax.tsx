'use client'

import {motion, useScroll, useTransform} from 'framer-motion'
import React, {useRef} from "react";
import Image from "next/image"


import m1 from '@/src/images/tahoe.jpg'


function ParallaxApp() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const textY = useTransform(scrollYProgress, [0, 1], ["-30%", "400%"]);
  

  return (
  <div ref={ref} className="w-full h-screen grid place-items-center relative">
    <motion.h1 style = {{y: textY}} className="font-bold text-black text-5xl md:text-9xl absolute z-40 top-1/4 transform -translate-x-1/2">
      LM Cabin
    </motion.h1>
    <Image src={m1} alt="Background Image"/>
  

  </div>

  )
}
export default ParallaxApp