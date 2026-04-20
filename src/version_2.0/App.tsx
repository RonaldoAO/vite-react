export default function App() {
    return (
        <div className='bg-[#C5A3FF] w-full h-screen pt-5'>
            <p className='font-bold text-3xl mb-5 ml-2'>Ronaldo Acevedo O.</p>
            
            <div className='flex flex-row  justify-around h-1/2'>
                <div className='w-7/12 bg-red-50 h-full rounded-2xl'></div>
                <div className='w-4/12  h-full flex flex-col justify-between'>
                    <div className='bg-amber-400 h-[31%] w-full rounded-2xl '>a</div>
                    <div className='bg-blue-400 h-[31%] w-full rounded-2xl'>a</div>
                    <div className='bg-green-700 h-[31%] w-full rounded-2xl'>a</div>
                </div>
            </div>
            <p className='font-bold text-3xl my-5 ml-2'>Eventos</p>
            <div>
                <div className='bg-[#f5def9] h-40 mx-3 rounded-2xl'></div>
                <div className='bg-[#ecfcb7] h-40 mx-3 rounded-2xl -mt-5 border border-t-white border-t-4'></div>
                <div className='bg-[#c7f6fc] h-40 mx-3 rounded-2xl'></div>
            </div>
        </div>
    )
}
