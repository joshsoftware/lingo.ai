
export function GET(req: Request) {
    return new Response(JSON.stringify({message: "Hello World"}), {status: 200});
}