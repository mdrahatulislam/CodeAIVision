/* Built-in examples.
 * Each line may end with an annotation:   code   #: বাংলা ব্যাখ্যা || English explanation
 * ("#:" is just a Python comment, so the code still runs unchanged.)
 * `viz` tells the page which variables to draw as a neural-net / convolution picture.
 */
window.EXAMPLES = [
{
  id: "python-basics",
  title: { bn: "১. Python বেসিক: লুপ ও লিস্ট", en: "1. Python basics: loop & list" },
  desc: {
    bn: "লুপ কীভাবে একটি ভেরিয়েবলে ধাপে ধাপে যোগফল জমায় তা দেখুন।",
    en: "Watch a loop build up a running total, step by step."
  },
  code: `numbers = [3, 1, 4, 1, 5]  #: একটি তালিকা (list) বানানো হলো — ভেতরে পাঁচটি সংখ্যা || Create a list that holds five numbers
total = 0  #: যোগফল জমানোর ভেরিয়েবল, শুরুতে ০ || An accumulator for the sum, starting at 0
for n in numbers:  #: লুপ — প্রতিবার তালিকার পরের সংখ্যাটি \`n\`-এ আসে || Loop — \`n\` takes the next item of the list on every pass
    total += n  #: \`n\`-কে \`total\`-এর সাথে যোগ করা হলো || Add \`n\` to \`total\`
average = total / len(numbers)  #: মোট যোগফলকে সংখ্যার সংখ্যা দিয়ে ভাগ করে গড় || Divide the total by how many numbers there are to get the mean
print("sum =", total, "mean =", average)  #: ফলাফল আউটপুটে ছাপা হলো || Print the result
`
},
{
  id: "recursion",
  title: { bn: "২. ফাংশন ও রিকার্শন (Call Stack)", en: "2. Functions & recursion (call stack)" },
  desc: {
    bn: "ফাংশন নিজেকে ডাকলে call stack কীভাবে বাড়ে-কমে — ওপরের ‘Stack’ লাইনে দেখুন।",
    en: "See the call stack grow and unwind when a function calls itself (look at the Stack line)."
  },
  code: `def factorial(n):  #: ফাংশনের সংজ্ঞা — শুধু নামটি মনে রাখা হয়, ভেতরের কোড এখনো চলে না || Function definition — only the name is stored, the body does not run yet
    if n <= 1:  #: base case — \`n\` ১ বা কম হলে আর নিচে নামার দরকার নেই || Base case — stop going deeper once \`n\` is 1 or less
        return 1  #: ১ ফেরত দিয়ে রিকার্শন থামে || Return 1 and the recursion stops
    return n * factorial(n - 1)  #: \`n\` × (n-1)-এর factorial — ফাংশন নিজেকেই ডাকছে || \`n\` × factorial(n-1) — the function calls itself

result = factorial(4)  #: factorial(4) ডাকা হলো — stack গভীর হবে, তারপর একে একে ফিরবে || Call factorial(4): the stack grows deeper, then unwinds one frame at a time
print(result)  #: ফলাফল ছাপা || Print the result
`
},
{
  id: "neuron",
  title: { bn: "৩. একটি নিউরন (Forward + Loss)", en: "3. A single neuron (forward + loss)" },
  desc: {
    bn: "ওজন × ইনপুট → যোগ → bias → sigmoid → loss, প্রতিটি ধাপ আলাদা করে।",
    en: "Weights × inputs → sum → bias → sigmoid → loss, one operation at a time."
  },
  code: `import math  #: math মডিউল — exp() লাগবে sigmoid-এর জন্য || The math module — we need exp() for the sigmoid

x = [0.5, -1.0, 2.0]  #: ইনপুট — তিনটি বৈশিষ্ট্য (feature) || Input — three features
w = [0.8, 0.2, -0.5]  #: ওজন (weights) — প্রতিটি ইনপুট কতটা গুরুত্বপূর্ণ || Weights — how much each input matters
b = 0.1  #: bias — নিউরনের নিজস্ব ঝোঁক (offset) || Bias — the neuron's own offset
z = 0  #: ওজনযুক্ত যোগফলের জন্য ভেরিয়েবল || Variable for the weighted sum
for i in range(3):  #: তিনটি ইনপুটের ওপর একে একে ঘুরব || Go over the three inputs one by one
    z += w[i] * x[i]  #: ওজন × ইনপুট গুণ করে \`z\`-এ যোগ — এটাই dot product || Multiply weight × input and add to \`z\` — this is the dot product
z += b  #: শেষে bias যোগ || Finally add the bias
a = 1 / (1 + math.exp(-z))  #: sigmoid activation — \`z\`-কে ০ থেকে ১-এর মধ্যে চেপে আনে || Sigmoid activation — squeezes \`z\` into the range 0 to 1
target = 1.0  #: আমরা চাই আউটপুট ১ হোক || We want the output to be 1
loss = (a - target) ** 2  #: squared error — উত্তর যত ভুল, loss তত বড় || Squared error — the more wrong the output, the bigger the loss
print("z =", z, "output =", a, "loss =", loss)  #: ফলাফল দেখি || Show the numbers
`
},
{
  id: "mlp-forward",
  title: { bn: "৪. MLP Forward Pass (নেটওয়ার্ক ডায়াগ্রামসহ)", en: "4. MLP forward pass (with network diagram)" },
  desc: {
    bn: "২ → ৩ → ১ নেটওয়ার্ক। ডায়াগ্রামে নিউরনের রঙ = activation, রেখার রঙ = ওজন (কমলা ধনাত্মক, নীল ঋণাত্মক)।",
    en: "A 2 → 3 → 1 network. In the diagram node colour = activation, line colour = weight (orange positive, blue negative)."
  },
  viz: { type: "mlp", x: "x", layers: [{ W: "W1", b: "b1", a: "h" }, { W: "W2", b: "b2", a: "y" }] },
  code: `import math  #: sigmoid-এর জন্য math || math for the sigmoid

x = [1.0, 0.5]  #: ইনপুট ভেক্টর (২টি মান) || Input vector (2 values)
W1 = [[0.5, -0.4], [0.3, 0.8], [-0.6, 0.2]]  #: প্রথম layer-এর ওজন — ৩টি নিউরন × ২টি ইনপুট || Layer-1 weights — 3 neurons × 2 inputs
b1 = [0.1, 0.0, -0.1]  #: প্রথম layer-এর bias || Layer-1 biases
W2 = [[0.7, -0.5, 0.9]]  #: দ্বিতীয় layer-এর ওজন — ১টি নিউরন × ৩টি ইনপুট || Layer-2 weights — 1 neuron × 3 inputs
b2 = [0.05]  #: দ্বিতীয় layer-এর bias || Layer-2 bias

h = [0.0, 0.0, 0.0]  #: hidden layer-এর আউটপুট রাখার জায়গা || Place to store the hidden-layer outputs
for j in range(3):  #: প্রতিটি hidden নিউরনের জন্য || For every hidden neuron
    z = b1[j]  #: bias দিয়ে শুরু || Start from the bias
    for i in range(2):  #: প্রতিটি ইনপুটের ওপর || Over every input
        z += W1[j][i] * x[i]  #: ওজন × ইনপুট যোগ করে \`z\` বাড়ছে || Add weight × input to \`z\`
    h[j] = max(0.0, z)  #: ReLU — ঋণাত্মক হলে ০, নইলে যেমন আছে || ReLU — negative becomes 0, otherwise unchanged

y = [0.0]  #: চূড়ান্ত আউটপুটের জায়গা || Place for the final output
z = b2[0]  #: আউটপুট নিউরনের bias || Output neuron's bias
for j in range(3):  #: তিনটি hidden মানের ওপর || Over the three hidden values
    z += W2[0][j] * h[j]  #: ওজনযুক্ত যোগ || Weighted sum
y[0] = 1 / (1 + math.exp(-z))  #: sigmoid — আউটপুটকে সম্ভাবনার মতো (০–১) করে || Sigmoid — turns the output into a probability-like value (0–1)
print("output:", y[0])  #: চূড়ান্ত ফল || The final result
`
},
{
  id: "gradient-descent",
  title: { bn: "৫. Gradient Descent (লাইন ফিটিং)", en: "5. Gradient descent (fitting a line)" },
  desc: {
    bn: "y = 2x + 1 শেখানো হচ্ছে। নিচের চার্টে loss কমতে দেখুন, w ও b ২ ও ১-এর দিকে যাচ্ছে।",
    en: "Learning y = 2x + 1. Watch the loss chart fall while w and b move towards 2 and 1."
  },
  code: `xs = [1, 2, 3, 4]  #: ইনপুট ডেটা || Input data
ys = [3, 5, 7, 9]  #: সঠিক উত্তর — আসলে y = 2x + 1 || Correct answers — really y = 2x + 1
w = 0.0  #: ওজন, শুরুতে ০ (কিছুই জানি না) || Weight, starts at 0 (knows nothing)
b = 0.0  #: bias, শুরুতে ০ || Bias, starts at 0
lr = 0.05  #: learning rate — প্রতিবার কতটা পা ফেলব || Learning rate — how big each step is
losses = []  #: প্রতি epoch-এর loss জমা রাখব || Will store the loss of every epoch
for epoch in range(20):  #: ২০ বার পুরো ডেটার ওপর শেখা (epoch) || Learn from the whole data 20 times (epochs)
    dw = 0.0  #: w-এর gradient জমানোর ভেরিয়েবল || Accumulator for the gradient of w
    db = 0.0  #: b-এর gradient জমানোর ভেরিয়েবল || Accumulator for the gradient of b
    loss = 0.0  #: এই epoch-এর loss || This epoch's loss
    for k in range(4):  #: চারটি ডেটা পয়েন্টের ওপর || Over the four data points
        pred = w * xs[k] + b  #: মডেলের ভবিষ্যদ্বাণী || The model's prediction
        err = pred - ys[k]  #: ভুল কতটুকু || How wrong it is
        loss += err ** 2 / 4  #: গড় squared error-এ যোগ || Add to the mean squared error
        dw += 2 * err * xs[k] / 4  #: ∂loss/∂w — chain rule || ∂loss/∂w — chain rule
        db += 2 * err / 4  #: ∂loss/∂b || ∂loss/∂b
    w -= lr * dw  #: gradient-এর উল্টো দিকে w সরানো — এটাই descent || Move w against the gradient — that is the descent
    b -= lr * db  #: একইভাবে b || Same for b
    losses.append(loss)  #: loss ইতিহাসে রাখা — চার্টে দেখাবে || Save the loss — it appears in the chart
print("w =", round(w, 3), "b =", round(b, 3))  #: শেখা মান || The learned values
`
},
{
  id: "conv2d",
  title: { bn: "৬. Convolution (Sobel ফিল্টার + ReLU)", en: "6. Convolution (Sobel filter + ReLU)" },
  desc: {
    bn: "৩×৩ কার্নেল ছবির ওপর স্লাইড করে। ডায়াগ্রামে বর্তমান উইন্ডো চিহ্নিত থাকে।",
    en: "A 3×3 kernel slides over the image. The current window is outlined in the diagram."
  },
  viz: { type: "conv", image: "image", kernel: "kernel", out: "out", pos: ["i", "j"], acc: "s" },
  code: `image = [
    [9, 9, 9, 0, 0, 0],
    [9, 9, 9, 0, 0, 0],
    [9, 9, 9, 0, 0, 0],
    [0, 0, 0, 9, 9, 9],
    [0, 0, 0, 9, 9, 9],
    [0, 0, 0, 9, 9, 9],
]  #: ৬×৬ ছোট ছবি — ৯ = উজ্জ্বল, ০ = অন্ধকার || A tiny 6×6 image — 9 = bright, 0 = dark
kernel = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]  #: Sobel-X কার্নেল — ডান-বাম পার্থক্য (খাড়া edge) ধরে || Sobel-X kernel — detects left/right differences (vertical edges)
out = [[0] * 4, [0] * 4, [0] * 4, [0] * 4]  #: ৪×৪ ফিচার ম্যাপ (৬−৩+১ = ৪) || 4×4 feature map (6−3+1 = 4)
for i in range(4):  #: উইন্ডোর সারি-অবস্থান || Row position of the window
    for j in range(4):  #: উইন্ডোর কলাম-অবস্থান || Column position of the window
        s = 0  #: এই উইন্ডোর যোগফল || Sum for this window
        for u in range(3):  #: কার্নেলের সারি || Kernel row
            for v in range(3):  #: কার্নেলের কলাম || Kernel column
                s += image[i + u][j + v] * kernel[u][v]  #: ছবির পিক্সেল × কার্নেলের ওজন — যোগ হচ্ছে || Pixel × kernel weight, accumulated
        out[i][j] = s  #: যোগফল ফিচার ম্যাপের (i, j) ঘরে || Store the sum in cell (i, j) of the feature map
relu = [[max(0, v) for v in row] for row in out]  #: ReLU — ঋণাত্মক মান বাদ, শুধু ধনাত্মক edge থাকে || ReLU — drop negatives, keep only positive edges
print(relu)  #: চূড়ান্ত ফিচার ম্যাপ || The final feature map
`
},
{
  id: "numpy-dense",
  title: { bn: "৭. NumPy: Dense Layer ও Softmax", en: "7. NumPy: dense layer & softmax" },
  desc: {
    bn: "একসাথে ৩টি নমুনা: X @ W + b, তারপর ReLU, তারপর softmax। (NumPy প্রথমবার লোড হতে কয়েক সেকেন্ড লাগে।)",
    en: "Three samples at once: X @ W + b, then ReLU, then softmax. (NumPy takes a few seconds to load the first time.)"
  },
  code: `import numpy as np  #: NumPy — অ্যারে ও ম্যাট্রিক্স গণিতের লাইব্রেরি || NumPy — the array & matrix maths library

X = np.array([[1.0, 2.0], [3.0, 4.0], [-1.0, 0.5]])  #: ৩টি নমুনা × ২টি বৈশিষ্ট্য || 3 samples × 2 features
W = np.array([[0.2, -0.5, 0.1, 0.7], [0.4, 0.3, -0.6, 0.1]])  #: ওজন ম্যাট্রিক্স (২ ইনপুট → ৪ নিউরন) || Weight matrix (2 inputs → 4 neurons)
b = np.array([0.1, 0.0, -0.2, 0.05])  #: প্রতিটি নিউরনের bias || One bias per neuron
Z = X @ W + b  #: ম্যাট্রিক্স গুণ + bias (broadcasting) — তিন নমুনা একসাথে || Matrix product + bias (broadcasting) — all three samples at once
A = np.maximum(0, Z)  #: ReLU — ঋণাত্মক সবকিছু ০ || ReLU — every negative becomes 0
E = np.exp(Z - Z.max(axis=1, keepdims=True))  #: exp — আগে সারির সর্বোচ্চ বিয়োগ, যাতে সংখ্যা ফেটে না যায় || exp — subtract the row maximum first so numbers do not blow up
P = E / E.sum(axis=1, keepdims=True)  #: softmax — প্রতিটি সারির যোগফল ১ (সম্ভাবনা) || softmax — every row sums to 1 (probabilities)
print(P.sum(axis=1))  #: প্রতিটি সারির যোগফল ১ কি না যাচাই || Check that each row sums to 1
`
},
{
  id: "numpy-xor",
  title: { bn: "৮. NumPy: XOR শেখা (Backpropagation)", en: "8. NumPy: learning XOR (backpropagation)" },
  desc: {
    bn: "ছোট নিউরাল নেটওয়ার্ক XOR শিখছে — forward, loss, backward, আপডেট। চার্টে loss কমতে থাকে।",
    en: "A small neural network learning XOR — forward, loss, backward, update. The loss chart falls."
  },
  code: `import numpy as np  #: NumPy ইমপোর্ট || Import NumPy

np.random.seed(1)  #: র‍্যান্ডম সংখ্যা স্থির — প্রতিবার একই ফল || Fix the random numbers — same result every run
X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]], dtype=float)  #: XOR-এর চার ইনপুট || The four XOR inputs
Y = np.array([[0], [1], [1], [0]], dtype=float)  #: সঠিক আউটপুট (দুটো আলাদা হলে ১) || Targets (1 when the inputs differ)
W1 = np.random.randn(2, 4) * 0.8  #: প্রথম layer-এর ওজন — র‍্যান্ডম শুরু || First-layer weights — random start
b1 = np.zeros((1, 4))  #: প্রথম layer-এর bias || First-layer bias
W2 = np.random.randn(4, 1) * 0.8  #: দ্বিতীয় layer-এর ওজন || Second-layer weights
b2 = np.zeros((1, 1))  #: দ্বিতীয় layer-এর bias || Second-layer bias
lr = 2.0  #: learning rate (এখানে বড় নেওয়া হয়েছে যাতে ৪০ epoch-এই শেখা শেষ হয়) || Learning rate (kept large so 40 epochs are enough)
losses = []  #: loss ইতিহাস || Loss history
for epoch in range(40):  #: ৪০ বার প্রশিক্ষণ || Train for 40 epochs
    Z1 = X @ W1 + b1  #: forward: প্রথম layer-এর রৈখিক অংশ || Forward: linear part of layer 1
    A1 = np.tanh(Z1)  #: tanh activation — non-linearity এখান থেকেই আসে || tanh activation — this is where non-linearity comes from
    Z2 = A1 @ W2 + b2  #: forward: দ্বিতীয় layer || Forward: layer 2
    P = 1 / (1 + np.exp(-Z2))  #: sigmoid — সম্ভাবনা || Sigmoid — probability
    loss = float(-np.mean(Y * np.log(P) + (1 - Y) * np.log(1 - P)))  #: binary cross-entropy loss || Binary cross-entropy loss
    losses.append(loss)  #: চার্টের জন্য loss জমানো || Save the loss for the chart
    dZ2 = (P - Y) / 4  #: backward: আউটপুটের gradient (sigmoid + cross-entropy মিলে সরল) || Backward: output gradient (sigmoid + cross-entropy simplify nicely)
    dW2 = A1.T @ dZ2  #: W2-এর gradient || Gradient of W2
    db2 = dZ2.sum(axis=0, keepdims=True)  #: b2-এর gradient || Gradient of b2
    dA1 = dZ2 @ W2.T  #: gradient পেছনের layer-এ পাঠানো — backpropagation || Send the gradient back to layer 1 — backpropagation
    dZ1 = dA1 * (1 - A1 ** 2)  #: tanh-এর derivative দিয়ে গুণ || Multiply by the derivative of tanh
    dW1 = X.T @ dZ1  #: W1-এর gradient || Gradient of W1
    db1 = dZ1.sum(axis=0, keepdims=True)  #: b1-এর gradient || Gradient of b1
    W2 -= lr * dW2  #: gradient descent আপডেট || Gradient-descent update
    b2 -= lr * db2  #: আপডেট || Update
    W1 -= lr * dW1  #: আপডেট || Update
    b1 -= lr * db1  #: আপডেট || Update
print(np.round(P.ravel(), 2))  #: শেষ ভবিষ্যদ্বাণী — ০, ১, ১, ০-এর কাছাকাছি হওয়ার কথা || Final predictions — should approach 0, 1, 1, 0
`
}
];
