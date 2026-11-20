# Joshua Ediale – Music Notes (blog.joshuaediale.com)

- Posts are written daily by the Chief of Staff "Blog Writer" into the Google Sheet "Blog Posts (public feed)" (kept private; served by the Chief of Staff script feed).
- `.github/workflows/sync.yml` pulls rows with Status "Published" every 30 minutes and commits them to `src/posts/`.
- Netlify builds the site with Eleventy on every push. `/posts.json` feeds the Blog card in JCOS.
- To unpublish a post, change its Status in the sheet to anything other than "Published".
