// netlify/functions/proxy.js
export async function handler(event, context) {
    const { queryStringParameters } = event;
    const url = queryStringParameters.url;
  
    if (!url) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing url param' }),
      };
    }
  
    try {
      const res = await fetch(url);
      const text = await res.text();
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: text,
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: err.message }),
      };
    }
  }
  