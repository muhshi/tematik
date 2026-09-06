import { redis } from '../src/lib/redis';

async function main() {
  if (redis) {
    await redis.flushdb();
    console.log("Upstash Redis cleared!");
  } else {
    console.log("No redis configured");
  }
  process.exit(0);
}
main();
