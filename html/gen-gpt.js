// CHANGE YourHost TO REFLECT YOUR DOMAIN NAME
const YourHost="darkscrolls.tech";
const generateBtn = document.querySelector('.generate-btn');
generateBtn.addEventListener('click', function() {
    fetch('https://${YourHost}/generate-text')
	.then(response => response.text())
	.then(text => {
	    //Text prompt has been captured
	    console.log("Prompt: " + text);
	    Promise.all([
		fetch(`/generate-voice?prompt=${text}`),
		fetch(`/generate-image?prompt=${text}`)
	    ])
		.then(responses => {
		    // Convert the response streams to blobs
		    return Promise.all(responses.map(response => response.blob()));
		})
		.then(([voiceBlob, imageBlob]) => {
		    // Update the audio element with the object URL
		    const audio = new Audio();
		    audio.type = 'audio/mpeg';
		    // Convert the voice blob to an object URL
		    audio.src = URL.createObjectURL(voiceBlob);
		    audio.play();
		    // Revoke the object URL after the audio has finished playing
		    audio.addEventListener('ended', () => {
			URL.revokeObjectURL(audio.src);
		    });

		    // Convert the image blob to an object URL
		    const imageUrl = URL.createObjectURL(imageBlob);

		    // Update the webpage with the content

		    const displayResponse = document.createElement('div');
		    displayResponse.classList.add("prompt");
		    displayResponse.innerHTML = `<img src="${imageUrl}"><br>${text}`;
		    document.querySelector('.content').appendChild(displayResponse);
		})
		.catch(error => {console.error(error);});
	})
	.catch(error => console.error(error));
});
