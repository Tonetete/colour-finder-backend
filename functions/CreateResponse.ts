const createResponse = (status: number, body: any) => ({
  headers: {
    "Access-Control-Allow-Origin": "*",
  },
  statusCode: status,
  body: JSON.stringify(body),
});

export { createResponse };
