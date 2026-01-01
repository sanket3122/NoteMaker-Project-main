import path from 'path';

export const resolve = {
    fallback: {
        "net": false,
        "tls": false,
        "querystring": false,
        "stream": false,
        "buffer": false ,
        "buffer": require.resolve("buffer/")
    }
};
export const externals = {
    "http-proxy-agent": "http-proxy-agent"
};
