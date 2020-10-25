import express, { Request, Response } from 'express';
import fetch from 'node-fetch';
import btoa from 'btoa';
import catchAsync from '../util';

const router = express.Router();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const redirect = encodeURIComponent(
  'http://localhost:4000/api/discord/callback'
);

router.get('/login', (req: Request, res: Response) => {
  res.redirect(
    `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirect}&response_type=code&scope=identify%20guilds%20connections`
  );
});

router.get(
  '/callback',
  catchAsync(async (req: Request, res: Response) => {
    if (!req.query.code) throw new Error('NoCodeProvided');
    const code = req.query.code;
    const creds = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
    const data = {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: 'http://localhost:4000/api/discord/callback',
      scope: 'identify and guild',
    };
    const response = await fetch(`https://discord.com/api/v6/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${creds}`,
        ContentType: `application/x-www-form-urlencoded`,
      },
      body: new URLSearchParams(data as any), // TODO figure out what to do with this type
    });
    const jsonresponse = await response.json();

    get_guilds(jsonresponse.access_token);

    // TODO replace this with where your site is servered from or serve from this same server
    res.redirect(`http://localhost:8080/?token=${jsonresponse.access_token}`);
  })
);

module.exports = router;

function get_guilds(access_token: string) {
  const response = fetch(`https://discord.com/api/users/@me/guilds`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  })
    .then((res) => res.json())
    .then((jsonData) => {
      console.log(jsonData);
    });
}
