(function (){
    const vscode = acquireVsCodeApi();
    const fragmentsContainer = /** @type {HTMLElement} */ (document.querySelector('.fragments'));


    function updateContent(text) {
        fragmentsContainer.innerHTML = '';


        for(let i = 0; text.length; i++){
            const fragment = document.createElement('div');
            fragment.className = 'fragment';
            const textContent = document.createElement('span');

            textContent.innerText = text[i].code;
            fragment.appendChild(textContent);
            fragmentsContainer.appendChild(fragment);
        }
    
    



    }

    window.addEventListener('message', event => {
		const message = event.data; // The json data that the extension sent
		switch (message.type) {
			case 'update':
				const text = message.text;
				updateContent(text);
				vscode.setState({ text });

				return;
		}
	});

    const state = vscode.getState();
	if (state) {
		updateContent(state.text);
	}
    
}());