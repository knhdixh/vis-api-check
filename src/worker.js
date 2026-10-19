export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname.endsWith('.workers.dev') && env.CANONICAL_HOST) {
      url.hostname = env.CANONICAL_HOST;
      return Response.redirect(url.toString(), ['GET', 'HEAD'].includes(request.method) ? 301 : 308);
    }
    if (url.pathname === '/api/health') return Response.json({ok: true, app: 'vis-api-check'});
    return env.ASSETS.fetch(request);
  }
};
