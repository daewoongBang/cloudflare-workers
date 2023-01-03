import { home } from './pages/home';
import { makeBadge, makeStatusResponse } from './utils';

export interface Env {
  DB: KVNamespace;
}

const statusCodes = {
  METHOD_NOT_ALLOWED: 405,
  BAD_REQUEST: 400,
  NOT_FOUND: 404
};

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const { url, method } = request;

    if (method !== 'GET')
      return makeStatusResponse(statusCodes.METHOD_NOT_ALLOWED);

    const { pathname, searchParams } = new URL(url);

    const handleHome = () => {
      return new Response(home, {
        headers: {
          'Content-Type': 'text/html;charset=utf-8'
        }
      });
    };

    const handleNotFound = () => {
      return makeStatusResponse(statusCodes.NOT_FOUND);
    };

    const handleVisit = async (searchParams: URLSearchParams, env: Env) => {
      const username = searchParams.get('username');

      if (!username) return makeStatusResponse(statusCodes.BAD_REQUEST);

      const exists = await fetch(`https://api.github.com/users/${username}`, {
        headers: {
          'User-Agent': 'request'
        }
      });

      if (exists.status === 404) return handleNotFound();

      const count = await env.DB.get(username);

      let newCount = 0;

      !count ? (newCount += 1) : (newCount = parseInt(count) + 1);

      await env.DB.put(username, String(newCount));

      return new Response(makeBadge(newCount), {
        headers: {
          'Content-Type': 'image/svg+xml;charset=utf-8',
          'Cache-Control': 'no-cache'
        }
      });
    };

    switch (pathname) {
      case '/':
        return handleHome();

      case '/visit':
        return handleVisit(searchParams, env);

      default:
        return handleNotFound();
    }
  }
};
