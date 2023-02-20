let responseText;
const generateBtn = document.querySelector('.generate-btn');
generateBtn.addEventListener('click', function() {
    fetch('https://darkscrolls.tech/generate-text')
	.then(response => response.text())
	.then(text => {
	    //Text prompt has been captured
	    console.log("Prompt: " + text);



	    // End-stage script to apply text prompt to the html
	    const displayResponse = document.createElement('div');
	    displayResponse.innerHTML = text;
	    displayResponse.classList.add("prompt");
	    document.querySelector('.content').appendChild(displayResponse);
	})
	.catch(error => {
            console.error(error);
	});

});

// Totally functional javascript we may or may not put back later 
