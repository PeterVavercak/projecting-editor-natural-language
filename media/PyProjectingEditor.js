(function () {
    const vscode = acquireVsCodeApi();
    const fragmentsContainer = /** @type {HTMLElement} */ (document.querySelector('.fragments'));


    function updateContent(text) {

        fragmentsContainer.innerHTML = '';


        for (let i = 0; text.length; i++) {
            let isCodeDisplayed = text[i].isCodeOpened;
            const codeFragment = document.createElement('div');
            codeFragment.className = 'fragment';
            fragmentsContainer.appendChild(codeFragment);
            if (isCodeDisplayed) {
                const codeStructure = document.createElement('pre');
                const codeContent = document.createElement('code');
                codeContent.innerText = text[i].code;
                codeStructure.appendChild(codeContent);
                codeFragment.appendChild(codeStructure);
            } else {
                const nlStructure = document.createElement('pre');
                const nlContent = document.createElement('code');
                nlContent.innerText = text[i].naturalLanguage;
                nlStructure.appendChild(nlContent);
                codeFragment.appendChild(nlStructure);
            }

            const changeState = document.createElement('button');
            changeState.addEventListener("click", () => {



                isCodeDisplayed = !isCodeDisplayed;
                if (isCodeDisplayed) {
                    changeState.innerHTML = text.firstLine;
                } else {
                    changeState.innerHTML = text.lastLine;
                }
                  vscode.postMessage({ type: 'changeDisplay', displayCode: isCodeDisplayed, firstLine: text[i].firstLine, lastLine: text[i].lastLine});
            });
            codeFragment.appendChild(changeState);
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