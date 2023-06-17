import { handleApiAuth } from '@/utils/authApi';
import type { NextApiRequest, NextApiResponse } from 'next'
import { MatchDTO, Status, SummonerDTO } from '../_types';

interface StatPerMatch {
    championName?: string;
    championId?: number;
    gameDuration: number;
    ownKills: number;
    ownDeaths: number;
    ownAssists: number;
    ownKDA: number;
    ownCS: number;
    ownGold: number;
    ownDamage: number;
    ownQCasts: number;
    ownWCasts: number;
    ownECasts: number;
    ownRCasts: number;
}

export interface MatchDTOApi {
    matches: StatPerMatch[];
    summary: StatPerMatch;
    error?: any;
}


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<MatchDTOApi | { error: number }>
) {
    handleApiAuth(req, res);
    const accountName = req.query.accountName;
    const summonerQueryResponse = await fetch(`${process.env.RIOT_API_EUNE_URL}/lol/summoner/v4/summoners/by-name/${accountName}?api_key=${process.env.RIOT_API_KEY}`);
    if (summonerQueryResponse.status !== 200) {
        res.status(summonerQueryResponse.status).json({ error: summonerQueryResponse.status });
        return;
    }
    const summonerDTO = await summonerQueryResponse.json() as SummonerDTO;
    const puuid = summonerDTO.puuid;
    const matchQueryResponse = await fetch(`${process.env.RIOT_API_EUR_URL}/lol/match/v5/matches/by-puuid/${puuid}/ids?api_key=${process.env.RIOT_API_KEY}`);
    let matchIds = await matchQueryResponse.json() as string[];
    if (matchQueryResponse.status !== 200) {
        res.status(500).json({ error: matchQueryResponse.status });
        return;
    }
    matchIds = matchIds.slice(0, 5);

    const matchesInfo = await Promise.all(matchIds.map(async (matchId) => {
        const resp = await fetch(`${process.env.RIOT_API_EUR_URL}/lol/match/v5/matches/${matchId}?api_key=${process.env.RIOT_API_KEY}`);
        const matchInfo = await resp.json() as MatchDTO;
        return matchInfo;
    }));
    const validMatches = matchesInfo.filter(value => 'info' in value);
    const ownStatsPerMatch = validMatches.map((match) => {
        const ownParticipant = match.info.participants.find((participant) => participant.puuid === puuid);
        return ownParticipant;
    });
    const totalKills = ownStatsPerMatch.reduce((acc, curr) => acc + curr!.kills, 0);
    const totalDeaths = ownStatsPerMatch.reduce((acc, curr) => acc + curr!.deaths, 0);
    const totalAssists = ownStatsPerMatch.reduce((acc, curr) => acc + curr!.assists, 0);
    const summarizedStats: StatPerMatch = {
        gameDuration: validMatches.reduce((acc, curr) => acc + curr!.info.gameDuration, 0),
        ownKills: totalKills,
        ownDeaths: totalDeaths,
        ownAssists: totalAssists,
        ownKDA: (totalKills + totalAssists) / (totalDeaths === 0 ? 1 : totalDeaths),
        ownCS: ownStatsPerMatch.reduce((acc, curr) => acc + curr!.totalMinionsKilled, 0),
        ownGold: ownStatsPerMatch.reduce((acc, curr) => acc + curr!.goldEarned, 0),
        ownDamage: ownStatsPerMatch.reduce((acc, curr) => acc + curr!.totalDamageDealtToChampions, 0),
        ownQCasts: ownStatsPerMatch.reduce((acc, curr) => acc + curr!.spell1Casts, 0),
        ownWCasts: ownStatsPerMatch.reduce((acc, curr) => acc + curr!.spell2Casts, 0),
        ownECasts: ownStatsPerMatch.reduce((acc, curr) => acc + curr!.spell3Casts, 0),
        ownRCasts: ownStatsPerMatch.reduce((acc, curr) => acc + curr!.spell4Casts, 0),
    };
    res.status(200).json({
        matches: validMatches.map((match) => {
            const ownParticipant = match.info.participants.find((participant) => participant.puuid === puuid);
            return {
                championId: ownParticipant?.championId,
                championName: ownParticipant?.championName,
                gameDuration: match.info.gameDuration,
                ownKills: match.info.participants.find((participant) => participant.puuid === puuid)!.kills,
                ownDeaths: match.info.participants.find((participant) => participant.puuid === puuid)!.deaths,
                ownAssists: match.info.participants.find((participant) => participant.puuid === puuid)!.deaths,
                ownKDA: (ownParticipant!.kills + ownParticipant!.assists) / (ownParticipant!.deaths === 0 ? 1 : ownParticipant!.deaths),
                ownCS: ownParticipant!.totalMinionsKilled,
                ownGold: ownParticipant!.goldEarned,
                ownDamage: ownParticipant!.totalDamageDealtToChampions,
                ownQCasts: ownParticipant!.spell1Casts,
                ownWCasts: ownParticipant!.spell2Casts,
                ownECasts: ownParticipant!.spell3Casts,
                ownRCasts: ownParticipant!.spell4Casts,
            }
        }),
        summary: summarizedStats
    })
}
