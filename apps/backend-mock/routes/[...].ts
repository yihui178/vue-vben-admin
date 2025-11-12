import { defineEventHandler } from 'h3';

export default defineEventHandler(() => {
  return `
<h1>Hello Vben Admin</h1>
<h2>Mock service is starting</h2>
<ul>
<li><a href="/api/user">/api/user/info</a></li>
<li><a href="/api/menu">/api/menu/all</a></li>
<li><a href="/api/auth/codes">/api/auth/codes</a></li>
<li><a href="/api/auth/login">/api/auth/login</a></li>
<li><a href="/api/upload">/api/upload</a></li>


<li><a href="/api/access/codes">/api/access/codes</a></li>
<li><a href="/api/course/add">/api/course/add</a></li>
<li><a href="/api/course/page">/api/course/page</a></li>
<li><a href="/api/course/delete">/api/course/delete</a></li>
</ul>
`;
});
