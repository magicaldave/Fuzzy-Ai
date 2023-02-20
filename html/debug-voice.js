const debugBtn = document.querySelector('.debug-btn');
debugBtn.addEventListener('click', function() {
    fetch('https://darkscrolls.tech/generate-voice?prompt="debug"')
	.then(response => {
	    // Extract the blob from the response
	    return response.blob();
	})
	.then(voiceBlob => {
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
	})
	.catch(error => {console.error(error);});
});
