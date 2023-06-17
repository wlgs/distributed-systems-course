import Head from "next/head";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {

    return (
        <>
            <Head>
                <title>Home</title>
            </Head>
            <main className="flex w-screen bg-violet-900 min-h-screen flex-col items-center justify-center ">
                <h1 className="text-6xl m-6">League Profile Scanner</h1>
                <Link href='/account' className="h-fit rounded-lg bg-green-500 p-8 text-5xl">
                    Get started!
                </Link>
            </main>
        </>
    );
}
