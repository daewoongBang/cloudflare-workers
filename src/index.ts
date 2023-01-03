export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  DB: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
}

// @ts-ignore
import Home from './home.html';

function handleHome() {
  return new Response(Home, {
    headers: {
      'Content-Type': 'text/html;charset=utf-8'
    }
  });
}

function handleBadRequest() {
  return new Response(null, {
    status: 400
  });
}

async function handleVisit(searchParams: URLSearchParams, env: Env) {
  const page = searchParams.get('page');

  if (!page) return handleBadRequest();

  const kvPage = await env.DB.get(page);

  let count = 1;

  if (!kvPage) {
    await env.DB.put(page, '1');
  } else {
    count = parseInt(kvPage) + 1;

    await env.DB.put(page, count + '');
  }

  return new Response(JSON.stringify({ visits: count }), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

function handleNotFound() {
  return new Response(null, {
    status: 404
  });
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const { pathname, searchParams } = new URL(request.url);

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
