'use client'

import {motion, useScroll, useTransform} from 'framer-motion'
import React, {useRef} from "react";
import Image from "next/image"


import m1 from '@/src/images/Mountain0.png'
import m2 from '@/src/images/Mountain1.png'
import m3 from '@/src/images/Mountain2.png'
import m4 from '@/src/images/Mountain3.png'
import m5 from '@/src/images/Mountain4.png'


// import { Poppins } from 'next/font/google'

// const poppins = Poppins({
//   weight: ['400', '700'],
//   style: ['normal', 'italic'],
//   subsets: ['latin'],
//   display: 'swap'
// })


function ParallaxApp() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["-1%", "50%"]);
  const backgroundM2 = useTransform(scrollYProgress, [0, 1], ["-1%", "-5%"]);
  const backgroundM3 = useTransform(scrollYProgress, [0, 1], ["-1%", "-10%"]);
  const backgroundM4 = useTransform(scrollYProgress, [0, 1], ["-1%", "-15%"]);
  const backgroundM5 = useTransform(scrollYProgress, [0, 1], ["-1%", "-20%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["-30%", "200%"]);
  

  return (
  <div ref={ref} className="w-full h-screen overflow-hidden relative grid place-items-center">
    <motion.h1 style = {{y: textY}} className="font-bold text-white text-5xl md:text-9xl relative z-40" >
      Lake Mary Cabin
    </motion.h1>

    <motion.div
      className="absolute inset-0 z-0 "
      style={{
        paddingTop: '70rem',
        backgroundImage: `url(${m1.src})`,
        backgroundPosition: "center", // Change this line
        backgroundSize: "cover",
        y: backgroundY,
      }}
    />
    <motion.div
      className="absolute inset-0 z-5 "
      style={{
        paddingTop: '70rem',
        backgroundImage: `url(${m2.src})`,
        backgroundPosition: "center", // And this line
        backgroundSize: "cover",  
        y: backgroundM2,
      }}
    />
    <motion.div
        className="absolute inset-0 z-20"
        style={{
          paddingTop: '70rem',
          backgroundImage: `url(${m3.src})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
          y: backgroundM3,
        }}
      />
      <motion.div
        className="absolute inset-0 z-25"
        style={{
          paddingTop: '70rem',
          backgroundImage: `url(${m4.src})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
          y: backgroundM4,
        }}
      />
      <motion.div
        className="absolute inset-0 z-30"
        style={{
          paddingTop: '70rem',
          backgroundImage: `url(${m5.src})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
          y: backgroundM5,
        }}
      />

  </div>

  )
}
export default ParallaxApp