import Link from "next/link"
import Image from "next/image"
import Parallax from "@/src/components/Parallax"
import m1 from '@/src/images/Mountain0.jpg'
import TextBlock  from '@/src/components/HomePageText'
function App() {
  return (
    <div className="App">
      <div className="flex justify-center items-center h-screen">
        <Parallax/>      
      </div >
    </div>
  )
}

export default App