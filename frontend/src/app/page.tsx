import Link from "next/link"
import Image from "next/image"
import Parallax from "@/src/components/Parallax"
import m1 from '@/src/images/Mountain0.jpg'
import TextBlock  from '@/src/components/HomePageText'
function App() {
  return (
    <div className="App">
      <div className="flex justify-center items-center h-screen">
      {/* <Link href='/calendar' className="border border-slate-500 rounded px-2 py-1 bg-slate-400 hover:bg-slate-700 focus-within:bg-slate-700 outline-none text-white">Calendar</Link> */}
        <Parallax/>
      
      </div >
        <TextBlock/>
    </div>
  )
}

export default App