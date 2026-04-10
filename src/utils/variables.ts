
export let programmaticFold = false;


export function isProgrammaticFold(): boolean{
    return programmaticFold;
  }

export function markFoldStart() {
    programmaticFold = true;
  }

  export function markFoldEnd() {
    setTimeout(() => {
      programmaticFold = false;
    }, 50);
  }