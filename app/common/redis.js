import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

class RedisClient {
    constructor() {
        if (!RedisClient.instance) {
            // this.client = createClient({
            //     password: process.env.REDIS_PASSWORD,
            //     socket: {
            //         host: process.env.REDIS_HOST,
            //         port: 14563
            //     }
            // });
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

    getInstance() {
        return this.client;
    }
}

const instance = new RedisClient();
Object.freeze(instance);

export default instance;