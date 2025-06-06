# Metrix, Clinical Assistant Platform


Caduceus can transcribe entire office visits in real-time using voice dictation, automatically converting  spoken word into structured medical documentation. 

See the current version on Vercel

The platform comes with pre-built templates for common healthcare workflows like progress notes, patient communications, and procedure pre-authorizations. You can see a live demo to experience how it streamlines medical documentation.



## Deploy

**Vercel**

Host your own live version of Metrix with Vercel.

**Docker**

Build locally:

```shell
docker build -t chatgpt-ui .
docker run -e OPENAI_API_KEY=xxxxxxxx -p 3000:3000 chatgpt-ui
```

Pull from ghcr:

```
```

## Running Locally

**1. Clone Repo**

```bash
git clone https://caduc.eus.git
```

**2. Install Dependencies**

```bash
npm i
```

**3. Provide API Keys**

Copy `.env.example` to `.env` and populate the values for the Python backend.
Create a `.env.local` file in the root of the repo with your OpenAI API Key and API base URL for the Next.js frontend:

```bash
OPENAI_API_KEY=YOUR_KEY
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

> You can set `OPENAI_API_HOST` where access to the official OpenAI host is restricted or unavailable, allowing users to configure an alternative host for their specific needs.

> Additionally, if you have multiple OpenAI Organizations, you can set `OPENAI_ORGANIZATION` to specify one.

**4. Run App**

```bash
npm run dev
```

**5. Use It**

You should be able to start chatting.

## Configuration

When deploying the application, the following environment variables can be set:

| Environment Variable              | Default value                  | Description                                                                                                                               |
| --------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| OPENAI_API_KEY                    |                                | The default API key used for authentication with OpenAI                                                                                   |
| OPENAI_API_HOST                   | `https://api.openai.com`       | The base url, for Azure use `https://<endpoint>.openai.azure.com`                                                                         |
| OPENAI_API_TYPE                   | `openai`                       | The API type, options are `openai` or `azure`                                                                                             |
| OPENAI_API_VERSION                | `2023-03-15-preview`           | Only applicable for Azure OpenAI                                                                                                          |
| AZURE_DEPLOYMENT_ID               |                                | Needed when Azure OpenAI, Ref [Azure OpenAI API](https://learn.microsoft.com/zh-cn/azure/cognitive-services/openai/reference#completions) |
| OPENAI_ORGANIZATION               |                                | Your OpenAI organization ID                                                                                                               |
| DEFAULT_MODEL                     | `gpt-3.5-turbo`                | The default model to use on new conversations, for Azure use `gpt-35-turbo`                                                               |
| NEXT_PUBLIC_DEFAULT_SYSTEM_PROMPT | [see here](utils/app/const.ts) | The default system prompt to use on new conversations                                                                                     |
| NEXT_PUBLIC_DEFAULT_TEMPERATURE   | 1                              | The default temperature to use on new conversations                                                                                       |
| GOOGLE_API_KEY                    |                                | See [Custom Search JSON API documentation][GCSE]                                                                                          |
| GOOGLE_CSE_ID                     |                                | See [Custom Search JSON API documentation][GCSE]                                                                                          |
| NEXT_PUBLIC_SUPABASE_URL          | https://mngrodgujznnlczqorod.supabase.co | Supabase project URL                                   |
| NEXT_PUBLIC_SUPABASE_ANON_KEY     |                                | Supabase anon key used by the browser                   |
| SUPABASE_URL                      | https://mngrodgujznnlczqorod.supabase.co | Supabase URL for server usage                          |
| SUPABASE_KEY                      |                                | Supabase key for server usage (anon or service role)    |

If you do not provide an OpenAI API key with `OPENAI_API_KEY`, users will have to provide their own key.

If you don't have an OpenAI API key, you can get one [here](https://platform.openai.com/account/api-keys).

## Contact

[GCSE]: https://developers.google.com/custom-search/v1/overview
# AI-Scribe-Platform
# AI-Scribe-Platform
# AI-Scribe-Platform
# AI-Scribe-Platform
