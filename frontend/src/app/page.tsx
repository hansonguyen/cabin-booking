import Link from "next/link"

function App() {
  return (
    <div className="App">
      <div className="text-center">
      <Link href='/calendar' className="border border-slate-500 rounded px-2 py-1 bg-slate-400 hover:bg-slate-700 focus-within:bg-slate-700 outline-none text-white">Calendar</Link>
      </div>
    </div>
  )
}

export default App