import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

const AccountHome = () => {
    const [username, setUsername] = useState<string>("");
    const router = useRouter();
    const handleEnterPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            router.push(`/account/${username}`);
        }
    };
    return (
        <main className="flex w-screen bg-violet-900 min-h-screen flex-col items-center justify-center">
            <h1 className="text-6xl m-6">Your username</h1>
            <input
                type="text"
                className="m-6 mt-1"
                onChange={(e) => setUsername(e.currentTarget.value)}
                onKeyDown={handleEnterPress}
            />
            <Link
                href={`/account/${username}`}
                className="h-fit rounded-lg bg-green-500 p-8 text-5xl"
            >
                Check stats
            </Link>
        </main>
    );
};

export default AccountHome;
