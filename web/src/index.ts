import {createServer} from 'node:http'
import {createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@wizard/trpc';
import { page } from './page.ts';

const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000'
    })
  ]
})

await trpc.createUser.mutate({name: "Ryan", age: 27})
await trpc.createUser.mutate({name: "Karen", age: 27})

createServer((_req, res) => {
  void trpc.listUsers.query().then((users) => res.writeHead(200, {'Content-Type': 'text/html'}).end(page(users)))
}).listen(8080)
