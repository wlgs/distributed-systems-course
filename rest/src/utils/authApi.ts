import { NextApiRequest, NextApiResponse } from "next";

export function validateApiKey(key: string){
    return key === "mySecretKey";
}

export async function handleApiAuth(req: NextApiRequest, res: NextApiResponse) {
    const apiKey = req.headers['api-key'];
    if (apiKey === undefined) {
        res.status(401).json({ error: 'api-key is undefined' });
        return;
    }
    if (typeof apiKey !== 'string') {
        res.status(401).json({ error: 'api-key is not a string' });
        return;
    }
    const isKeyValid = validateApiKey(apiKey);
    if (!isKeyValid) {
        res.status(401).json({ error: 'invalid api-key' });
        return;
    }
}