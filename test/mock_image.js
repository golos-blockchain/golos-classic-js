export const correctImageURL = 'http://images.golos.today/0x0/http://images.golos.today/0x0/http://images.golos.today/0x0/http://images.golos.today/0x0/http://images.golos.today/0x0/http://images.golos.today/0x0/https://i.imgur.com/w197Ch5.jpg';

export class MockImageElement {
    set src(url) {
        if (MockImageElement.timeouting)
            return;
        setTimeout(() => {
            if (url == correctImageURL) {
                this.width = MockImageElement.mockedWidth;
                this.height = MockImageElement.mockedWidth;
                if (this.onload) this.onload();
            } else {
                if (MockImageElement.abortOnFail && this.onabort)
                    this.onabort();
                else if (this.onerror)
                    this.onerror();
            }
        }, 250);
    }
}

export function mockHTMLImageElement(width = 120, height = 120) {
    global.Image = MockImageElement;
    Image.mockedWidth = 120;
    Image.mockedHeight = 120;
    Image.timeouting = false;
    Image.abortOnFail = false;
}

export function unmockHTMLImageElement() {
    if (global.Image) delete global.Image;
}
