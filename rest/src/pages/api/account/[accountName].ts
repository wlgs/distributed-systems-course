import { handleApiAuth } from '@/utils/authApi';
import type { NextApiRequest, NextApiResponse } from 'next'
import { MatchDTO, SummonerDTO } from '../_types';


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<SummonerDTO | { error: number }>
) {
    handleApiAuth(req, res);
    const accountName = req.query.accountName;
    const summonerQueryResponse = await fetch(`${process.env.RIOT_API_EUNE_URL}/lol/summoner/v4/summoners/by-name/${accountName}?api_key=${process.env.RIOT_API_KEY}`);
    if (summonerQueryResponse.status !== 200) {
        res.status(summonerQueryResponse.status).json({ error: summonerQueryResponse.status });
        return;
    }
    const summonerDTO = await summonerQueryResponse.json() as SummonerDTO;
    res.status(200).json(summonerDTO);
}
