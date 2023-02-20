#!/usr/bin/env python
# You must install matplotlib and openai: `pip install matplotlib openai`
# Fuzzy-AI also requires the `mpv` package
import requests
import random
import json
import matplotlib.pyplot as plt
from io import BytesIO
import openai
import subprocess
import os
import re

QUERY_URL = "https://api.openai.com/v1/images/generations"
GPT3_URL = "https://api.openai.com/v1/engines/text-davinci-002/jobs"

# To change the voice, visit:https://api.elevenlabs.io/v1/voices
# Then change the URL this variable points to.
ELEVEN_URL = "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM"

# Get your API keys from these links
# https://help.openai.com/en/articles/4936850-where-do-i-find-my-secret-api-key
openai.api_key = ""

# https://api.elevenlabs.io/docs
xi_api_key = ""

def get_voice(prompt):
    headers = {
        "accept": "audio/mpeg",
        "xi-api-key": xi_api_key,
        "Content-Type": "application/json"
    }

    payload = {
        "text": prompt,
        "model_id": "prod",
        "language_id": "en-us"
    }

    response = requests.post(ELEVEN_URL, headers=headers, json=payload)

    with open("eleven.mpeg", "wb") as file:
        file.write(response.content)

def generate_gpt3_prompt():
    completion = openai.Completion.create(engine="text-davinci-002",
                                          prompt="Generate a random image prompt in english no longer than 30 tokens and include only ASCII characters, and no quotes. The response must be a complete sentence. It should also preferably make the recipient feel warm and fuzzy, brighten their day, or otherwise improve the user experience. Cats preferred, but any furry animal will do.")

    return completion.choices[0].text.strip()

def generate_image(prompt):
    headers = {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + openai.api_key
    }
    model = "image-alpha-001"
    data = """
    {
        """
    data += f'"model": "{model}",'
    data += f'"prompt": "{prompt}",'
    data += """
        "num_images":1,
        "size":"1024x1024",
        "response_format":"url"
    }
    """

    resp = requests.post(QUERY_URL, headers=headers, data=data)

    if resp.status_code != 200:
        raise ValueError("Failed to generate image")

    response_text = json.loads(resp.text)
    image_url = response_text["data"][0]["url"]
    image = requests.get(image_url)
    return BytesIO(image.content)

def show_image(image, prompt):
        image_path = os.path.expanduser("~/Pictures/")
        if not os.path.exists(image_path):
            os.makedirs(image_path)
        # Clean up the prompt to use as a file name
        prompt = re.sub(r'[^\w\s]', '', prompt)
        prompt = re.sub(r'\s+', '_', prompt)
        image_path = os.path.join(image_path, f"{prompt}.png")
        plt.imsave(image_path, plt.imread(image))
        subprocess.run(["xdg-open", image_path])

if __name__ == "__main__":
    prompt = generate_gpt3_prompt()
    eleven_speak(prompt)
    print(f"Generating image for prompt: {prompt}")
    image = generate_image(prompt)
    show_image(image, prompt)
    # Play, then delete the prompt narration
    subprocess.run(["mpv", "eleven.mpeg"])
    os.remove("eleven.mpeg")
