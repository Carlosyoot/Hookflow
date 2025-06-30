import { Queue } from "bullmq";
import RedisClient from "./src/Client/QueueClient.js";

const fila = new Queue('Envio', { connection: RedisClient });
const fila1 = new Queue('Nifi', { connection: RedisClient });

const jobs = await fila.getRepeatableJobs();

for (const job of jobs) {
  const fullKey = `repeat:${job.key}:${job.next}`;
  console.log('Removendo:', fullKey);
  await fila.removeJobScheduler(fullKey);
  await fila.removeJobScheduler("9c2735e1987ebdd742fb1850f352ae21")
  await fila1.removeJobScheduler("aa82ab7140c9130c20e1afeebcc7ca3d")

}

console.log(await fila.getRepeatableJobs());
console.log(await fila1.getRepeatableJobs());

