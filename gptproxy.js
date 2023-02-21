#!/usr/bin/node
const express = require("express");
const request = require("request");
const axios = require("axios");
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');
const spdy = require('spdy');
const https = require('https');
const app = express();

// UPDATE THIS TO REFLECT YOUR DOMAIN NAME
const allowedReferer = "https://darkscrolls.tech/";
// UPDATE THIS TO POINT TO YOUR SSL CERTIFICATE
const sslKey = '/root/certs/darkscrolls.tech.key'
const sslCert = '/root/certs/darkscrolls.tech.cert'
// EXPORT YOUR API KEYS IN .BASHRC BEFORE ATTEMPTING TO RUN THE SERVER
const openai_api_key = process.env.OPENAI_API_KEY;
const xi_api_key = process.env.XI_API_KEY;


const logPath = path.join(os.homedir(), 'Fuzzy-Ai', 'gptprompts.log');
const accessLogPath = path.join(os.homedir(), 'Fuzzy-Ai', 'access.log');
const imgPath = path.join(os.homedir(), 'Fuzzy-Ai/images');
const voicePath = path.join(os.homedir(), 'Fuzzy-Ai/voices');

// Visit https://api.elevenlabs.io/v1/voices to list available voices.
const voice = 'VR6AewLTigWG4xSOukaG';
const dallEUrl = "https://api.openai.com/v1/images/generations";
const gptUrl = "https://api.openai.com/v1/engines/text-davinci-002/completions";

app.use(cors({
    origin: allowedReferer
}));

app.get("/generate-text", handleGenerateTextRequest);

async function getOldFuzzy() {
    const imageFiles = fs.readdirSync(imgPath);
    const filename = imageFiles[Math.floor(Math.random() * imageFiles.length)];
    const sanitizedFilename = filename.replace(/_/g, ' ').replace(/\.png$/, '');
    return sanitizedFilename;
}

async function logOrigin(caller, origin) {
    fs.appendFile(accessLogPath, `${caller}: Referrer: ${origin}\n`, (err) => {
	if (err) {
	    console.error(err);
	}
    });
}

async function handleGenerateTextRequest(req, res) {

    logOrigin("TextHandler", req.get("Referer"));

  // Check the referer header
  if (!req.headers.referer || req.headers.referer !== allowedReferer) {
    return res.status(401).sendFile("/usr/share/nginx/html/ah-ah-ah.gif");
  }

    try {
	var text;
	if (!req.query.archive) {
	    text = await generateText();
	    console.log("Texthandler out: " + text);
	} else {
	    text = await getOldFuzzy();
	    console.log("Texthandler out: " + text);
	}
	res.send(text);
    } catch (error) {
	console.error(error);
	res.status(500).send("Error generating text.");
    }
}

async function generateText() {
    if (!openai_api_key) {
	throw new Error("OPENAI_API_KEY not defined");
    }

    // Set the API request parameters
    const requestBody = {
	prompt: "Generate a random english image prompt including only letters. Response must be a complete sentence, and seem to be from a friend. It should make recipient feel warm and fuzzy, brighten their day, or otherwise improve the user experience by getting a smile or laugh. Cats preferred, but any furry animal will do, like koalas.",
	max_tokens: 35,
	n: 1,
	stop: "",
	temperature: 0.5
    };
    const requestOptions = {
        method: "POST",
        url: gptUrl,
        headers: {
            Authorization: `Bearer ${openai_api_key}`,
            "Content-Type": "application/json",
        },
        data: JSON.stringify(requestBody),
        responseType: "json",
    };

    // Make the API request and return the response text
    const response = await axios(requestOptions);
    return response.data.choices[0].text;
}


