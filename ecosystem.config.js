module.exports = {
  apps: [{
    name: 'groupride-dev',
    script: 'npm',
    args: 'run dev',
    cwd: '/home/groupride/apps/groupride',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    }
  }]
}
