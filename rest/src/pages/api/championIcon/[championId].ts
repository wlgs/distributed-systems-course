import { handleApiAuth } from '@/utils/authApi';
import type { NextApiRequest, NextApiResponse } from 'next'


export interface ChampionAssetUrl {
    championAssetUrl: string;
    championId: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ChampionAssetUrl | { error: string }>
) {
    handleApiAuth(req, res);
    const championId = req.query.championId;
    if (req.query.championId === undefined) {
        res.status(400).json({ error: 'championId is undefined' });
        return;
    }
    if (typeof championId !== 'string') {
        res.status(400).json({ error: 'championId is not a string' });
        return;
    }
    const championAssetUrl = `http://ddragon.leagueoflegends.com/cdn/13.5.1/img/champion/${championId}.png`;
    res.status(200).json({ championAssetUrl, championId });
}
