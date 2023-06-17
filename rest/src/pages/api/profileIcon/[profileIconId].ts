import { handleApiAuth } from '@/utils/authApi';
import type { NextApiRequest, NextApiResponse } from 'next'


export interface ProfileIconAssetUrl {
    profileIconAssetUrl: string;
    profileIconId: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ProfileIconAssetUrl | { error: string }>
) {
    handleApiAuth(req, res);
    const profileIconId = req.query.profileIconId;
    if (profileIconId === undefined) {
        res.status(400).json({ error: 'profileIconId is undefined' });
        return;
    }
    if (typeof profileIconId !== 'string') {
        res.status(400).json({ error: 'profileIconId is not a string' });
        return;
    }
    const profileIconAssetUrl = `http://ddragon.leagueoflegends.com/cdn/13.5.1/img/profileicon/${profileIconId}.png`;
    res.status(200).json({ profileIconAssetUrl, profileIconId });
}
