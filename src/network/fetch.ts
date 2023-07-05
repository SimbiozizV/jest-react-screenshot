import http from 'http';

export function fetch(
    url: string,
    method = 'GET',
    body?: any
): Promise<{
    status: number;
    body: Buffer;
}> {
    const requestData = body ? JSON.stringify(body) : '';
    return new Promise((resolve, reject) => {
        const request = http.request(
            url,
            {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': requestData.length,
                },
            },
            response => {
                const responseData: Buffer[] = [];
                response.on('error', error => {
                    reject(error);
                });
                response.on('data', data => {
                    responseData.push(data);
                });
                response.on('end', () => {
                    resolve({
                        status: response.statusCode || 200,
                        body: Buffer.concat(responseData),
                    });
                });
            }
        );
        request.write(requestData);
        request.end();
    });
}
