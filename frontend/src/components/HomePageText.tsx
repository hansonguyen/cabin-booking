// import '@/src/styles/homePage.css';
import { Poppins } from 'next/font/google'

const poppins = Poppins({
    weight: ['400', '700'],
    style: ['normal', 'italic'],
    subsets: ['latin'],
    display: 'swap'
  })

function TextBlock() {
    return (
        <main >
      <div className="w-full bg-[#D39F14]">
        <div className="max-w-lg space-y-4 mx-auto py-24 poppins.className white text-white text-4xl">
          <p>
          Welcome to Lake Mary Cabin’s booking website! We understand the importance of 
          spending quality time with friends and family. That’s why we’ve created this platform, 
          to make it easier for you to plan your stay at our beautiful cabin. Here, you can effortlessly book your visit, 
          check availability, and even see what exciting activities are around. So why wait? Start planning your unforgettable 
          getaway at Lake Mary Cabin today! Enjoy the simplicity of online booking and spend less time planning and more time making memories.

          </p>
        </div>
      </div>
    </main>
    );
}

export default TextBlock;