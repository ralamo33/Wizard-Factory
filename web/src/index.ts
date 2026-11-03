import {createServer} from 'node:http'
import {createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@wizard/trpc';

const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000'
    })
  ]
})

const x: number = ''

const ryanUser = trpc.createUser.mutate({name: "Ryan", age: 27})

const page = (users: {name: string, age: number}[]) => `<!doctype html>
<title>Users</title>
<p>Hello world</p>`

const webServer = createServer( async (req, res) => {
  const users = await trpc.listUsers.query();
  res.writeHead(200, {'Content-Type': 'text/html'}).end(page(users))
})
