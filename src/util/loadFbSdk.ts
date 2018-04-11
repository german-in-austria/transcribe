
declare global {
  interface Window {
    fbAsyncInit: any
    FB: any
  }
}

const parseFbDom = (el?: HTMLElement) => {
  if(el){
    window.FB.XFBML.parse(el)
  }else{
    window.FB.XFBML.parse()
  }
}

export default function(el?: HTMLElement) {
  return new Promise((resolve, reject) => {
    if (window.FB === undefined) {
      window.fbAsyncInit = () => {
        window.FB.init({
          appId: process.env.FB_CLIENT_ID,
          cookie: true,
          xfbml: true,
          version: 'v2.11'
        })
        parseFbDom(el)
        resolve(true)
      };
      (function (d, s, id) { //tslint:disable-line
        var js, fjs = d.getElementsByTagName(s)[0]; // tslint:disable-line
        if (d.getElementById(id)) return; // tslint:disable-line
        js = d.createElement(s) as HTMLScriptElement; js.id = id;
        js.src = "//connect.facebook.net/en_US/sdk.js"; // tslint:disable-line
        if (fjs && fjs.parentNode) {
          fjs.parentNode.insertBefore(js, fjs);
        }
      }(document, 'script', 'facebook-jssdk')); //tslint:disable-line
    } else {
      parseFbDom(el)
      resolve(true)
    }
  })
}
