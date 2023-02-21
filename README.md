# Welcome to Fuzzy-Ai! #

Evolved from its much stricter client-side Python version, Fuzzy-Ai is now a real web application you can deploy yourself.
Download the server, deliver the html somehow, and let it do its job!

Under the hood, Fuzzy-Ai is effectively a simple REST api.

Its job is to get "fuzzy" text prompts from GPT3 and reroute the prompts to DALL-E and Elevenlabs' voice ai, then render it all onscreen. Get Fuzzy!

The installation process for the server is pretty simple.

1. Clone this repository. Make it somewhere easy.

2. Edit `html/pull-archive.js and html/gen-gpt.js`. On line 2, enter your domain name as the value of the `yourHost` variable.

3. Edit gptproxy.js. Change the variable `allowedReferer` from its value to your own fully qualified domain name. GptProxy uses the origin of traffic received to prevent unauthorized requests; only the website itself should be able to access the API endpoints.

4. If you don't have an SSL certificate, you can migrate off HTTPS yourself (and send your expensive API keys in plaintext over the internet!), otherwise provide the location of your key and cert on lines 16 and 17.

5. Add your OpenAI and [ElevenLabs](https://api.elevenlabs.io/docs) API keys to your environment by using `export`.
The Elevenlabs API key should be called XI_API_KEY, and the OpenAI Api key should be called OPENAI_API_KEY.

6. Make sure you have npm installed, then

`cd Fuzzy-Ai && npm install express axios spdy` to install nodeJS dependencies.
I'm working on making the project automatically install dependencies! Please offer PRs, they WILL be accepted.

7. Once your certs and API keys are set up, double-check the .js files in `html/` are pointing to the correct host.

8. After this, you're now ready to start the server.
   I recommend adding a cronjob for it, but alternatively for testing you can start it in a subshell:
   `./gptproxy.js &`

9. Navigate to your domain, or to index.html depending on your setup.
`Get Fuzzy` generates new Fuzzies, `Get an Old Fuzzy` should grab one that already exists on your server. Note that for testing, I've provided a small dataset to get you going.

Get fuzzy, peeps.


