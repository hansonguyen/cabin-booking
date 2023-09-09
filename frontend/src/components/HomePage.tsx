'use client'
import '@/src/styles/homePage.css';

import {Parallax, ParallaxLayer} from '@react-spring/parallax'
import Image from "next/image"

import background from '@/src/images/background.png'
import j1 from '@/src/images/jungle1.png'
import j2 from '@/src/images/jungle2.png'
import j3 from '@/src/images/jungle3.png'
import j4 from '@/src/images/jungle4.png'
import j5 from '@/src/images/jungle5.png'
import logo from '@/src/images/logo_land.png'
import man from '@/src/images/man_on_mountain.png'
import mountain from '@/src/images/mountains.png'

import TextBlock  from './HomePageText'



// import { Poppins } from 'next/font/google'

// const poppins = Poppins({
//   weight: ['400', '700'],
//   style: ['normal', 'italic'],
//   subsets: ['latin'],
//   display: 'swap'
// })


function ParallaxApp() {

    return (
        <div>
        
        <Parallax pages={2} style={{ top: '0', left: '0' }} className="animation">
            <ParallaxLayer offset={0} speed={0.25} >
                <Image className="animation_layer parallax" src = {background} quality = {100} fill sizes= "10vw" style = {{objectFit: 'cover'}} alt= "hanson"/>
            </ParallaxLayer>
            <ParallaxLayer offset={0} speed={0.3}>
                <Image className="animation_layer parallax" src = {mountain} quality = {100}fill sizes= "10vw" style = {{objectFit: 'cover'}} alt= "hanson"/>    
            </ParallaxLayer>
            {/* <ParallaxLayer offset={0} speed={-0.3}>
                <Image className="animation_layer parallax" src = {logo} quality = {100}fill sizes= "10vw" style = {{objectFit: 'cover'}} alt= "hanson"/>
            </ParallaxLayer>
            <ParallaxLayer offset={0} speed={0.3}>
                <Image className="animation_layer parallax" src = {j1}quality = {100} fill sizes= "10vw" style = {{objectFit: 'cover'}} alt= "hanson"/>
            </ParallaxLayer>
            <ParallaxLayer offset={0} speed={0.35}>
                <Image className="animation_layer parallax" src = {j2} quality = {100}fill sizes= "10vw" style = {{objectFit: 'cover'}} alt= "hanson"/>
            </ParallaxLayer>
            <ParallaxLayer offset={0} speed={0.5}>
                <Image className="animation_layer parallax" src = {j3} quality = {100}fill sizes= "10vw" style = {{objectFit: 'cover'}} alt= "hanson"/>
            </ParallaxLayer>
            <ParallaxLayer offset={0} speed={0.45}>
                <Image className="animation_layer parallax" src = {j4} quality = {100}fill sizes= "10vw" style = {{objectFit: 'cover'}} alt= "hanson"/>
            </ParallaxLayer>
            <ParallaxLayer offset={0} speed={0.40}>
                <Image className="animation_layer parallax" src = {man} quality = {100}fill sizes= "10vw" style = {{objectFit: 'cover'}} alt= "hanson"/>
            </ParallaxLayer>
            <ParallaxLayer offset={0} speed={0.35}>
                <Image className="animation_layer parallax" src = {j5} quality = {100}fill sizes= "10vw" style = {{objectFit: 'cover'}} alt= "hanson"/>
            </ParallaxLayer> */}
            <ParallaxLayer offset={1} speed={0.5}>
                <TextBlock/>
            </ParallaxLayer>
      </Parallax>
    </div>
    )
  }
export default ParallaxApp