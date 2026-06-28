# Why did the logo image fail to show up?

When you asked the AI to replace the text logo with an image, it likely failed for one of two reasons (which are very common with AI code generation):

### 1. The "Picsum" Formatting Error
If it tried to pull a placeholder from the web, AI models often accidentally format the URL wrong. Instead of writing `https://picsum.photos/200/50` (which works), they often hallucinate and write `https://picsum.photos/200x50` (with an 'x') or `https://picsum.photos/logo.png`. Because Picsum doesn't recognize those formats, the image breaks.

### 2. The "Uploaded Image" Extension Error
If you uploaded an image, the app gave the AI a secret code like `UPLOADED_IMG_1234`. Our app looks for that *exact* code to swap in your real image. However, the AI often tries to be "helpful" by adding a file extension to it, writing `<img src="UPLOADED_IMG_1234.png">`. Because it added `.png`, our app's search-and-replace function couldn't find the exact match, leaving a broken image link.

### 3. Missing CSS Dimensions
When replacing text (like `<h1>NexusAI</h1>`) with an `<img>` tag, if the AI forgets to add Tailwind sizing classes (like `h-10 w-auto`), the browser might collapse the image to 0 pixels tall inside the flexbox header, making it invisible even if the link is correct!

## How we fixed it:
I have updated the **Web Design Agent's System Prompt** in `constants.ts` to be incredibly strict about these three things:
1. It explicitly tells the AI **not** to use an 'x' in Picsum URLs and gives a specific example for logos (`https://picsum.photos/200/60`).
2. It strictly forbids the AI from adding `.png` or `.jpg` to your uploaded image codes.
3. It instructs the AI to always add Tailwind sizing classes (like `h-10 w-auto`) when replacing a text logo with an image.

*Note: Because we updated the default system prompt in the code, you will need to click the "System Prompt" tab in the Web Design Agent and click "Save Changes" to force the new rules into your active session!*
