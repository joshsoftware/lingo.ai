export default function TranscriptionSkeleton() {
    return (
        <div className="flex flex-col md:flex-row gap-4 w-full h-full bg-[#F9F9F9] p-2 px-8 rounded-xl justify-between items-center animate-pulse">
            <div className="flex-1 h-fit w-full">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="w-full md:w-1/3 h-6 bg-gray-300 rounded"></div>
                    <div className="w-full md:w-1/3 h-6 bg-gray-300 rounded"></div>
                    <div className="w-full md:w-1/3 h-6 bg-gray-300 rounded"></div>
                </div>
            </div>
            <div className="flex flex-col gap-2 justify-center items-center w-full h-full md:w-auto z-10">
                <div className="w-24 h-10 bg-gray-300 rounded"></div>
            </div>
        </div>
    )
}