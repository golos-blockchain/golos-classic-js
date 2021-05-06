import fetch from 'cross-fetch';

export class MockImageElement {
    set src(url) {
        fetch(url, {mode: 'no-cors'})
            .then(res => {
                this.width = MockImageElement.mockedWidth;
                this.height = MockImageElement.mockedWidth;
                try {
                    if (this.onload) this.onload();
                } catch (ex) {}
            })
            .catch(err => {
                if (MockImageElement.abortOnFail)
                    if (this.onabort) this.onabort();
                else
                    if (this.onerror) this.onerror();
            })
    }
}

export function mockHTMLImageElement(width = 120, height = 120) {
    global.Image = MockImageElement;
    Image.mockedWidth = 120;
    Image.mockedHeight = 120;
}

export function unmockHTMLImageElement() {
    if (global.Image) delete global.Image;
}

export const correctImageURL = 'https://i.imgur.com/w197Ch5.jpg'; 
