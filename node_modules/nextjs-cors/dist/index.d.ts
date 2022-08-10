import cors from 'cors';
import { NextApiRequest, NextApiResponse } from 'next';
declare const NextCors: (req: NextApiRequest, res: NextApiResponse, options?: cors.CorsOptions | cors.CorsOptionsDelegate<cors.CorsRequest> | undefined) => Promise<unknown>;
export default NextCors;
