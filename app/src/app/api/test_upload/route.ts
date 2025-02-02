
export function POST(req: Request, ) {
    console.log("GET /api/uploadthing/test_upload", {req});
    return new Response(JSON.stringify({message: "Hello World"}), {status: 200});
}