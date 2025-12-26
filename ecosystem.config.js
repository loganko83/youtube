module.exports = {
  apps: [
    {
      name: 'tubegenius-web',
      cwd: './apps/web',
      script: 'npm',
      args: 'run start',
      env: {
        PORT: 3002,
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_URL: 'https://trendy.storydot.kr/youtube/api'
      }
    }
  ]
};