app.get("/generate-image", async (req, res) => {
    logOrigin("ImgHandler", req.get("Referer"));

    if (!req.headers.referer || req.headers.referer !== allowedReferer) {
        return res.status(401).sendFile("/usr/share/nginx/html/ah-ah-ah.gif");
    }

    const prompt = req.query.prompt;

    if (!prompt) {
        return res.status(400).send("Prompt parameter is missing.");
    }


    const requestBody = {
        model: "image-alpha-001",
        prompt,
        num_images: 1,
        size: "256x256",
    };
    const requestOptions = {
        method: "POST",
        url: dallEUrl,
        headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
        },
        data: JSON.stringify(requestBody),
        responseType: "json",
    };

    try {
	let response;
	let imageUrl;
	let imageResponse;
	// Save the image data to a file asynchronously
	const filename = `${prompt.replace(/[^a-zA-Z]/g, '_')}.png`;
	console.log("ImgHandler in: " + filename);
	const filepath = path.join(process.env.HOME, 'Fuzzy-Ai', 'images', filename);
	// Only grab images that don't exist
	if (!fs.existsSync(filepath)) {
            response = await axios(requestOptions);
            imageUrl = response.data.data[0].url;
            imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
	    fs.writeFile(filepath, imageResponse.data, (err) => {
            if (err) {
		console.error(err);
            } else {
		console.log('Image saved successfully!');
            }
	    });
            res.status(200).set({
		"Content-Type": "image/png",
		"Content-Length": imageResponse.data.length,
            }).send(imageResponse.data);
	} else {

            res.status(200).set({
		"Content-Type": "image/png"
            });
	    // Open a stream to the file and pipe it to the client
	    const fileStream = fs.createReadStream(filepath);

	    fileStream.on("open", function () {
		fileStream.pipe(res);
	    });

	    fileStream.on("error", function (err) {
		console.error(err);
		res.end(err);
	    });
	}

    } catch (error) {
        console.error(error);
        res.status(500).send("Error generating image.");
    }
});


// Handle requests for generating a voice
app.get("/generate-voice", handleGenerateVoiceRequest);

async function handleGenerateVoiceRequest(req, res) {
    // Get the origin of the request and append it to the access log
    logOrigin("VoiceHandler in: ", req.get("Referer"));


    // Check that the referer is allowed
    if (!req.headers.referer || req.headers.referer !== allowedReferer) {
        return res.status(401).sendFile("/usr/share/nginx/html/ah-ah-ah.gif");
    }

    const text = req.query.prompt;

    if (!text) {
        return res.status(400).send("Prompt parameter is missing.");
    }

    const headers = {
	'Accept': 'audio/mpeg',
	'xi-api-key': xi_api_key,
	'Content-Type': 'application/json',
    };

    var voiceurl = "https://api.elevenlabs.io/v1/text-to-speech/"+voice+"/stream";

    const payload = {
	method: 'post',
	url: voiceurl,
	data: { text },
	headers: headers,
	responseType: 'stream'
    };

    try {
	// Generate the filename and destination from the text prompt
	const filename = `${text.replace(/[^a-zA-Z]/g, '_')}.mpeg`;
	const filePath = path.join(process.env.HOME, 'Fuzzy-Ai', 'voices', filename);
	console.log("VoiceHandler" + filename);

	if (!fs.existsSync(filePath)) {
	    // Conditionally fetch the response if an archive is not requested
	    if (req.query.archive !== "yes") {
		const voiceResponse = await axios(payload);
		// Save the voice response to a file
		const writeStream = fs.createWriteStream(filePath);
		voiceResponse.data.pipe(writeStream);

		// Wait for the write stream to finish before sending a response
		await new Promise((resolve, reject) => {
		    writeStream.on('finish', resolve);
		    writeStream.on('error', reject);
		});
	    }
	}

	// Set the response headers
	// Client-side manually sets these so it may not be necessary?
	res.set({
	    'Content-Type': 'audio/mpeg'
	});

	// Open a stream to the file and pipe it to the client
	const fileStream = fs.createReadStream(filePath);

	fileStream.on("open", function () {
	    fileStream.pipe(res);
	});

	fileStream.on("error", function (err) {
	    console.error(err);
	    res.end(err);
	});

    } catch (error) {
	console.error(error);
	res.status(500).send('Error generating audio file.');
    }
}

// SSL/TLS options
const options = {
    key: fs.readFileSync(sslKey),
    cert: fs.readFileSync(sslCert)
};

// Create the HTTP2 server
const server = spdy.createServer(options, app)

server.listen(3000, () => {
    console.log("Server running on port 3000.");
});
