/**
 * Coze API CORS Proxy for Cloudflare Workers
 * 部署到 Cloudflare Worker 后，将 Worker URL 填入平台 API 设置
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // 只允许 POST 请求
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // 从 URL 参数获取目标 URL: ?url=https://xxx
  const url = new URL(request.url)
  const targetUrl = url.searchParams.get('url')
  
  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400 })
  }

  // 复制请求头（去除 hop-by-hop 头）
  const headers = new Headers(request.headers)
  headers.delete('Host')
  headers.delete('Origin')
  headers.delete('Referer')

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: headers,
      body: request.body
    })

    // 构造响应，添加 CORS 头
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers),
        ...corsHeaders
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}
