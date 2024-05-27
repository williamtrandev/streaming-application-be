const { createClient } = require('redis');

class RedisClient {
    constructor() {
        if (!RedisClient.instance) {
            this.client = createClient();
            this.client.on('error', (err) => console.log('Redis Client Error', err));

            (async () => {
                try {
                    await this.client.connect();
                    console.log('Redis client connected');
                } catch (err) {
                    console.error('Failed to connect to Redis:', err);
                }
            })();

            RedisClient.instance = this;
        }

        return RedisClient.instance;
    }

    getClient() {
        return this.client;
    }
}

const instance = new RedisClient();
Object.freeze(instance);

module.exports = instance;
