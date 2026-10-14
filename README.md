# DL Code Visualizer · ডিপ লার্নিং কোড ভিজুয়ালাইজার

**বাংলা** · [English](#english)

ব্রাউজারেই **আসল Python** চালিয়ে প্রতিটি লাইন একে একে চলতে দেখুন — ভেরিয়েবল, অ্যারে/ম্যাট্রিক্স (হিটম্যাপসহ),
নিউরাল নেটওয়ার্কের layer, convolution-এর স্লাইডিং উইন্ডো, loss চার্ট — সবকিছু ধাপে ধাপে। কোনো সার্ভার বা ইনস্টলেশন লাগে না।

## ফিচার
- ▶ **লাইন-বাই-লাইন প্লেব্যাক** — ◀ ▶ বাটন, কিবোর্ডের ← →, স্লাইডার বা Auto-play
- 🧮 প্রতিটি লাইনের পর **কোন ভেরিয়েবল বদলাল** (আগের মান → নতুন মান) এবং অ্যারের হিটম্যাপ
- 🧠 **ডিপ লার্নিং ছবি**: MLP নেটওয়ার্ক ডায়াগ্রাম (নিউরনের activation, ওজনের রং), Convolution উইন্ডো, loss চার্ট
- 🔁 লুপে প্রতিটি লাইন কতবার চলেছে (`×৬১`), ফাংশন কলের **call stack**, `return` মান
- ✎ **নিজের কোড** লিখে চালান; লাইনের শেষে `#: ব্যাখ্যা || English` লিখলে সেটাই ব্যাখ্যা হিসেবে দেখাবে
- 🔗 কোড **লিংক** আকারে শেয়ার করুন
- 🌐 বাংলা ও English, ডার্ক/লাইট থিম, মোবাইল-বান্ধব
- ৮টি বিল্ট-ইন উদাহরণ: Python বেসিক, রিকার্শন, একটি নিউরন, MLP forward, gradient descent, convolution, NumPy dense layer, XOR backpropagation

## GitHub Pages-এ পাবলিশ করার ধাপ
1. GitHub-এ নতুন **Public** repository খুলুন (যেমন `dl-code-visualizer`)।
2. এই ফোল্ডারের সব ফাইল সেখানে push করুন:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<ইউজারনেম>/dl-code-visualizer.git
   git push -u origin main
   ```
3. Repository → **Settings → Pages → Build and deployment → Source: GitHub Actions** নির্বাচন করুন।
4. `main`-এ push হলে `.github/workflows/pages.yml` নিজেই টেস্ট চালিয়ে ডিপ্লয় করবে।
   লিংক হবে: `https://<ইউজারনেম>.github.io/dl-code-visualizer/`

## নিজের কম্পিউটারে চালানো
> `py/tracer.py` বদলালে `python tools/embed_tracer.py` চালান (এটি `js/tracer_src.js` আপডেট করে)।
`index.html` ডাবল-ক্লিক করেও চলে (ইন্টারনেট লাগবে)। তবে লোকাল সার্ভার দিয়ে খুললে সবচেয়ে নির্ভরযোগ্য:
```bash
python -m http.server 8000      # তারপর http://localhost:8000
```
(প্রথমবার ইন্টারনেট লাগে, কারণ Pyodide ও NumPy CDN থেকে আসে।)

## নতুন উদাহরণ যোগ করা (Contribute)
`js/examples.js`-এ একটি অবজেক্ট যোগ করুন:
```js
{
  id: "my-example",
  title: { bn: "বাংলা শিরোনাম", en: "English title" },
  desc:  { bn: "...", en: "..." },
  viz: { type: "mlp", x: "x", layers: [{ W: "W1", b: "b1", a: "h" }] },   // ঐচ্ছিক
  code: `x = 1  #: বাংলা ব্যাখ্যা || English explanation`
}
```
- `viz.type`: `"mlp"` (ভেক্টর `x`, ওজন `W`, bias `b`, activation `a`) অথবা `"conv"` (`image`, `kernel`, `out`, লুপ ভেরিয়েবল `pos: ["i","j"]`)।
- যেসব ভেরিয়েবলের নাম `loss/cost/history/error/acc` ধরনের এবং সংখ্যার লিস্ট/অ্যারে, সেগুলো স্বয়ংক্রিয়ভাবে চার্টে আসে।
- টেস্ট: `python tests/test_tracer.py` (সব উদাহরণ চলে কি না যাচাই করে)।

## কীভাবে কাজ করে
`py/tracer.py` Python-এর `sys.settrace` দিয়ে প্রতিটি লাইনের পর ভেরিয়েবলের স্ন্যাপশট নেয়। Pyodide (WebAssembly-তে Python)
সেটি ব্রাউজারে চালায়; `js/app.js` ফলাফল আঁকে। ধাপের সীমা ৩০০০।

**সীমাবদ্ধতা:** `input()` ও matplotlib সমর্থিত নয়। নিজের কোড শুধু আপনার ব্রাউজারেই চলে।

---

## English
Run **real Python in the browser** and watch every line execute: variables, arrays/matrices (as heat-maps), neural-network
layers, a sliding convolution window and loss charts — step by step. No server, no install.

**Publish:** push this folder to a public GitHub repo → *Settings → Pages → Source: GitHub Actions*. The workflow in
`.github/workflows/pages.yml` runs the tests and deploys to `https://<user>.github.io/<repo>/`.

**Run locally:** `python -m http.server 8000` and open <http://localhost:8000>.

**Add an example:** append an object to `js/examples.js` (see above). Annotate lines with `#: বাংলা || English`.
Run `python tests/test_tracer.py` before opening a pull request.

**Limits:** no `input()`, no matplotlib, 3000 recorded steps per run.

License: MIT

## New labs: architecture explorer + image testing

The updated site adds two browser-based learning labs below the Python visualizer:

- **Architecture Explorer:** switch between illustrative CNN, MLP, and autoencoder diagrams, or define a custom layer stack. The preset diagrams are teaching templates; they do not inspect a model file.
- **Image Testing Lab:** upload an image to preview it and inspect dimensions and mean RGB values. For actual inference, upload a compatible **ONNX** model (`.onnx`) and optionally a newline-separated class-label `.txt` file. Select the model's input width/height, NCHW/NHWC layout, and RGB normalization, then run inference in the browser using ONNX Runtime Web.

### ONNX inference notes

- Files are processed locally in the browser; this app does not upload the image/model to a server.
- The inference helper assumes a single float32 RGB image input and displays a softmax ranking of the first output tensor. This is intended for compatible image-classification models, not object detection, segmentation, multi-input models, or arbitrary output formats.
- You must match the preprocessing, tensor layout, dimensions, normalization, and label order used when training/exporting your model. A displayed score is not guaranteed to be a calibrated probability.
- ONNX Runtime Web is loaded from a CDN when you use the model feature, so internet access is needed for that first load.
- GitHub Pages is static hosting. The app runs supported Python in the browser through Pyodide; it is not a general-purpose Python server and does not provide server-side GPU training.


### Built-in object detection

The Image Testing Lab uses TensorFlow.js COCO-SSD in the browser to detect common objects from the COCO label set (not every object in the world). It draws colored bounding boxes with class names and confidence scores. Internet access is needed the first time to load the model from the CDN.
