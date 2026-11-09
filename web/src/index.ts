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

await trpc.createUser.mutate({name: "Ryan", age: 27})
await trpc.createUser.mutate({name: "Karen", age: 27})

const escapeHtml = (text: string): string =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')

const page = (users: readonly Readonly<{name: string, age: number}>[]): string => `<!doctype html>
<title>Users</title>
<p>Hello world</p>
<ul>
${users.map((user) => `<li>${escapeHtml(user.name)}, ${String(user.age)}</li>`).join('\n')}
</ul>`

createServer((_req, res) => {
  void trpc.listUsers.query().then((users) => res.writeHead(200, {'Content-Type': 'text/html'}).end(page(users)))
}).listen(8080)
