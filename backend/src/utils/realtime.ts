import { Response } from 'express';

interface Client {
  id: string;
  res: Response;
}

let clients: Client[] = [];

export const addClient = (id: string, res: Response) => {
  clients.push({ id, res });
  console.log(`[SSE] Client connected: ${id}. Active clients: ${clients.length}`);
};

export const removeClient = (id: string) => {
  clients = clients.filter(c => c.id !== id);
  console.log(`[SSE] Client disconnected: ${id}. Active clients: ${clients.length}`);
};

export const broadcast = (type: string, data: any) => {
  const payload = JSON.stringify({ type, data });
  console.log(`[SSE] Broadcasting ${type} to ${clients.length} clients`);
  clients.forEach(client => {
    try {
      client.res.write(`data: ${payload}\n\n`);
    } catch (err) {
      console.error(`Failed to write to client ${client.id}:`, err);
    }
  });
};
