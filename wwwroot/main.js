import * as JSZip from './jszip.min.js';
// import {unified} from './node_modules/unified/index.js';
// import remarkParse from './node_modules/remark-parse/index.js';
// import remarkRehype from './node_modules/remark-rehype/index.js';
// import rehypeStringify from './node_modules/rehype-stringify/index.js';
// import rehypeSanitize from './node_modules/rehype-sanitize/index.js';
// import rehypeSlug from './node_modules/rehype-slug/index.js';


window.convertToMd = (input) => {

  const file = input.files[0];

  var reader = new FileReader();
  reader.onload = async function (e) {
    // The file's text will be printed here
    // var string = await DotNet.invokeMethodAsync("blazorwasm", "openDocxFile", new Uint8Array(reader.result));

    // downloadBlob(string, 'test.md', 'application/octet-stream');

    var zipBytes = await DotNet.invokeMethodAsync("blazorwasm", "openDocxZipFile", new Uint8Array(reader.result));

    downloadBlob(zipBytes, 'testMd.zip', 'application/octet-stream');
  };
  reader.readAsArrayBuffer(file);
}

window.convertToDocx = async (input) => {

  const file = input.files[0];

  if (file.type == "application/zip") {
    const jszip = new window.JSZip();
    const decoder = new TextDecoder();
    var mdString = [];
    const images = [];
    const zipFiles = [];


    jszip.loadAsync(file).then(async function (zip) {

      //Other way to fill promises
      // zip.folder("articles/").forEach(async function (relativePath, file) {
      //   promises.push(file);
      // });
      // zip.folder("images/").forEach(async function (relativePath, file) {
      //   promises.push(file);
      // });

      zipFiles.push(...zip.folder("articles").file(/^[^\.]/));
      zipFiles.push(...zip.folder("images").file(/^[^\.]/));

      const DGCoverterPromises = [];
      const fileNames = [];

      zipFiles.forEach(async function(file, index){
        if (file.name.startsWith('images/')) {
          DGCoverterPromises.push(file.async('uint8array'))
          fileNames.push(file.name)
        }
        else if (file.name.startsWith('articles/')) {
          DGCoverterPromises.push(file.async("text"))
          fileNames.push(file.name)
        }
      })

      await Promise.all(DGCoverterPromises).then(function (data) {
        data.forEach(function(file, index){
          if(typeof file === 'string'){
            mdString.push(file);
          }else{
            let imageHex = Array.from(file)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
            if (imageHex.length % 2 !== 0) {
              // Add a padding of 0 to the end of hexString
              imageHex += '0';
            }
            images.push({ src: fileNames[index], hex: imageHex });
          }
        })
      });

      // await new Promise(async (resolve, reject) => {
      //   zipFiles.forEach(async (file, index) => {
      //     if (file.name.startsWith('images/')) {
      //       //let imageHex = convertToHex(await file.async("text"));
      //       //let imageHex = bytesToHexString(await file.async('uint8array'));
      //       let imageHex = Array.from(await file.async('uint8array'))
      //         .map(b => b.toString(16).padStart(2, '0'))
      //         .join('');
      //       if (imageHex.length % 2 !== 0) {
      //         // Add a padding of 0 to the end of hexString
      //         imageHex += '0';
      //       }
      //       images.push({ src: file.name, hex: imageHex });
      //       console.log(file.name);
      //     }
      //     else if (file.name.startsWith('articles/')) {
      //       mdString.push(await file.async("text"));
      //     }
      //     if (index == zipFiles.length - 1) {
      //       resolve();
      //     }
      //   });
      // });
      const jsonString = JSON.stringify(images);

      var zipBytes = await DotNet.invokeMethodAsync("blazorwasm", "openMdZipFile", mdString, jsonString);

      downloadBlob(zipBytes, 'test.zip', 'application/octet-stream');
    })
  } else {
    var reader = new FileReader();
    reader.onload = async function (e) {

      var byte = await DotNet.invokeMethodAsync("blazorwasm", "openMdFile", new Uint8Array(reader.result));;

      downloadBlob(byte, "test.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    }
    reader.readAsArrayBuffer(file)
  }

  //jsonString = createJsonImages(images);

  // var zipBytes = await DotNet.invokeMethodAsync("blazorwasm", "openDocxFile", mdString, jsonString);

  // downloadBlob(string, 'test.zip', 'application/octet-stream');
};


//-------------------------------------------------
// Function below is to convert an image to hex format
//-------------------------------------------------

function convertToHex(image) {
  let hex = '';
  let finalHex = '';
  for (let i = 0; i < image.length; i++) {
    hex += ("00" + image.charCodeAt(i).toString(16)).slice(-4);
    //finalHex += ("00"+hex).slice(-4);
  }
  return hex;
}


//-------------------------------------------------
// Functions below is to convert a byte to hex format
//-------------------------------------------------

function byteToHex(byte) {
  return byte.toString(16).padStart(2, '0');
}

function bytesToHex(bytes) {
  return bytes.map(byteToHex);
}

function bytesToHexString(bytes) {
  return bytesToHex(bytes).join('');
}


//-------------------------------------------------
// Function below is to convert .md file to html
//-------------------------------------------------

// async function md2html(md){
//   const file = await unified()
//       .use(remarkParse)
//       .use(remarkRehype)
//       .use(rehypeSanitize)
//       .use(rehypeStringify)
//       .use(rehypeSlug)
//       .process(md ?? "error")
//   return String(file)
// }


//-------------------------------------------------
// Functions below are to download the files after the conversion
//-------------------------------------------------

function downloadBlob(data, fileName, mimeType) {
  var blob = new Blob([data], {
    type: mimeType
  });
  var url = window.URL.createObjectURL(blob);
  downloadURL(url, fileName);
  setTimeout(function () {
    return window.URL.revokeObjectURL(url);
  }, 1000);
};

var downloadURL = function (data, fileName) {
  var a;
  a = document.createElement('a');
  a.href = data;
  a.download = fileName;
  document.body.appendChild(a);
  a.style = 'display: none';
  a.click();
  a.remove();
};


//-------------------------------------------------
// Functions below failed
//-------------------------------------------------

// async function readImages(htmlFile) {
//   const parser = new DOMParser();
//   let response

//   const htmlTags = parser.parseFromString(htmlFile, "text/html");

//   const imgTags = htmlTags.querySelectorAll("img");
//   for (const jpg of imgTags) {
//     console.log(jpg.src);
//     const result = await fetch(jpg.src);
//   }

//   imgTags.push(htmlTags.querySelector("img").forEach((e) => e.src));
// }



//Previous convertToDocx (Doesn't work because of CORS)
// function convertToDocx(input) {
//   const file = input.files[0];

//   var reader = new FileReader();
//   reader.onload = async function (e) {

//     var byte = await DotNet.invokeMethodAsync("blazorwasm", "openMdFile", new Uint8Array(reader.result));;

//     downloadBlob(byte, "test.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
//   }
//   reader.readAsArrayBuffer(file)
// }