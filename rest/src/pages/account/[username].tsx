import { FETCH_HEADERS } from "@/utils/const";
import { GetStaticPaths, NextApiRequest, NextApiResponse } from "next";
import Image from "next/image";
import { MatchDTOApi } from "../api/matches/[accountName]";
import { SummonerDTO } from "../api/_types";

const CDN_URL = "http://ddragon.leagueoflegends.com/cdn/13.5.1/img";

interface AccountProps {
    account: SummonerDTO & { error: string };
    matches: MatchDTOApi & { error: string };
}

const AccountDetail = ({ account, matches }: AccountProps) => {
    if (account.error) {
        return (
            <main className="flex w-full bg-violet-900 min-h-screen flex-col items-center justify-center">
                <section className="flex flex-col justify-center items-center bg-violet-700 rounded-lg mt-4 p-8 w-full sm:w-[500px]">
                    <h1 className="text-4xl">Error</h1>
                    <h3 className="text-4xl m-6">{account.error}</h3>
                </section>
            </main>
        );
    } else if (matches.error) {
        return (
            <main className="flex w-full bg-violet-900 min-h-screen flex-col items-center justify-center">
                <section className="flex flex-col justify-center items-center bg-violet-700 rounded-lg mt-4 p-8 w-full sm:w-[500px]">
                    <h1 className="text-4xl">Error</h1>
                    <h3 className="text-4xl m-6">{matches.error}</h3>
                </section>
            </main>
        );
    }
    return (
        <main className="flex w-full bg-violet-900 min-h-screen flex-col items-center justify-center">
            <section className="flex flex-col justify-center items-center bg-violet-700 rounded-lg mt-4 p-8 w-full sm:w-[500px]">
                <div className="flex flex-row justify-center items-center">
                    <Image
                        src={`${CDN_URL}/profileicon/${account.profileIconId}.png`}
                        alt="Picture of the author"
                        width={150}
                        height={150}
                        className="rounded-full"
                    />
                    <h1 className="text-4xl ml-8">{account.name}</h1>
                </div>
                <h3 className="text-4xl m-6">
                    {account.summonerLevel} summoner level
                </h3>
            </section>
            <section className="flex flex-col w-full sm:w-[500px]">
                <ul>
                    {matches.matches.map((match, idx) => {
                        return (
                            <li
                                key={idx}
                                className="my-4 p-6 bg-violet-700 rounded-lg"
                            >
                                <div className="flex flex-row">
                                    <div className="flex flex-col justify-center items-center mx-6 mt-0">
                                        <Image
                                            src={`${CDN_URL}/champion/${match.championName}.png`}
                                            alt={
                                                match.championName ?? "unknown"
                                            }
                                            width={125}
                                            height={125}
                                            className="rounded-full"
                                        />
                                        <p className="font-extrabold">
                                            {match.championName}
                                        </p>
                                    </div>
                                    <div className="flex flex-col">
                                        <div>
                                            <span className="text-blue-500 font-bold">
                                                {" "}
                                                {match.ownKills}
                                            </span>
                                            <span className="font-bold">
                                                {" "}
                                                /{" "}
                                            </span>
                                            <span className="text-red-500 font-bold">
                                                {" "}
                                                {match.ownDeaths}
                                            </span>
                                            <span className="font-bold">
                                                {" "}
                                                /{" "}
                                            </span>
                                            <span className="text-yellow-500 font-bold">
                                                {" "}
                                                {match.ownAssists}
                                            </span>
                                            <span className="font-extrabold">
                                                {" "}
                                                ({match.ownKDA.toFixed(2)})
                                            </span>
                                        </div>
                                        <span className="font-medium ">
                                            {match.ownGold.toLocaleString("en")}{" "}
                                            gold earned
                                        </span>
                                        <span className="font-medium ">
                                            {match.ownDamage.toLocaleString(
                                                "en"
                                            )}{" "}
                                            damage dealt
                                        </span>
                                        <span className="font-medium ">
                                            {match.ownCS.toLocaleString("en")}{" "}
                                            minions killed
                                        </span>
                                        <span className="font-medium ">
                                            {(match.gameDuration / 60).toFixed(
                                                2
                                            )}{" "}
                                            minutes played
                                        </span>
                                        <span className="font-medium ">
                                            Q: {match.ownQCasts}, W:{" "}
                                            {match.ownWCasts}, E:{" "}
                                            {match.ownECasts}, R:{" "}
                                            {match.ownRCasts}
                                        </span>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </section>
            <section className="flex flex-col justify-center items-center bg-violet-700 rounded-lg p-8 w-full sm:w-[500px]">
                <h2 className="text-5xl font-bold">Summary</h2>
                <h3 className="text-2xl font-semibold">
                    (over last {matches.matches.length} games)
                </h3>
                <ul className="w-full">
                    <li className="flex">
                        <span className="font-bold ">Kills</span>
                        <span className="font-bold text-blue-500 ml-auto">
                            {" "}
                            {matches.summary.ownKills}
                        </span>
                    </li>
                    <li className="flex">
                        <span className="font-bold ">Deaths</span>
                        <span className="font-bold text-red-500 ml-auto">
                            {" "}
                            {matches.summary.ownDeaths}
                        </span>
                    </li>
                    <li className="flex">
                        <span className="font-bold ">Assists</span>
                        <span className="font-bold text-yellow-500 ml-auto">
                            {" "}
                            {matches.summary.ownAssists}
                        </span>
                    </li>
                    <li className="flex">
                        <span className="font-bold">KDA</span>
                        <span className="font-bold ml-auto">
                            {" "}
                            {matches.summary.ownKDA.toFixed(2)}
                        </span>
                    </li>
                    <li className="flex">
                        <span className="font-bold">CS</span>
                        <span className="font-bold ml-auto">
                            {" "}
                            {matches.summary.ownCS}
                        </span>
                    </li>
                    <li className="flex">
                        <span className="font-bold">Gold</span>
                        <span className="font-bold ml-auto">
                            {" "}
                            {matches.summary.ownGold.toLocaleString("en")}
                        </span>
                    </li>
                    <li className="flex">
                        <span className="font-bold">Damage</span>
                        <span className="font-bold ml-auto">
                            {" "}
                            {matches.summary.ownDamage.toLocaleString("en")}
                        </span>
                    </li>
                    <li className="flex">
                        <span className="font-bold">Q casts</span>
                        <span className="font-bold ml-auto">
                            {" "}
                            {matches.summary.ownQCasts}
                        </span>
                    </li>
                    <li className="flex">
                        <span className="font-bold">W casts</span>
                        <span className="font-bold ml-auto">
                            {" "}
                            {matches.summary.ownWCasts}
                        </span>
                    </li>
                    <li className="flex">
                        <span className="font-bold">E casts</span>
                        <span className="font-bold ml-auto">
                            {" "}
                            {matches.summary.ownECasts}
                        </span>
                    </li>
                    <li className="flex">
                        <span className="font-bold">R casts</span>
                        <span className="font-bold ml-auto">
                            {" "}
                            {matches.summary.ownRCasts}
                        </span>
                    </li>
                    <li className="flex">
                        <span className="font-bold">Time spent playing</span>
                        <span className="font-bold ml-auto">
                            {" "}
                            {(matches.summary.gameDuration / 60).toFixed(
                                2
                            )}{" "}
                            minutes
                        </span>
                    </li>
                </ul>
            </section>
        </main>
    );
};

interface Props {
    params: {
        username: string;
    };
    req: NextApiRequest;
    res: NextApiResponse
}

export async function getServerSideProps({ params, res, req }: Props) {
    res.setHeader(
        'Cache-Control',
        'public, s-maxage=10, stale-while-revalidate=15'
      )

    const [accountData, matchesData] = await Promise.all([
        fetch(
            `${process.env.LOCAL_URL}/api/account/` + params.username,
            FETCH_HEADERS
        ).then((res) => res.json()),
        fetch(
            `${process.env.LOCAL_URL}/api/matches/` + params.username,
            FETCH_HEADERS
        ).then((res) => res.json()),
    ]);

    return {
        props: {
            account: accountData,
            matches: matchesData,
        },
    };
}

export default AccountDetail;
