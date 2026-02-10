module.exports = {
    apps: [{
        name: 'ecomishop',
        script: 'dist/main.js',
        instances: 1,
        exec_mode: 'fork',
        watch: false,
        max_memory_restart: '450M',
        env: {
            NODE_ENV: 'production',
            PORT: 3001
        }
    }]
};