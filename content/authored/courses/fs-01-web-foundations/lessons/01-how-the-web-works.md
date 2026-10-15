---
{
  "id": "fs-01-web-foundations.l01",
  "title": "How the web works",
  "summary": "Clients and servers, URLs, DNS, HTTP requests and responses, status codes and what a browser does with a page.",
  "objectives": [
    "Describe what happens between typing a URL and seeing a page",
    "Read the parts of a URL and an HTTP message",
    "Choose the right HTTP method and recognise common status codes"
  ],
  "estimatedMinutes": 35,
  "topics": [
    "fs-01-web-foundations.how-the-web-works"
  ],
  "resources": [
    {
      "title": "How the web works (MDN)",
      "url": "https://developer.mozilla.org/en-US/docs/Web/Learn_web_development/Getting_started/Web_standards/How_the_web_works",
      "free": true,
      "official": true
    },
    {
      "title": "HTTP overview (MDN)",
      "url": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview",
      "free": true,
      "official": true
    }
  ]
}
---

## Clients and servers

The web is a conversation. A **client** (usually a browser) sends a **request**; a **server** sends back a **response**. Servers do not talk first and they do not remember you between requests unless something (a cookie, a token) tells them who you are.

## From URL to page

Typing `https://www.example.com:443/courses/html?lang=en#intro` starts a chain of steps:

| Part | Example | Meaning |
|---|---|---|
| scheme | `https` | the protocol: HTTP over TLS encryption |
| host | `www.example.com` | which server; DNS turns it into an IP address |
| port | `443` | usually omitted: 80 for http, 443 for https |
| path | `/courses/html` | which resource on that server |
| query | `?lang=en` | extra named parameters, `key=value` joined with `&` |
| fragment | `#intro` | a place inside the page; never sent to the server |

1. The browser asks **DNS** (the internet's phone book) for the host's IP address.
2. It opens a TCP connection and, for `https`, negotiates TLS encryption.
3. It sends an **HTTP request**, the server replies with a **response**, and the browser renders the HTML, then fetches the CSS, JavaScript and images the HTML points to.

## HTTP messages

```http
GET /courses/html HTTP/1.1
Host: www.example.com
Accept: text/html
```

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8

<!doctype html> ...
```

A request has a **method**, a path, headers and sometimes a body. A response has a **status code**, headers and usually a body.

| Method | Use | Safe to repeat? |
|---|---|---|
| `GET` | read a resource | yes |
| `POST` | create something or run an action | no |
| `PUT` / `PATCH` | replace / partly change a resource | PUT yes |
| `DELETE` | remove a resource | yes |

## Status codes

- **2xx** success: `200 OK`, `201 Created`, `204 No Content`
- **3xx** redirect: `301 Moved Permanently`, `304 Not Modified`
- **4xx** the client made a mistake: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`
- **5xx** the server failed: `500 Internal Server Error`, `503 Service Unavailable`

## The three languages of a page

**HTML** gives a page its structure and meaning, **CSS** its presentation and **JavaScript** its behaviour. Keep them separate: a page should still be readable with only the HTML.
